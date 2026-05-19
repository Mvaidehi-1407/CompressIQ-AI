import os
import uuid
import tempfile
import logging
from datetime import datetime, timezone
from pathlib import Path
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, FileRecord, ProtectionKey
from services.protection_service import protect_file, unprotect_file

logger = logging.getLogger(__name__)
protection_bp = Blueprint("protection", __name__, url_prefix="/api/protect")


@protection_bp.route("/<file_id>", methods=["POST"])
@jwt_required()
def protect(file_id):
    user_id = get_jwt_identity()
    record = FileRecord.query.filter_by(id=file_id, user_id=user_id).first()
    if not record:
        return jsonify({"error": "File not found"}), 404
    if record.is_protected:
        return jsonify({"error": "File is already protected"}), 400
    if record.is_duplicate:
        return jsonify({"error": "Duplicate files cannot be protected"}), 400

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    compressed_folder = current_app.config["COMPRESSED_FOLDER"]
    protected_folder = current_app.config["PROTECTED_FOLDER"]

    if record.is_compressed and record.compressed_filename:
        source_path = os.path.join(compressed_folder, record.compressed_filename)
    else:
        source_path = os.path.join(upload_folder, record.stored_filename)

    if not os.path.exists(source_path):
        return jsonify({"error": "Source file not found"}), 404

    protected_name = f"{uuid.uuid4()}.enc"
    output_path = os.path.join(protected_folder, protected_name)

    result = protect_file(source_path, output_path)
    if not result["success"]:
        return jsonify({"error": "Protection failed"}), 500

    key_id = str(uuid.uuid4())
    pkey = ProtectionKey(id=key_id, file_id=record.id, key_data=result["key"], nonce=result["nonce"])
    db.session.add(pkey)

    record.is_protected = True
    record.protected_filename = protected_name
    record.protection_key_id = key_id
    record.protected_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({"message": "File protected with AES-256-GCM", "file": record.to_dict()})


@protection_bp.route("/<file_id>/restore", methods=["GET"])
@jwt_required()
def restore_protected(file_id):
    user_id = get_jwt_identity()
    record = FileRecord.query.filter_by(id=file_id, user_id=user_id).first()
    if not record or not record.is_protected:
        return jsonify({"error": "Protected file not found"}), 404

    pkey = ProtectionKey.query.filter_by(id=record.protection_key_id, file_id=record.id).first()
    if not pkey:
        return jsonify({"error": "Key not found"}), 500

    protected_folder = current_app.config["PROTECTED_FOLDER"]
    protected_path = os.path.join(protected_folder, record.protected_filename)
    if not os.path.exists(protected_path):
        return jsonify({"error": "Protected file missing"}), 404

    ext = Path(record.original_filename).suffix.lower()
    tmp_path = os.path.join(tempfile.gettempdir(), f"restore_{uuid.uuid4()}{ext}")

    if not unprotect_file(protected_path, tmp_path, pkey.key_data, pkey.nonce):
        return jsonify({"error": "Restoration failed"}), 500

    return send_file(tmp_path, as_attachment=True, download_name=f"restored_{record.original_filename}")


@protection_bp.route("/<file_id>/unprotect", methods=["DELETE"])
@jwt_required()
def unprotect(file_id):
    user_id = get_jwt_identity()
    record = FileRecord.query.filter_by(id=file_id, user_id=user_id).first()
    if not record or not record.is_protected:
        return jsonify({"error": "File not found or not protected"}), 404

    protected_folder = current_app.config["PROTECTED_FOLDER"]
    if record.protected_filename:
        path = os.path.join(protected_folder, record.protected_filename)
        if os.path.exists(path):
            os.remove(path)

    ProtectionKey.query.filter_by(file_id=record.id).delete()
    record.is_protected = False
    record.protected_filename = None
    record.protection_key_id = None
    record.protected_at = None
    db.session.commit()
    return jsonify({"message": "Protection removed", "file": record.to_dict()})
