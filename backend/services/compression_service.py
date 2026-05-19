import os
import io
import zlib
import zipfile
import shutil
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Try imports gracefully
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

try:
    import docx
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

try:
    import ffmpeg
    FFMPEG_AVAILABLE = True
except ImportError:
    FFMPEG_AVAILABLE = False


def verify_integrity(output_path: str, file_type: str) -> bool:
    """Verify that the compressed file is valid."""
    try:
        if file_type == "image" and PIL_AVAILABLE:
            with Image.open(output_path) as img:
                img.verify()
            return True
        elif file_type == "document":
            ext = Path(output_path).suffix.lower()
            if ext == ".pdf" and PYMUPDF_AVAILABLE:
                doc = fitz.open(output_path)
                _ = doc.page_count
                doc.close()
                return True
            elif ext == ".zip":
                with zipfile.ZipFile(output_path, "r") as zf:
                    bad = zf.testzip()
                    return bad is None
            return True
        elif file_type == "archive":
            with zipfile.ZipFile(output_path, "r") as zf:
                bad = zf.testzip()
                return bad is None
        elif file_type == "video":
            return os.path.exists(output_path) and os.path.getsize(output_path) > 0
        return True
    except Exception as e:
        logger.error(f"Integrity check failed for {output_path}: {e}")
        return False


def compress_image_lossless(input_path: str, output_path: str) -> bool:
    if not PIL_AVAILABLE:
        return False
    try:
        with Image.open(input_path) as img:
            # Convert RGBA to RGB if saving as JPEG
            ext = Path(output_path).suffix.lower()
            if ext in [".jpg", ".jpeg"]:
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                img.save(output_path, "JPEG", optimize=True, quality=95)
            elif ext == ".png":
                img.save(output_path, "PNG", optimize=True, compress_level=9)
            elif ext == ".webp":
                img.save(output_path, "WEBP", lossless=True, quality=90)
            else:
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                img.save(output_path, optimize=True, quality=95)
        return True
    except Exception as e:
        logger.error(f"Lossless image compress failed: {e}")
        return False


def compress_image_smart(input_path: str, output_path: str) -> bool:
    if not PIL_AVAILABLE:
        return False
    try:
        with Image.open(input_path) as img:
            # Convert to RGB/RGBA appropriately
            if img.mode in ("P", "LA"):
                img = img.convert("RGBA")
            # Save as WebP for maximum compression
            webp_path = output_path.rsplit(".", 1)[0] + ".webp"
            if img.mode == "RGBA":
                img.save(webp_path, "WEBP", quality=72, method=6)
            else:
                rgb_img = img.convert("RGB")
                rgb_img.save(webp_path, "WEBP", quality=72, method=6)
            # Rename to expected output
            if webp_path != output_path:
                shutil.move(webp_path, output_path)
        return True
    except Exception as e:
        logger.error(f"Smart image compress failed: {e}")
        return False


def compress_pdf_lossless(input_path: str, output_path: str) -> bool:
    if not PYMUPDF_AVAILABLE:
        shutil.copy2(input_path, output_path)
        return True
    try:
        doc = fitz.open(input_path)
        doc.save(output_path, garbage=4, deflate=True, clean=True)
        doc.close()
        return True
    except Exception as e:
        logger.error(f"Lossless PDF compress failed: {e}")
        return False


def compress_pdf_smart(input_path: str, output_path: str) -> bool:
    if not PYMUPDF_AVAILABLE:
        shutil.copy2(input_path, output_path)
        return True
    try:
        doc = fitz.open(input_path)
        # Compress images within PDF aggressively
        for page in doc:
            img_list = page.get_images(full=True)
            for img_info in img_list:
                xref = img_info[0]
                try:
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    pil_img = Image.open(io.BytesIO(image_bytes))
                    if pil_img.mode in ("RGBA", "P"):
                        pil_img = pil_img.convert("RGB")
                    buffer = io.BytesIO()
                    pil_img.save(buffer, "JPEG", quality=55, optimize=True)
                    doc.update_stream(xref, buffer.getvalue())
                except Exception:
                    pass
        doc.save(output_path, garbage=4, deflate=True, clean=True, deflate_images=True)
        doc.close()
        return True
    except Exception as e:
        logger.error(f"Smart PDF compress failed: {e}")
        return False


def compress_docx(input_path: str, output_path: str, mode: str = "lossless") -> bool:
    """Compress DOCX by repackaging with higher ZIP compression."""
    try:
        with zipfile.ZipFile(input_path, "r") as zin:
            with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED,
                                 compresslevel=9 if mode == "smart_shrink" else 6) as zout:
                for item in zin.infolist():
                    data = zin.read(item.filename)
                    zout.writestr(item, data)
        return True
    except Exception as e:
        logger.error(f"DOCX compress failed: {e}")
        return False


def compress_txt(input_path: str, output_path: str, mode: str = "lossless") -> bool:
    """Compress text files using zlib into a small zip."""
    try:
        level = 9 if mode == "smart_shrink" else 6
        with open(input_path, "rb") as f:
            data = f.read()
        zip_path = output_path + ".zip"
        with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=level) as zf:
            zf.write(input_path, os.path.basename(input_path))
        shutil.move(zip_path, output_path)
        return True
    except Exception as e:
        logger.error(f"TXT compress failed: {e}")
        return False


def compress_zip(input_path: str, output_path: str, mode: str = "lossless") -> bool:
    """Recompress ZIP archive."""
    try:
        level = 9 if mode == "smart_shrink" else 6
        with zipfile.ZipFile(input_path, "r") as zin:
            with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED,
                                 compresslevel=level) as zout:
                for item in zin.infolist():
                    data = zin.read(item.filename)
                    zout.writestr(item, data)
        return True
    except Exception as e:
        logger.error(f"ZIP compress failed: {e}")
        return False


def compress_video_smart(input_path: str, output_path: str) -> bool:
    """Compress video using FFmpeg if available."""
    if not FFMPEG_AVAILABLE:
        logger.warning("FFmpeg not available, skipping video compression")
        return False
    try:
        (
            ffmpeg
            .input(input_path)
            .output(
                output_path,
                vcodec="libx264",
                crf=28,
                preset="fast",
                acodec="aac",
                audio_bitrate="128k",
            )
            .overwrite_output()
            .run(quiet=True)
        )
        return True
    except Exception as e:
        logger.error(f"Video compression failed: {e}")
        return False


def compress_file(input_path: str, output_path: str, file_type: str, mode: str) -> dict:
    """
    Main compression dispatcher.
    Returns dict with success, original_size, compressed_size, ratio.
    """
    original_size = os.path.getsize(input_path)
    ext = Path(input_path).suffix.lower()
    success = False

    try:
        if file_type == "image":
            if mode == "lossless":
                success = compress_image_lossless(input_path, output_path)
            else:
                success = compress_image_smart(input_path, output_path)

        elif file_type == "document":
            if ext == ".pdf":
                if mode == "lossless":
                    success = compress_pdf_lossless(input_path, output_path)
                else:
                    success = compress_pdf_smart(input_path, output_path)
            elif ext == ".docx":
                success = compress_docx(input_path, output_path, mode)
            elif ext == ".txt":
                success = compress_txt(input_path, output_path, mode)
            else:
                shutil.copy2(input_path, output_path)
                success = True

        elif file_type == "archive":
            success = compress_zip(input_path, output_path, mode)

        elif file_type == "video":
            if mode == "smart_shrink":
                success = compress_video_smart(input_path, output_path)
            else:
                shutil.copy2(input_path, output_path)
                success = True

        else:
            shutil.copy2(input_path, output_path)
            success = True

    except Exception as e:
        logger.error(f"Compression dispatch error: {e}")
        success = False

    if not success or not os.path.exists(output_path):
        return {"success": False, "original_size": original_size, "compressed_size": 0, "ratio": 0.0}

    # Integrity check
    if not verify_integrity(output_path, file_type):
        os.remove(output_path)
        return {"success": False, "original_size": original_size, "compressed_size": 0, "ratio": 0.0}

    compressed_size = os.path.getsize(output_path)

    # If output is larger, preserve original
    if compressed_size >= original_size:
        os.remove(output_path)
        shutil.copy2(input_path, output_path)
        compressed_size = original_size
        ratio = 0.0
        already_optimized = True
    else:
        ratio = round((1 - compressed_size / original_size) * 100, 2)
        already_optimized = False

    return {
        "success": True,
        "original_size": original_size,
        "compressed_size": compressed_size,
        "ratio": ratio,
        "already_optimized": already_optimized,
    }
