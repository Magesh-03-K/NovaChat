"""
Phase 2/4: message send/list logic, delivery + read receipt state transitions,
and WhatsApp-style Message Deletion (Delete for me vs Delete for everyone).

No manual "broadcast" call is needed here — the messages and message_deletions
tables are in the `supabase_realtime` publication, so every insert/update is
pushed to subscribed clients automatically.
"""
from datetime import datetime, timezone
from fastapi import HTTPException, status

from app.core.supabase_client import supabase
from app.services.chat_service import assert_member


def list_messages(user_id: str, chat_id: str, before: str | None, limit: int) -> list[dict]:
    try:
        assert_member(user_id, chat_id)

        # 1. Fetch per-user deletions ("Delete for me") for current user
        deleted_msg_ids = set()
        try:
            del_res = (
                supabase.table("message_deletions")
                .select("message_id")
                .eq("user_id", user_id)
                .execute()
            )
            if del_res and getattr(del_res, "data", None):
                deleted_msg_ids = {r["message_id"] for r in del_res.data if "message_id" in r}
        except Exception:
            pass

        # 2. Fetch message history
        query = (
            supabase.table("messages")
            .select("*")
            .eq("chat_id", chat_id)
            .order("created_at", desc=True)
            .limit(limit)
        )
        if before:
            query = query.lt("created_at", before)
        result = query.execute()

        if not result or not getattr(result, "data", None):
            return []

        raw_msgs = result.data

        # 3. Filter out deleted-for-me messages & sanitize deleted-for-everyone messages
        visible_msgs = []
        for m in raw_msgs:
            if m["id"] in deleted_msg_ids:
                continue

            if m.get("deleted_for_everyone"):
                m["content"] = None
                m["media_url"] = None

            visible_msgs.append(m)

        return list(reversed(visible_msgs))
    except HTTPException:
        raise
    except Exception:
        pass
    return []


def send_message(
    user_id: str,
    chat_id: str,
    message_type: str,
    content: str | None,
    media_url: str | None,
) -> dict:
    assert_member(user_id, chat_id)
    if message_type == "text" and not content:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Text messages require content")
    if message_type != "text" and not media_url:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Media messages require media_url")

    row = {
        "chat_id": chat_id,
        "sender_id": user_id,
        "message_type": message_type,
        "content": content,
        "media_url": media_url,
    }
    result = supabase.table("messages").insert(row).execute()
    return result.data[0]


def mark_delivered(user_id: str, message_id: str) -> dict:
    return _update_message_state(user_id, message_id, "delivered_at")


def mark_read(user_id: str, message_id: str) -> dict:
    return _update_message_state(user_id, message_id, "read_at")


def mark_chat_read(user_id: str, chat_id: str) -> dict:
    assert_member(user_id, chat_id)
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        supabase.table("messages").update({"delivered_at": now_iso, "read_at": now_iso}).eq("chat_id", chat_id).neq("sender_id", user_id).execute()
    except Exception:
        pass
    return {"status": "success"}



def _update_message_state(user_id: str, message_id: str, column: str) -> dict:
    message = supabase.table("messages").select("chat_id").eq("id", message_id).execute()
    if not message.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Message not found")
    assert_member(user_id, message.data[0]["chat_id"])

    result = (
        supabase.table("messages")
        .update({column: datetime.now(timezone.utc).isoformat()})
        .eq("id", message_id)
        .execute()
    )
    return result.data[0]


def delete_messages(user_id: str, message_ids: list[str], delete_type: str = "me") -> dict:
    if not message_ids:
        return {"status": "success", "count": 0}

    # Fetch messages to verify chat membership & authorization
    msgs_res = (
        supabase.table("messages")
        .select("id, chat_id, sender_id, deleted_for_everyone")
        .in_("id", message_ids)
        .execute()
    )
    msgs = msgs_res.data or []
    if not msgs:
        return {"status": "success", "count": 0}

    # Verify user is a member of all chats associated with these messages
    chat_ids = {m["chat_id"] for m in msgs if "chat_id" in m}
    for cid in chat_ids:
        assert_member(user_id, cid)

    if delete_type == "everyone":
        # Security/Authorization: Only the original sender (message.sender_id === user_id) can Delete for Everyone
        unauthorized = [m for m in msgs if m.get("sender_id") != user_id]
        if unauthorized:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "You can't delete this message for everyone."
            )

        now_iso = datetime.now(timezone.utc).isoformat()
        update_payload = {
            "deleted_for_everyone": True,
            "deleted_at": now_iso,
            "deleted_by": user_id,
            "content": None,
            "media_url": None,
        }

        try:
            supabase.table("messages").update(update_payload).in_("id", message_ids).eq("sender_id", user_id).execute()
        except Exception as e:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"Failed to delete for everyone: {e}")

        return {"status": "success", "count": len(message_ids), "delete_type": "everyone"}

    else:
        # Delete for Me (per-user hiding via message_deletions table)
        try:
            rows = [{"message_id": mid, "user_id": user_id} for mid in message_ids]
            supabase.table("message_deletions").upsert(rows, on_conflict="message_id,user_id").execute()
        except Exception:
            # Fallback for individual insertion if bulk upsert is not supported by schema version
            for mid in message_ids:
                try:
                    supabase.table("message_deletions").insert({"message_id": mid, "user_id": user_id}).execute()
                except Exception:
                    pass

        return {"status": "success", "count": len(message_ids), "delete_type": "me"}
