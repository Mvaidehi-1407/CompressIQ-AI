import os
import logging
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

logger = logging.getLogger(__name__)


def generate_key() -> bytes:
    """Generate a secure 256-bit AES key."""
    return AESGCM.generate_key(bit_length=256)


def generate_nonce() -> bytes:
    """Generate a secure 96-bit nonce for GCM."""
    return os.urandom(12)


def protect_file(input_path: str, output_path: str) -> dict:
    """
    Protect a file using AES-256-GCM.
    Returns key and nonce (never exposed to frontend).
    """
    try:
        key = generate_key()
        nonce = generate_nonce()
        aesgcm = AESGCM(key)

        with open(input_path, "rb") as f:
            plaintext = f.read()

        ciphertext = aesgcm.encrypt(nonce, plaintext, None)

        with open(output_path, "wb") as f:
            f.write(ciphertext)

        return {
            "success": True,
            "key": key,
            "nonce": nonce,
        }
    except Exception as e:
        logger.error(f"File protection failed: {e}")
        return {"success": False}


def unprotect_file(input_path: str, output_path: str, key: bytes, nonce: bytes) -> bool:
    """
    Decrypt and restore a protected file.
    """
    try:
        aesgcm = AESGCM(key)

        with open(input_path, "rb") as f:
            ciphertext = f.read()

        plaintext = aesgcm.decrypt(nonce, ciphertext, None)

        with open(output_path, "wb") as f:
            f.write(plaintext)

        return True
    except Exception as e:
        logger.error(f"File unprotection failed: {e}")
        return False
