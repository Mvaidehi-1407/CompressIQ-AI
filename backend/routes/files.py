import os
import uuid
import logging
import tempfile
import zipfile
from pathlib import Path
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from models import db, FileRecord
from services.duplicate_service import compute_sha256, check_duplicate
from services.protection_service import unprotect_file

logger = logging.getLogger(__name__)
files_bp = Blueprint("files", __name__, url_prefix="/api/files")

ALLOWED_TYPES = {
    "jpg": "image", "jpeg": "image", "png": "image", "webp": "image",
    "mp4": "video", "mov": "video", "avi": "video",
    "pdf": "document", "docx": "document", "txt": "document",
    "zip": "archive",
}

MIME_MAP = {
    "image": ["image/jpeg", "image/png", "image/webp", "image/gif"],
    "video": ["video/mp4", "video/quicktime", "video/x-msvideo"],
    "document": ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"],
    "archive": ["application/zip", "application/x-zip-compressed"],
}


def restored_download_name(record: FileRecord) -> str:
    return f"restored_{record.original_filename}"


def compressed_download_name(record: FileRecord) -> str:
    compressed_ext = Path(record.compressed_filename or record.original_filename).suffix
    original_stem = Path(record.original_filename).stem
    return f"compressed_{original_stem}{compressed_ext}"


def original_path(record: FileRecord) -> str:
    return os.path.join(current_app.config["UPLOAD_FOLDER"], record.stored_filename)


def compressed_path(record: FileRecord) -> str:
    return os.path.join(current_app.config["COMPRESSED_FOLDER"], record.compressed_filename)


def safe_zip_member(name: str) -> str:
    return secure_filename(name) or f"file_{uuid.uuid4()}"


def detect_file_type(filename: str) -> str | None:
    ext = Path(filename).suffix.lstrip(".").lower()
    return ALLOWED_TYPES.get(ext)


@files_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_file():
    user_id = get_jwt_identity()
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    file_type = detect_file_type(file.filename)
    if not file_type:
        return jsonify({"error": "Unsupported file type"}), 415

    # Read file data
    file_data = file.read()
    file_size = len(file_data)
    if file_size == 0:
        return jsonify({"error": "Empty file"}), 400
    if file_size > 100 * 1024 * 1024:
        return jsonify({"error": "File exceeds 100MB limit"}), 413

    # Store file with UUID name
    ext = Path(secure_filename(file.filename)).suffix.lower()
    stored_name = f"{uuid.uuid4()}{ext}"
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    stored_path = os.path.join(upload_folder, stored_name)

    with open(stored_path, "wb") as f:
        f.write(file_data)

    # Compute hash
    file_hash = compute_sha256(stored_path)

    # Duplicate check
    dup_result = check_duplicate(file_hash, user_id, db, FileRecord)

    record = FileRecord(
        user_id=user_id,
        original_filename=secure_filename(file.filename),
        stored_filename=stored_name,
        file_type=file_type,
        mime_type=file.content_type or "application/octet-stream",
        original_size=file_size,
        sha256_hash=file_hash,
        is_duplicate=dup_result["is_duplicate"],
        duplicate_of=dup_result["original_id"],
    )
    db.session.add(record)
    db.session.commit()

    resp = record.to_dict()
    if dup_result["is_duplicate"]:
        resp["duplicate_original"] = dup_result["original_filename"]

    return jsonify({"message": "File uploaded", "file": resp}), 201


@files_bp.route("/", methods=["GET"])
@jwt_required()
def list_files():
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)
    file_type = request.args.get("type")
    status = request.args.get("status")

    query = FileRecord.query.filter_by(user_id=user_id)
    if file_type:
        query = query.filter_by(file_type=file_type)
    if status == "duplicate":
        query = query.filter_by(is_duplicate=True)
    elif status == "compressed":
        query = query.filter_by(is_compressed=True)
    elif status == "protected":
        query = query.filter_by(is_protected=True)
    elif status == "unique":
        query = query.filter_by(is_duplicate=False)

    paginated = query.order_by(FileRecord.uploaded_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        "files": [f.to_dict() for f in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
        "page": page,
    })


@files_bp.route("/<file_id>", methods=["GET"])
@jwt_required()
def get_file(file_id):
    user_id = get_jwt_identity()
    record = FileRecord.query.filter_by(id=file_id, user_id=user_id).first()
    if not record:
        return jsonify({"error": "File not found"}), 404
    return jsonify({"file": record.to_dict()})


@files_bp.route("/<file_id>", methods=["DELETE"])
@jwt_required()
def delete_file(file_id):
    user_id = get_jwt_identity()
    record = FileRecord.query.filter_by(id=file_id, user_id=user_id).first()
    if not record:
        return jsonify({"error": "File not found"}), 404

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    compressed_folder = current_app.config["COMPRESSED_FOLDER"]
    protected_folder = current_app.config["PROTECTED_FOLDER"]

    for folder, name in [
        (upload_folder, record.stored_filename),
        (compressed_folder, record.compressed_filename),
        (protected_folder, record.protected_filename),
    ]:
        if name:
            path = os.path.join(folder, name)
            if os.path.exists(path):
                os.remove(path)

    db.session.delete(record)
    db.session.commit()
    return jsonify({"message": "File deleted"})


@files_bp.route("/<file_id>/download", methods=["GET"])
@jwt_required()
def download_file(file_id):
    user_id = get_jwt_identity()
    record = FileRecord.query.filter_by(id=file_id, user_id=user_id).first()
    if not record:
        return jsonify({"error": "File not found"}), 404

    version = request.args.get("version", "original")
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    compressed_folder = current_app.config["COMPRESSED_FOLDER"]

    if version == "compressed" and record.is_compressed and record.compressed_filename:
        path = os.path.join(compressed_folder, record.compressed_filename)
        download_name = "compressed_" + record.original_filename
    else:
        path = os.path.join(upload_folder, record.stored_filename)
        download_name = record.original_filename

    if not os.path.exists(path):
        return jsonify({"error": "File not found on disk"}), 404

    return send_file(path, as_attachment=True, download_name=download_name)


@files_bp.route("/<file_id>/download/compressed", methods=["GET"])
@jwt_required()
def download_compressed_file(file_id):
    user_id = get_jwt_identity()
    record = FileRecord.query.filter_by(id=file_id, user_id=user_id).first()
    if not record:
        return jsonify({"error": "File not found"}), 404
    if not record.is_compressed or not record.compressed_filename:
        return jsonify({"error": "No compressed version available"}), 404

    path = compressed_path(record)
    if not os.path.exists(path):
        return jsonify({"error": "Compressed file not found on disk"}), 404

    return send_file(path, as_attachment=True, download_name=compressed_download_name(record))


@files_bp.route("/<file_id>/download/restored", methods=["GET"])
@jwt_required()
def download_restored_file(file_id):
    user_id = get_jwt_identity()
    record = FileRecord.query.filter_by(id=file_id, user_id=user_id).first()
    if not record:
        return jsonify({"error": "File not found"}), 404
    if record.is_protected:
        return jsonify({"error": "File is protected; use restore endpoint"}), 400

    path = original_path(record)
    if not os.path.exists(path):
        return jsonify({"error": "Original file not found on disk"}), 404

    return send_file(
        path,
        as_attachment=True,
        download_name=restored_download_name(record),
        mimetype=record.mime_type or "application/octet-stream",
    )


@files_bp.route("/download/compressed/bulk", methods=["POST"])
@jwt_required()
def download_compressed_bulk():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    file_ids = data.get("file_ids") or []
    query = FileRecord.query.filter_by(user_id=user_id, is_duplicate=False)
    if file_ids:
        query = query.filter(FileRecord.id.in_(file_ids))

    records = [r for r in query.all() if r.is_compressed and r.compressed_filename]
    if not records:
        return jsonify({"error": "No compressed files available"}), 404

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
    tmp.close()
    with zipfile.ZipFile(tmp.name, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        used_names = set()
        for record in records:
            path = compressed_path(record)
            if not os.path.exists(path):
                continue
            name = safe_zip_member(compressed_download_name(record))
            if name in used_names:
                name = f"{Path(name).stem}_{record.id}{Path(name).suffix}"
            used_names.add(name)
            zf.write(path, name)

    return send_file(tmp.name, as_attachment=True, download_name="compressed_files.zip")


@files_bp.route("/download/restored/bulk", methods=["POST"])
@jwt_required()
def download_restored_bulk():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    file_ids = data.get("file_ids") or []
    query = FileRecord.query.filter_by(user_id=user_id, is_duplicate=False, is_protected=False)
    if file_ids:
        query = query.filter(FileRecord.id.in_(file_ids))

    records = query.all()
    if not records:
        return jsonify({"error": "No restored files available"}), 404

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
    tmp.close()
    with zipfile.ZipFile(tmp.name, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        used_names = set()
        for record in records:
            path = original_path(record)
            if not os.path.exists(path):
                continue
            name = safe_zip_member(restored_download_name(record))
            if name in used_names:
                name = f"{Path(name).stem}_{record.id}{Path(name).suffix}"
            used_names.add(name)
            zf.write(path, name)

    return send_file(tmp.name, as_attachment=True, download_name="restored_files.zip")


@files_bp.route("/<file_id>/restore", methods=["GET"])
@jwt_required()
def restore_file(file_id):
    """Restore a file explicitly. Query param `type` = 'exact'|'near' (default 'exact').
    - exact: serve original uploaded file when available
    - near: serve compressed output if available (near-original)
    """
    user_id = get_jwt_identity()
    record = FileRecord.query.filter_by(id=file_id, user_id=user_id).first()
    if not record:
        return jsonify({"error": "File not found"}), 404

    rtype = request.args.get('type', 'exact')
    upload_folder = current_app.config['UPLOAD_FOLDER']
    compressed_folder = current_app.config['COMPRESSED_FOLDER']
    protected_folder = current_app.config['PROTECTED_FOLDER']

    # If file is protected, prefer protection restore endpoint
    if record.is_protected:
        return jsonify({"error": "File is protected; use protection restore endpoint"}), 400

    if rtype == 'near':
        if record.is_compressed and record.compressed_filename:
            path = os.path.join(compressed_folder, record.compressed_filename)
            download_name = f"near_{record.original_filename}"
        else:
            return jsonify({"error": "No compressed version available"}), 404
    else:
        # exact restoration
        path = os.path.join(upload_folder, record.stored_filename)
        download_name = f"restored_{record.original_filename}"

    if not os.path.exists(path):
        return jsonify({"error": "File not found on disk"}), 404

    return send_file(path, as_attachment=True, download_name=download_name)
