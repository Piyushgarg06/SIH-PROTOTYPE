#!/usr/bin/env python3
"""
MISR Demo — Raster Preprocessing Pipeline

Scans data/HR/ and data/LR/ directories, extracts raster metadata,
generates browser-friendly preview PNGs, and writes per-scene JSON manifests.

Run once: python scripts/preprocess_rasters.py
Re-run after adding new scenes to auto-discover them.
"""

import json
import os
import sys
from pathlib import Path

import numpy as np
import rasterio
from PIL import Image

# ─── Paths ────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
HR_DIR = DATA_DIR / "HR"
LR_DIR = DATA_DIR / "LR"
OUTPUT_DIR = DATA_DIR / "processed"


def ensure_dir(p: Path):
    p.mkdir(parents=True, exist_ok=True)


def normalize_band(arr: np.ndarray, percentile_low=2, percentile_high=98) -> np.ndarray:
    """Normalize a single band to 0-255 using percentile stretch."""
    valid = arr[arr > 0]  # skip nodata/zero
    if valid.size == 0:
        return np.zeros_like(arr, dtype=np.uint8)
    low = np.percentile(valid, percentile_low)
    high = np.percentile(valid, percentile_high)
    if high <= low:
        high = low + 1
    stretched = np.clip((arr.astype(np.float64) - low) / (high - low) * 255, 0, 255)
    return stretched.astype(np.uint8)


def normalize_multiband(arr: np.ndarray, percentile_low=2, percentile_high=98, gamma=1.15) -> np.ndarray:
    """Normalize a multi-band image (e.g. RGB) jointly across all channels to preserve natural radiometric color balance and tone."""
    valid = arr[arr > 0]
    if valid.size == 0:
        return np.zeros_like(arr, dtype=np.uint8)
    low = np.percentile(valid, percentile_low)
    high = np.percentile(valid, percentile_high)
    if high <= low:
        high = low + 1e-4
    norm = np.clip((arr.astype(np.float64) - low) / (high - low), 0, 1)
    if gamma != 1.0:
        norm = np.power(norm, 1.0 / gamma)
    return (norm * 255).astype(np.uint8)


def raster_metadata(filepath: Path) -> dict:
    """Extract geospatial metadata from a raster file."""
    with rasterio.open(filepath) as ds:
        bounds = ds.bounds
        transform = ds.transform
        return {
            "filepath": str(filepath.relative_to(ROOT)),
            "crs": str(ds.crs) if ds.crs else None,
            "width": ds.width,
            "height": ds.height,
            "bands": ds.count,
            "dtype": str(ds.dtypes[0]) if ds.dtypes else None,
            "nodata": ds.nodata,
            "bounds": {
                "left": bounds.left,
                "bottom": bounds.bottom,
                "right": bounds.right,
                "top": bounds.top,
            },
            "transform": list(transform)[:6],  # a, b, c, d, e, f
        }


def generate_rgb_preview(filepath: Path, output_path: Path):
    """Generate an RGB composite preview PNG from a multi-band raster with true color fidelity."""
    with rasterio.open(filepath) as ds:
        if ds.count >= 12:
            # Sentinel-2 L2A 12-band: Band 4 (Red), Band 3 (Green), Band 2 (Blue)
            r = ds.read(4).astype(np.float64)
            g = ds.read(3).astype(np.float64)
            b = ds.read(2).astype(np.float64)
        elif ds.count >= 3:
            # HR / 3-4 band: Band 1 (Red), Band 2 (Green), Band 3 (Blue)
            r = ds.read(1).astype(np.float64)
            g = ds.read(2).astype(np.float64)
            b = ds.read(3).astype(np.float64)
        elif ds.count == 1:
            r = g = b = ds.read(1).astype(np.float64)
        else:
            return None

    raw_rgb = np.stack([r, g, b], axis=-1)
    rgb = normalize_multiband(raw_rgb)
    img = Image.fromarray(rgb, "RGB")
    img.save(str(output_path), "PNG")
    return str(output_path.relative_to(ROOT))


def generate_false_color_preview(filepath: Path, output_path: Path):
    """Generate NIR-R-G false color composite."""
    with rasterio.open(filepath) as ds:
        if ds.count >= 12:
            # Sentinel-2 L2A 12-band: Band 8 (NIR), Band 4 (Red), Band 3 (Green)
            nir = ds.read(8).astype(np.float64)
            r = ds.read(4).astype(np.float64)
            g = ds.read(3).astype(np.float64)
        elif ds.count >= 4:
            # HR 4-band: Band 4 (NIR), Band 1 (Red), Band 2 (Green)
            nir = ds.read(4).astype(np.float64)
            r = ds.read(1).astype(np.float64)
            g = ds.read(2).astype(np.float64)
        else:
            return None

    raw_fc = np.stack([nir, r, g], axis=-1)
    rgb = normalize_multiband(raw_fc)
    img = Image.fromarray(rgb, "RGB")
    img.save(str(output_path), "PNG")
    return str(output_path.relative_to(ROOT))


def generate_single_band_preview(filepath: Path, output_path: Path, colormap="viridis"):
    """Generate a single-band heatmap preview."""
    with rasterio.open(filepath) as ds:
        data = ds.read(1).astype(np.float64)

    # Normalize to 0-1
    valid = data[data > 0] if np.any(data > 0) else data.ravel()
    if valid.size == 0:
        return None

    low, high = np.percentile(valid, [2, 98])
    if high <= low:
        high = low + 1
    norm = np.clip((data - low) / (high - low), 0, 1)

    if colormap == "viridis":
        # Simplified viridis-like: dark purple → teal → yellow
        r = np.clip(norm * 0.5 + norm ** 2 * 0.5, 0, 1)
        g = np.clip(norm * 0.8, 0, 1)
        b = np.clip(0.3 + norm * 0.2 - norm ** 2 * 0.5, 0, 1)
        rgb = np.stack([
            (r * 255).astype(np.uint8),
            (g * 255).astype(np.uint8),
            (b * 255).astype(np.uint8),
        ], axis=-1)
    elif colormap == "cloud":
        # White=cloudy, transparent=clear - using terracotta tones
        r_ch = np.full_like(norm, 0.85)
        g_ch = np.full_like(norm, 0.47)
        b_ch = np.full_like(norm, 0.25)
        # intensity = cloud probability
        rgb = np.stack([
            (r_ch * norm * 255).astype(np.uint8),
            (g_ch * norm * 255).astype(np.uint8),
            (b_ch * norm * 255).astype(np.uint8),
        ], axis=-1)
    elif colormap == "mask":
        # Binary-ish: olive for valid, brick for masked
        olive = np.array([0.48, 0.61, 0.43])
        brick = np.array([0.71, 0.33, 0.29])
        colors = np.where(norm[..., None] > 0.5, brick[None, None, :], olive[None, None, :])
        rgb = (colors * 255).astype(np.uint8)
    else:
        return None

    img = Image.fromarray(rgb, "RGB")
    img.save(str(output_path), "PNG")
    return str(output_path.relative_to(ROOT))


def process_hr_scene(scene_id: str, scene_dir: Path) -> dict:
    """Process a high-resolution scene directory."""
    manifest = {
        "scene_id": scene_id,
        "type": "HR",
        "rasters": {},
        "previews": {},
    }
    out_dir = OUTPUT_DIR / scene_id
    ensure_dir(out_dir)

    files = list(scene_dir.iterdir())
    for f in files:
        if f.suffix.lower() == ".png":
            # Ensure browser-friendly HR original PNG is normalized and saved to processed dir
            try:
                orig_img = Image.open(f)
                orig_arr = np.array(orig_img)
                if orig_arr.ndim == 3 and orig_arr.shape[2] >= 3:
                    if orig_arr.mean() < 35:
                        norm_ch = [normalize_band(orig_arr[:, :, i]) for i in range(3)]
                        norm_img = Image.fromarray(np.stack(norm_ch, axis=-1), "RGB")
                        norm_img.save(str(out_dir / "hr_rgb_original.png"), "PNG")
                    else:
                        orig_img.convert("RGB").save(str(out_dir / "hr_rgb_original.png"), "PNG")
                    manifest["previews"]["rgb_original"] = str((out_dir / "hr_rgb_original.png").relative_to(ROOT))
            except Exception as err:
                print(f"  WARNING: Failed original PNG {f.name}: {err}", file=sys.stderr)
            continue
        if f.suffix.lower() not in (".tiff", ".tif"):
            continue

        # Determine raster type from filename
        name_lower = f.stem.lower()
        if name_lower.endswith("_pan"):
            rtype = "pan"
        elif name_lower.endswith("_ps"):
            rtype = "ps"
        elif name_lower.endswith("_rgbn"):
            rtype = "rgbn"
        elif name_lower.endswith("_rgb"):
            rtype = "rgb"
        else:
            rtype = f.stem

        try:
            meta = raster_metadata(f)
            manifest["rasters"][rtype] = meta

            # Generate previews
            if rtype in ("ps", "rgbn", "rgb"):
                preview_path = out_dir / f"hr_{rtype}_rgb.png"
                rel = generate_rgb_preview(f, preview_path)
                if rel:
                    manifest["previews"][f"{rtype}_rgb"] = rel

            if rtype == "rgbn":
                fc_path = out_dir / f"hr_{rtype}_falsecolor.png"
                rel = generate_false_color_preview(f, fc_path)
                if rel:
                    manifest["previews"][f"{rtype}_falsecolor"] = rel

            if rtype == "pan":
                pan_path = out_dir / "hr_pan.png"
                rel = generate_single_band_preview(f, pan_path)
                if rel:
                    manifest["previews"]["pan"] = rel

        except Exception as e:
            print(f"  WARNING: Failed to process {f.name}: {e}", file=sys.stderr)

    return manifest


def process_lr_scene(scene_id: str, scene_dir: Path) -> dict:
    """Process a low-resolution scene directory (all candidates)."""
    manifest = {
        "scene_id": scene_id,
        "type": "LR",
        "candidates": {},
    }
    out_dir = OUTPUT_DIR / scene_id
    ensure_dir(out_dir)

    # Find L2A subdirectory
    l2a_dir = scene_dir / "L2A"
    if not l2a_dir.exists():
        print(f"  WARNING: No L2A directory found for {scene_id}", file=sys.stderr)
        return manifest

    # Discover candidates by finding *-L2A_data.tiff files
    data_files = sorted(l2a_dir.glob(f"*-L2A_data.tiff"))
    if not data_files:
        data_files = sorted(l2a_dir.glob(f"*-L2A_data.tif"))

    for data_file in data_files:
        # Extract candidate number from filename: SceneID-N-L2A_data.tiff
        stem = data_file.stem  # e.g. "ASMSpotter-1-1-1-2-L2A_data"
        # Remove the "-L2A_data" suffix to get the candidate prefix
        prefix = stem.replace("-L2A_data", "")
        # Candidate number is the last segment after the scene_id
        # Scene ID can contain hyphens, so we match by prefix
        if prefix.startswith(scene_id + "-"):
            cand_num = prefix[len(scene_id) + 1:]
        else:
            cand_num = prefix.split("-")[-1]

        cand_dir = out_dir / f"candidate_{cand_num}"
        ensure_dir(cand_dir)

        candidate = {
            "candidate_number": int(cand_num) if cand_num.isdigit() else cand_num,
            "rasters": {},
            "previews": {},
        }

        # Process L2A data (multi-band)
        try:
            meta = raster_metadata(data_file)
            candidate["rasters"]["l2a_data"] = meta

            # RGB preview from L2A bands
            preview_path = cand_dir / "lr_rgb.png"
            rel = generate_rgb_preview(data_file, preview_path)
            if rel:
                candidate["previews"]["rgb"] = rel

            # False color if enough bands
            fc_path = cand_dir / "lr_falsecolor.png"
            rel = generate_false_color_preview(data_file, fc_path)
            if rel:
                candidate["previews"]["falsecolor"] = rel
        except Exception as e:
            print(f"  WARNING: Failed L2A data for candidate {cand_num}: {e}", file=sys.stderr)

        # Process auxiliary rasters
        aux_types = {
            "CLM": ("cloud_mask", "mask"),
            "CLP": ("cloud_probability", "cloud"),
            "dataMask": ("data_mask", "mask"),
        }
        for suffix, (rtype, cmap) in aux_types.items():
            aux_file = l2a_dir / f"{prefix}-{suffix}.tiff"
            if not aux_file.exists():
                aux_file = l2a_dir / f"{prefix}-{suffix}.tif"
            if aux_file.exists():
                try:
                    meta = raster_metadata(aux_file)
                    candidate["rasters"][rtype] = meta

                    preview_path = cand_dir / f"lr_{rtype}.png"
                    rel = generate_single_band_preview(aux_file, preview_path, colormap=cmap)
                    if rel:
                        candidate["previews"][rtype] = rel
                except Exception as e:
                    print(f"  WARNING: Failed {suffix} for candidate {cand_num}: {e}", file=sys.stderr)

        # Read metadata file if it exists
        meta_file = l2a_dir / f"{prefix}.metadata"
        if meta_file.exists():
            try:
                with open(meta_file) as mf:
                    candidate["metadata_json"] = json.load(mf)
            except Exception as e:
                print(f"  WARNING: Failed to read metadata for candidate {cand_num}: {e}", file=sys.stderr)

        candidate_key = str(candidate["candidate_number"])
        manifest["candidates"][candidate_key] = candidate

    return manifest


def main():
    ensure_dir(OUTPUT_DIR)

    # Discover all scenes
    hr_scenes = sorted([d.name for d in HR_DIR.iterdir() if d.is_dir()]) if HR_DIR.exists() else []
    lr_scenes = sorted([d.name for d in LR_DIR.iterdir() if d.is_dir()]) if LR_DIR.exists() else []
    all_scene_ids = sorted(set(hr_scenes + lr_scenes))

    print(f"Discovered {len(all_scene_ids)} scenes: {all_scene_ids}")
    print(f"  HR scenes: {hr_scenes}")
    print(f"  LR scenes: {lr_scenes}")
    print()

    for scene_id in all_scene_ids:
        print(f"Processing scene: {scene_id}")
        scene_manifest = {
            "scene_id": scene_id,
            "has_hr": scene_id in hr_scenes,
            "has_lr": scene_id in lr_scenes,
            "hr": None,
            "lr": None,
        }

        if scene_id in hr_scenes:
            print(f"  Processing HR...")
            scene_manifest["hr"] = process_hr_scene(scene_id, HR_DIR / scene_id)

        if scene_id in lr_scenes:
            print(f"  Processing LR...")
            scene_manifest["lr"] = process_lr_scene(scene_id, LR_DIR / scene_id)

        # Write manifest
        manifest_path = OUTPUT_DIR / f"{scene_id}.json"
        with open(manifest_path, "w") as f:
            json.dump(scene_manifest, f, indent=2)
        print(f"  Wrote manifest: {manifest_path}")
        print()

    # Write index of all scenes
    index = {
        "scenes": all_scene_ids,
        "hr_scenes": hr_scenes,
        "lr_scenes": lr_scenes,
    }
    with open(OUTPUT_DIR / "index.json", "w") as f:
        json.dump(index, f, indent=2)
    print(f"Wrote scene index: {OUTPUT_DIR / 'index.json'}")

    # Also copy to app/public/data/processed
    app_public_processed = ROOT / "app" / "public" / "data" / "processed"
    import shutil
    if app_public_processed.exists():
        shutil.rmtree(app_public_processed)
    shutil.copytree(OUTPUT_DIR, app_public_processed)
    print(f"Synced to {app_public_processed}")
    print("Done!")


if __name__ == "__main__":
    main()
