from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, FileRecord
from sqlalchemy import func

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")


@analytics_bp.route("/overview", methods=["GET"])
@jwt_required()
def overview():
    user_id = get_jwt_identity()
    all_files = FileRecord.query.filter_by(user_id=user_id).all()

    total_files = len(all_files)
    unique_files = [f for f in all_files if not f.is_duplicate]
    duplicates = [f for f in all_files if f.is_duplicate]
    compressed = [f for f in all_files if f.is_compressed]
    protected = [f for f in all_files if f.is_protected]

    total_original = sum(f.original_size for f in unique_files)
    total_compressed = sum(f.compressed_size for f in compressed if f.compressed_size)
    total_saved = sum(
        (f.original_size - f.compressed_size)
        for f in compressed
        if f.compressed_size and f.original_size > f.compressed_size
    )
    duplicate_space = sum(f.original_size for f in duplicates)

    avg_ratio = 0.0
    ratios = [f.compression_ratio for f in compressed if f.compression_ratio]
    if ratios:
        avg_ratio = round(sum(ratios) / len(ratios), 2)

    # By type breakdown
    type_breakdown = {}
    for f in unique_files:
        ft = f.file_type
        if ft not in type_breakdown:
            type_breakdown[ft] = {"count": 0, "total_size": 0, "compressed_size": 0}
        type_breakdown[ft]["count"] += 1
        type_breakdown[ft]["total_size"] += f.original_size
        if f.is_compressed and f.compressed_size:
            type_breakdown[ft]["compressed_size"] += f.compressed_size

    # Mode breakdown
    lossless_count = len([f for f in compressed if f.compression_mode == "lossless"])
    smart_count = len([f for f in compressed if f.compression_mode == "smart_shrink"])

    return jsonify({
        "total_files": total_files,
        "unique_files": len(unique_files),
        "duplicate_files": len(duplicates),
        "compressed_files": len(compressed),
        "protected_files": len(protected),
        "total_original_bytes": total_original,
        "total_compressed_bytes": total_compressed,
        "total_saved_bytes": total_saved,
        "duplicate_space_bytes": duplicate_space,
        "avg_compression_ratio": avg_ratio,
        "type_breakdown": type_breakdown,
        "mode_breakdown": {"lossless": lossless_count, "smart_shrink": smart_count},
    })


@analytics_bp.route("/timeline", methods=["GET"])
@jwt_required()
def timeline():
    user_id = get_jwt_identity()
    files = FileRecord.query.filter_by(user_id=user_id, is_duplicate=False).all()

    daily = {}
    for f in files:
        day = f.uploaded_at.strftime("%Y-%m-%d")
        if day not in daily:
            daily[day] = {"uploads": 0, "size": 0, "savings": 0}
        daily[day]["uploads"] += 1
        daily[day]["size"] += f.original_size
        if f.is_compressed and f.compressed_size and f.original_size > f.compressed_size:
            daily[day]["savings"] += f.original_size - f.compressed_size

    timeline_data = [{"date": k, **v} for k, v in sorted(daily.items())]
    return jsonify({"timeline": timeline_data})
