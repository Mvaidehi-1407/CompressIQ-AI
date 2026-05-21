import argparse
import os
import shutil
import tempfile
from pathlib import Path
from services.compression_service import compress_video_smart, _probe_video, _choose_video_settings


def format_bytes(size: int) -> str:
    if size == 0:
        return "0 B"
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size < 1024.0:
            return f"{size:.1f} {unit}"
        size /= 1024.0
    return f"{size:.1f} PB"


def run_benchmark(paths, keep_output=False):
    tmp_dir = Path(tempfile.mkdtemp(prefix="compressiq-video-benchmark-"))
    try:
        for input_path in paths:
            input_path = Path(input_path)
            if not input_path.exists() or not input_path.is_file():
                print(f"SKIP: {input_path} does not exist or is not a file")
                continue
            if input_path.suffix.lower() not in {'.mp4', '.mov', '.avi'}:
                print(f"SKIP: {input_path} is not a supported video file")
                continue

            probe = _probe_video(str(input_path))
            print("\n=== VIDEO BENCHMARK ===")
            print(f"Input: {input_path}")
            print(f"Duration: {probe.get('duration', 0):.2f}s")
            print(f"Resolution: {probe.get('width')}x{probe.get('height')}")
            print(f"Video codec: {probe.get('video_codec')} | Video bitrate: {probe.get('video_bitrate')}bps")
            print(f"Audio codec: {probe.get('audio_codec')} | Audio bitrate: {probe.get('audio_bitrate')}bps")
            settings = _choose_video_settings(probe)
            print(f"Adaptive settings: crf={settings['crf']} preset={settings['preset']} acodec={settings['acodec']} audio_bitrate={settings['audio_bitrate']} skip={settings['skip_compression']}")

            target_name = tmp_dir / f"{input_path.stem}.compressed{input_path.suffix}"
            success = compress_video_smart(str(input_path), str(target_name))
            if not success or not target_name.exists():
                print("Result: compression failed")
                continue

            original_size = input_path.stat().st_size
            compressed_size = target_name.stat().st_size
            ratio = 0.0
            if original_size > 0:
                ratio = (1 - compressed_size / original_size) * 100
            print(f"Original size:   {format_bytes(original_size)}")
            print(f"Compressed size: {format_bytes(compressed_size)}")
            print(f"Savings:         {ratio:.2f}%")
            print(f"Compressed file: {target_name}")
            if not keep_output:
                try:
                    os.remove(target_name)
                except Exception:
                    pass
    finally:
        if not keep_output:
            try:
                shutil.rmtree(tmp_dir)
            except Exception:
                pass


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='CompressIQ video benchmark runner')
    parser.add_argument('videos', nargs='+', help='Video file paths to benchmark')
    parser.add_argument('--keep-output', action='store_true', help='Keep compressed output files')
    args = parser.parse_args()
    run_benchmark(args.videos, keep_output=args.keep_output)
