import hashlib
import logging

logger = logging.getLogger(__name__)


def compute_sha256(file_path: str) -> str:
    """Compute SHA-256 hash of a file."""
    sha256 = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                sha256.update(chunk)
        return sha256.hexdigest()
    except Exception as e:
        logger.error(f"SHA-256 computation failed: {e}")
        return ""


def check_duplicate(file_hash: str, user_id: str, db, FileRecord) -> dict:
    """
    Check if a file with this hash already exists for this user.
    Returns {'is_duplicate': bool, 'original_id': str | None}
    """
    existing = (
        FileRecord.query
        .filter_by(user_id=user_id, sha256_hash=file_hash, is_duplicate=False)
        .first()
    )
    if existing:
        return {"is_duplicate": True, "original_id": existing.id, "original_filename": existing.original_filename}
    return {"is_duplicate": False, "original_id": None, "original_filename": None}
