from fastapi import APIRouter, Depends, UploadFile, File

from app.core.security import get_current_user_id
from app.services import media_service

router = APIRouter()


@router.post("/upload")
async def upload_media(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    """Phase 5: upload a file to Supabase Storage, return a public URL to
    reference from a message's `media_url` field."""
    content = await file.read()
    url = media_service.upload_file(user_id, file.filename, content, file.content_type)
    return {"url": url}
