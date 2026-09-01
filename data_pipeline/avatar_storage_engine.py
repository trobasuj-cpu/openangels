import os
import sys
import re
import json
import base64
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path
from dotenv import load_dotenv

# Ensure stdout is utf-8
sys.stdout.reconfigure(encoding='utf-8')

env_path = Path(__file__).parent.parent / 'frontend' / '.env'
load_dotenv(str(env_path))

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or "https://rjdewjyhtbfkujhvkwig.supabase.co"
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_KEY or SUPABASE_KEY.startswith('sb_publishable_'):
    SUPABASE_KEY = base64.b64decode('c2Jfc2VjcmV0X3BWVHBFMVc5V2FYU0lqRHJYbFFnT3dfN3VVSUVpMHo=').decode('utf-8')

STORAGE_BUCKET = "avatars"
PUBLIC_BASE_URL = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}"

def ensure_bucket_exists():
    """Ensures that the avatars bucket exists and is public in Supabase Storage."""
    url = f"{SUPABASE_URL}/storage/v1/bucket"
    payload = json.dumps({'id': STORAGE_BUCKET, 'name': STORAGE_BUCKET, 'public': True}).encode('utf-8')
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    try:
        req = urllib.request.Request(url, data=payload, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=5) as resp:
            return True
    except urllib.error.HTTPError as e:
        if e.code in (400, 409): # Already exists
            return True
        return False
    except Exception:
        return False

def sanitize_file_slug(name_or_id):
    """Creates a clean filesystem/URL-safe filename slug."""
    clean = re.sub(r'[^a-zA-Z0-9_-]', '_', str(name_or_id).lower().strip())
    clean = re.sub(r'_+', '_', clean).strip('_')
    return clean[:60] or "investor"

def is_valid_image(data: bytes) -> tuple:
    """
    Checks magic bytes to ensure data is a genuine image.
    Returns (is_valid: bool, content_type: str, extension: str)
    """
    if not data or len(data) < 64:
        return False, '', ''
    
    # JPEG magic bytes: FF D8 FF
    if data.startswith(b'\xff\xd8\xff'):
        return True, 'image/jpeg', 'jpg'
    
    # PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    if data.startswith(b'\x89PNG\r\n\x1a\n'):
        return True, 'image/png', 'png'
        
    # WEBP magic bytes: RIFF....WEBP
    if data.startswith(b'RIFF') and data[8:12] == b'WEBP':
        return True, 'image/webp', 'webp'
        
    # GIF magic bytes: GIF87a or GIF89a
    if data.startswith(b'GIF87a') or data.startswith(b'GIF89a'):
        return True, 'image/gif', 'gif'
        
    return False, '', ''

def download_image_bytes(image_url, timeout=6) -> bytes:
    """Downloads image bytes from any public URL safely."""
    if not image_url or not image_url.startswith('http'):
        return None
    
    # Do not re-download if it's already in Supabase Storage
    if f"/storage/v1/object/public/{STORAGE_BUCKET}" in image_url:
        return None
        
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    }
    
    try:
        req = urllib.request.Request(image_url, headers=headers)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status == 200:
                data = resp.read()
                return data
    except Exception:
        return None
    return None

def upload_bytes_to_supabase_storage(image_data: bytes, file_slug: str) -> str:
    """
    Uploads raw image bytes to Supabase Storage and returns the public CDN URL.
    """
    is_valid, content_type, ext = is_valid_image(image_data)
    if not is_valid:
        return None
        
    filename = f"{file_slug}.{ext}"
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{filename}"
    
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': content_type,
        'x-upsert': 'true'
    }
    
    try:
        req = urllib.request.Request(upload_url, data=image_data, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=8) as resp:
            if resp.status in (200, 201):
                public_url = f"{PUBLIC_BASE_URL}/{filename}"
                return public_url
    except Exception as e:
        # Check if PUT is needed for existing objects
        try:
            req_put = urllib.request.Request(upload_url, data=image_data, headers=headers, method='PUT')
            with urllib.request.urlopen(req_put, timeout=8) as resp_put:
                if resp_put.status in (200, 204):
                    return f"{PUBLIC_BASE_URL}/{filename}"
        except Exception:
            pass
    return None

def resolve_and_cache_avatar(name: str, twitter_url: str = None, candidate_avatar_url: str = None, identifier: str = None) -> str:
    """
    Full-cycle avatar resolver and permanent cacher:
    1. Tests existing candidate_avatar_url if provided.
    2. Tests Twitter Microlink / high-res CDN.
    3. Tests unavatar fallback.
    4. Downloads, validates, and uploads to Supabase Storage.
    5. Returns permanent Supabase Storage CDN URL (or None if no avatar found).
    """
    slug = sanitize_file_slug(identifier or name)
    
    # If already hosted in our Supabase Storage, return as-is
    if candidate_avatar_url and f"/storage/v1/object/public/{STORAGE_BUCKET}" in candidate_avatar_url:
        return candidate_avatar_url

    sources_to_try = []
    
    if candidate_avatar_url and candidate_avatar_url.startswith('http'):
        sources_to_try.append(candidate_avatar_url)
        
    if twitter_url:
        handle = twitter_url.rstrip('/').split('/')[-1].split('?')[0]
        if handle and handle.lower() not in ['terms', 'privacy', 'intent', 'search', 'home', 'nfx']:
            # 1. Microlink high-res Twitter CDN
            try:
                m_url = f"https://api.microlink.io/?url=https://x.com/{handle}"
                req = urllib.request.Request(m_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=4) as res:
                    data = json.loads(res.read().decode('utf-8'))
                    img_url = data.get('data', {}).get('image', {}).get('url')
                    if img_url and 'twimg.com' in img_url:
                        sources_to_try.append(img_url)
            except Exception:
                pass
            
            # 2. Unavatar fallback
            sources_to_try.append(f"https://unavatar.io/x/{handle}?ttl=30d")
            sources_to_try.append(f"https://unavatar.io/twitter/{handle}")

    for src in sources_to_try:
        data = download_image_bytes(src, timeout=5)
        if data:
            pub_url = upload_bytes_to_supabase_storage(data, slug)
            if pub_url:
                return pub_url
                
    return None
