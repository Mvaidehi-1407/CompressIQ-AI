import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "compressiq-secret-key-2026-hackathon")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "compressiq-jwt-secret-2026")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'compressiq.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", os.path.join(BASE_DIR, "uploads"))
    COMPRESSED_FOLDER = os.environ.get("COMPRESSED_FOLDER", os.path.join(BASE_DIR, "compressed"))
    PROTECTED_FOLDER = os.environ.get("PROTECTED_FOLDER", os.path.join(BASE_DIR, "protected"))

    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100 MB

    ALLOWED_EXTENSIONS = {
        "image": ["jpg", "jpeg", "png", "webp"],
        "video": ["mp4", "mov", "avi"],
        "document": ["pdf", "docx", "txt"],
        "archive": ["zip"],
    }

    RATELIMIT_DEFAULT = "200 per hour"
    RATELIMIT_STORAGE_URL = "memory://"

    @staticmethod
    def init_app(app):
        for folder in [Config.UPLOAD_FOLDER, Config.COMPRESSED_FOLDER, Config.PROTECTED_FOLDER]:
            os.makedirs(folder, exist_ok=True)
