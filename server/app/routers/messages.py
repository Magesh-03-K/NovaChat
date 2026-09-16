from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user_id
from app.schemas.message import SendMessageRequest, DeleteMessagesRequest
from app.services import message_service

router = APIRouter()


@router.get("/chats/{chat_id}/messages")
def list_messages(
    chat_id: str,
    before: str | None = Query(default=None, description="ISO timestamp cursor for pagination"),
    limit: int = Query(default=50, le=100),
    user_id: str = Depends(get_current_user_id),
):
    """Phase 2: paginated message history for a chat, oldest-first."""
    return message_service.list_messages(user_id, chat_id, before, limit)


@router.post("/chats/{chat_id}/messages")
def send_message(chat_id: str, body: SendMessageRequest, user_id: str = Depends(get_current_user_id)):
    """Phase 2: send a message. Realtime delivery to other members happens
    automatically via Supabase's Postgres change feed — no extra call needed."""
    return message_service.send_message(user_id, chat_id, body.message_type, body.content, body.media_url)


@router.post("/chats/{chat_id}/read-all")
def mark_chat_read(chat_id: str, user_id: str = Depends(get_current_user_id)):
    """Mark all unread messages in a chat as read & delivered in a single batch operation."""
    return message_service.mark_chat_read(user_id, chat_id)



@router.post("/messages/{message_id}/delivered")
def mark_delivered(message_id: str, user_id: str = Depends(get_current_user_id)):
    """Phase 4: mark a message delivered."""
    return message_service.mark_delivered(user_id, message_id)


@router.post("/messages/{message_id}/read")
def mark_read(message_id: str, user_id: str = Depends(get_current_user_id)):
    """Phase 4: mark a message read."""
    return message_service.mark_read(user_id, message_id)


@router.post("/messages/delete")
def delete_messages(body: DeleteMessagesRequest, user_id: str = Depends(get_current_user_id)):
    """Delete one or more messages (delete_type: 'me' or 'everyone')."""
    return message_service.delete_messages(user_id, body.message_ids, body.delete_type)


