import os
import uuid
import logging
from datetime import datetime, timezone
from pathlib import Path
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, FileRecord
from services.compression_service import compress_file

logger = logging.getLogger(__name__)
compression_bp = Blueprint("compression", __name__, url_prefix="/api/compress")

RECOMMENDATIONS = {
    "image": {
        "lossless": "Lossless Vault preserves every pixel — ideal for photos you want to archive safely.",
        "smart_shrink": "Smart Shrink converts to WebP for maximum savings — up to 60% smaller with near-identical quality.",
        "default": "smart_shrink",
    },
    "document": {
        "lossless": "Lossless Vault safely deflates PDF/DOCX without touching content — great for important documents.",
        "smart_shrink": "Smart Shrink aggressively compresses embedded images in PDFs for maximum reduction.",
        "default": "lossless",
    },
    "video": {
        "lossless": "Videos are copied as-is in Lossless mode (FFmpeg not applied).",
        "smart_shrink": "Smart Shrink uses H.264 re-encoding with CRF 28 — significant savings for large videos.",
        "default": "smart_shrink",
    },
    "archive": {
        "lossless": "Lossless Vault re-deflates the ZIP at compression level 6.",
        "smart_shrink": "Smart Shrink maximizes deflate compression at level 9.",
        "default": "smart_shrink",
    },
}


@compression_bp.route("/recommend/<file_id>", methods=["GET"])
@jwt_required()
def recommend(file_id):
    user_id = get_jwt_identity()
    record = FileRecord.query.filter_by(id=file_id, user_id=user_id).first()
    if not record:
        return jsonify({"error": "File not found"}), 404
    if record.is_duplicate:
        return jsonify({"error": "Duplicate files cannot be compressed"}), 400

    rec = RECOMMENDATIONS.get(record.file_type, {})
    return jsonify({
        "file_id": file_id,
        "file_type": record.file_type,
        "original_size": record.original_size,
        "recommendation": rec,
    })


@compression_bp.route("/<file_id>", methods=["POST"])
@jwt_required()
def compress(file_id):
    user_id = get_jwt_identity()
    record = FileRecord.query.filter_by(id=file_id, user_id=user_id).first()
    if not record:
        return jsonify({"error": "File not found"}), 404
    if record.is_duplicate:
        return jsonify({"error": "Duplicate files cannot be compressed"}), 400
    if record.is_compressed:
        return jsonify({"error": "File is already compressed"}), 400

    data = request.get_json() or {}
    mode = data.get("mode", RECOMMENDATIONS.get(record.file_type, {}).get("default", "lossless"))
    if mode not in ("lossless", "smart_shrink"):
        return jsonify({"error": "Invalid compression mode"}), 400

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    compressed_folder = current_app.config["COMPRESSED_FOLDER"]

    input_path = os.path.join(upload_folder, record.stored_filename)
    if not os.path.exists(input_path):
        return jsonify({"error": "Source file not found"}), 404

    ext = Path(record.stored_filename).suffix.lower()
    # Smart shrink images → webp
    if record.file_type == "image" and mode == "smart_shrink":
        ext = ".webp"

    compressed_name = f"{uuid.uuid4()}{ext}"
    output_path = os.path.join(compressed_folder, compressed_name)

    result = compress_file(input_path, output_path, record.file_type, mode)

    if not result["success"]:
        return jsonify({"error": "Compression failed — original preserved"}), 500

    record.is_compressed = True
    record.compression_mode = mode
    record.compressed_filename = compressed_name
    record.compressed_size = result["compressed_size"]
    record.compression_ratio = result["ratio"]
    record.is_already_optimized = result.get("already_optimized", False)
    record.compressed_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        "message": "Compression complete",
        "file": record.to_dict(),
        "result": {
            "original_size": result["original_size"],
            "compressed_size": result["compressed_size"],
            "ratio": result["ratio"],
            "already_optimized": result.get("already_optimized", False),
        },
    })


@compression_bp.route("/bulk", methods=["POST"])
@jwt_required()
def bulk_compress():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    file_ids = data.get("file_ids", [])
    mode = data.get("mode", "lossless")

    if not file_ids:
        return jsonify({"error": "No file IDs provided"}), 400

    results = []
    for fid in file_ids:
        record = FileRecord.query.filter_by(id=fid, user_id=user_id).first()
        if not record or record.is_duplicate or record.is_compressed:
            results.append({"file_id": fid, "skipped": True})
            continue

        upload_folder = current_app.config["UPLOAD_FOLDER"]
        compressed_folder = current_app.config["COMPRESSED_FOLDER"]
        input_path = os.path.join(upload_folder, record.stored_filename)
        ext = Path(record.stored_filename).suffix.lower()
        if record.file_type == "image" and mode == "smart_shrink":
            ext = ".webp"
        compressed_name = f"{uuid.uuid4()}{ext}"
        output_path = os.path.join(compressed_folder, compressed_name)

        result = compress_file(input_path, output_path, record.file_type, mode)
        if result["success"]:
            record.is_compressed = True
            record.compression_mode = mode
            record.compressed_filename = compressed_name
            record.compressed_size = result["compressed_size"]
            record.compression_ratio = result["ratio"]
            record.is_already_optimized = result.get("already_optimized", False)
            record.compressed_at = datetime.now(timezone.utc)
            db.session.commit()
            results.append({"file_id": fid, "success": True, "ratio": result["ratio"]})
        else:
            results.append({"file_id": fid, "success": False})

    return jsonify({"results": results})
