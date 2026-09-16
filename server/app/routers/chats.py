from fastapi import APIRouter, Depends

from app.core.security import get_current_user_id
from app.schemas.chat import CreateChatRequest
from app.services import chat_service

router = APIRouter()


@router.get("")
def list_chats(user_id: str = Depends(get_current_user_id)):
    """Phase 2: list chats for the current user with last message preview."""
    return chat_service.list_chats_for_user(user_id)


@router.post("")
def create_chat(body: CreateChatRequest, user_id: str = Depends(get_current_user_id)):
    """Phase 2/6: create a direct or group chat. Direct chats between the
    same two users are deduped automatically."""
    return chat_service.create_chat(user_id, body.type, body.member_ids, body.name)


@router.get("/{chat_id}")
def get_chat(chat_id: str, user_id: str = Depends(get_current_user_id)):
    """Phase 2: fetch chat metadata and members (403 if not a member)."""
    return chat_service.get_chat(user_id, chat_id)


@router.delete("/{chat_id}")
def delete_chat(chat_id: str, user_id: str = Depends(get_current_user_id)):
    """Phase 6: leave or delete a chat room."""
    return chat_service.delete_or_leave_chat(user_id, chat_id)

