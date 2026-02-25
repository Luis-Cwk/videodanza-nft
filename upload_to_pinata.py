#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Upload all videos from C:/Users/petra/videodanza-nft/videos to Pinata IPFS
Generates ipfs_lookup_table.json with all video metadata
"""

import os
import json
import requests
import sys
from pathlib import Path
from datetime import datetime

# Force UTF-8 output on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Configuration
VIDEOS_DIR = "C:/Users/petra/videodanza-nft/videos"
OUTPUT_FILE = "C:/Users/petra/videodanza-nft/frontend/public/ipfs_lookup_table.json"
PINATA_API_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"

# YOUR PINATA API KEYS
PINATA_API_KEY = "7b637f83cd612e7181f3"
PINATA_SECRET_KEY = "ad944b10d336ed207f48e36121b00249ac064b7e0357a56a0a69bf86d711cd7f"
PINATA_GATEWAY = "https://gateway.pinata.cloud"

def upload_video_to_pinata(video_path: str) -> dict:
    """Upload a single video file to Pinata and return metadata"""
    
    file_name = os.path.basename(video_path)
    file_size = os.path.getsize(video_path)
    
    print(f"Uploading: {file_name} ({file_size / 1024 / 1024:.1f} MB)...")
    
    headers = {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_SECRET_KEY,
    }
    
    try:
        with open(video_path, "rb") as f:
            files = {"file": (file_name, f)}
            response = requests.post(PINATA_API_URL, files=files, headers=headers, timeout=300)
        
        if response.status_code == 200:
            data = response.json()
            cid = data["IpfsHash"]
            return {
                "cid": cid,
                "ipfs": f"ipfs://{cid}",
                "gateway": f"{PINATA_GATEWAY}/ipfs/{cid}",
                "fileSize": file_size,
                "uploadTime": datetime.now().isoformat(),
            }
        else:
            print(f"  ❌ Error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"  ❌ Exception: {str(e)}")
        return None


def generate_lookup_table():
    """Generate complete IPFS lookup table for all videos"""
    
    # Get all MP4 files from videos directory
    video_files = sorted([f for f in os.listdir(VIDEOS_DIR) if f.endswith(".mp4")])
    
    if not video_files:
        print(f"❌ No MP4 files found in {VIDEOS_DIR}")
        return
    
    print(f"Found {len(video_files)} videos to upload\n")
    
    videos = {}
    for video_file in video_files:
        video_path = os.path.join(VIDEOS_DIR, video_file)
        metadata = upload_video_to_pinata(video_path)
        
        if metadata:
            videos[video_file] = metadata
            print(f"  ✓ {video_file} → {metadata['cid'][:16]}...\n")
        else:
            print(f"  ⚠ Skipped {video_file}\n")
    
    # Generate lookup table
    lookup_table = {
        "network": "sepolia",
        "chainId": 11155111,
        "contractAddress": "0xA4bFA5843B6134a55310D1346b31BD7Bd29CfFEf",
        "timestamp": datetime.now().isoformat(),
        "gateway": PINATA_GATEWAY,
        "videos": videos,
    }
    
    # Save to file
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(lookup_table, f, indent=2)
    
    print(f"\n✓ Generated {OUTPUT_FILE}")
    print(f"  Total videos: {len(videos)}")
    print(f"  Total size: {sum(v['fileSize'] for v in videos.values()) / 1024 / 1024 / 1024:.2f} GB")


if __name__ == "__main__":
    print("=" * 50)
    print("  Pinata IPFS Video Uploader - VideoDanza")
    print("=" * 50 + "\n")
    
    # Check if API keys are configured
    if PINATA_API_KEY == "YOUR_PINATA_API_KEY":
        print("❌ ERROR: Configure Pinata API keys first!")
        print("\n1. Go to https://pinata.cloud")
        print("2. Get your API Key and Secret Key")
        print("3. Replace PINATA_API_KEY and PINATA_SECRET_KEY in this script")
        exit(1)
    
    generate_lookup_table()
