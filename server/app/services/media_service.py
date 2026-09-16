"""Phase 5: Supabase Storage upload for images, video, documents, and
voice messages. Free within the project's storage quota — no S3/CDN
account or billing needed."""
import uuid

from app.core.supabase_client import supabase

BUCKET = "chat-media"


def upload_file(user_id: str, filename: str, content: bytes, content_type: str) -> str:
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    path = f"{user_id}/{uuid.uuid4()}.{ext}"

    supabase.storage.from_(BUCKET).upload(
        path, content, {"content-type": content_type}
    )
    return supabase.storage.from_(BUCKET).get_public_url(path)
