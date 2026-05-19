import uuid
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def gen_uuid():
    return str(uuid.uuid4())


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    files = db.relationship("FileRecord", backref="owner", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat(),
        }


class FileRecord(db.Model):
    __tablename__ = "files"

    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)  # image, video, document, archive
    mime_type = db.Column(db.String(100))
    original_size = db.Column(db.BigInteger, default=0)
    compressed_size = db.Column(db.BigInteger, default=0)
    sha256_hash = db.Column(db.String(64), nullable=False)

    # Status fields
    is_duplicate = db.Column(db.Boolean, default=False)
    duplicate_of = db.Column(db.String(36), nullable=True)
    is_compressed = db.Column(db.Boolean, default=False)
    is_protected = db.Column(db.Boolean, default=False)
    is_already_optimized = db.Column(db.Boolean, default=False)

    # Compression details
    compression_mode = db.Column(db.String(50), nullable=True)  # lossless, smart_shrink
    compressed_filename = db.Column(db.String(255), nullable=True)
    compression_ratio = db.Column(db.Float, default=0.0)

    # Protection details
    protected_filename = db.Column(db.String(255), nullable=True)
    protection_key_id = db.Column(db.String(36), nullable=True)

    uploaded_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    compressed_at = db.Column(db.DateTime, nullable=True)
    protected_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "original_filename": self.original_filename,
            "file_type": self.file_type,
            "mime_type": self.mime_type,
            "original_size": self.original_size,
            "compressed_size": self.compressed_size,
            "sha256_hash": self.sha256_hash,
            "is_duplicate": self.is_duplicate,
            "duplicate_of": self.duplicate_of,
            "is_compressed": self.is_compressed,
            "is_protected": self.is_protected,
            "is_already_optimized": self.is_already_optimized,
            "compression_mode": self.compression_mode,
            "compression_ratio": self.compression_ratio,
            "uploaded_at": self.uploaded_at.isoformat(),
            "compressed_at": self.compressed_at.isoformat() if self.compressed_at else None,
            "protected_at": self.protected_at.isoformat() if self.protected_at else None,
        }


class ProtectionKey(db.Model):
    __tablename__ = "protection_keys"

    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    file_id = db.Column(db.String(36), db.ForeignKey("files.id"), nullable=False)
    key_data = db.Column(db.LargeBinary, nullable=False)
    nonce = db.Column(db.LargeBinary, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
