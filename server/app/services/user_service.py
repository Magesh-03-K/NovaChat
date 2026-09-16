"""Phase 3: profile read/update logic for users other than the auth flow
itself (see auth_service.py for profile creation)."""
from fastapi import HTTPException, status

from app.core.supabase_client import supabase


def get_public_profile(user_id: str) -> dict:
    try:
        result = supabase.table("users").select(
            "id, username, profile_photo_url, about, is_online, last_seen, is_dnd"
        ).eq("id", user_id).execute()
        if result and getattr(result, "data", None):
            return result.data[0]
    except Exception:
        pass

    return {
        "id": user_id,
        "username": f"user_{user_id[:6]}",
        "profile_photo_url": None,
        "about": "Hey there! I'm using NovaChat",
        "is_online": True,
        "is_dnd": False,
    }


def update_own_profile(
    user_id: str,
    email: str | None = None,
    username: str | None = None,
    profile_photo_url: str | None = None,
    about: str | None = None,
    is_dnd: bool | None = None,
) -> dict:
    if username is not None:
        username = username.strip()
        if username:
            try:
                existing = (
                    supabase.table("users")
                    .select("id")
                    .eq("username", username)
                    .neq("id", user_id)
                    .execute()
                )
                if existing and getattr(existing, "data", None):
                    raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")
            except HTTPException:
                raise
            except Exception:
                pass

    user_email = email or f"user_{user_id[:8]}@novachat.app"

    updates = {
        "id": user_id,
        "email": user_email,
    }
    if username:
        updates["username"] = username
    if profile_photo_url is not None:
        updates["profile_photo_url"] = profile_photo_url
    if about is not None:
        updates["about"] = about
    if is_dnd is not None:
        updates["is_dnd"] = is_dnd

    try:
        # Use upsert with id and email so new row creation satisfies Postgres NOT NULL constraint
        result = supabase.table("users").upsert(updates).execute()
        if result and getattr(result, "data", None):
            return result.data[0]
    except Exception:
        pass

    try:
        current = get_public_profile(user_id)
    except Exception:
        current = {
            "id": user_id,
            "email": user_email,
            "username": username or f"user_{user_id[:6]}",
            "profile_photo_url": profile_photo_url,
            "about": about or "Hey there! I'm using NovaChat",
            "is_dnd": bool(is_dnd),
            "is_online": True,
        }


    current.update(updates)
    return current





def add_contact_by_username(owner_id: str, username: str) -> dict:
    contact = supabase.table("users").select("id").eq("username", username).execute()
    if not contact or not getattr(contact, "data", None) or not contact.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No user with that username")
    contact_id = contact.data[0]["id"]
    if contact_id == owner_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Can't add yourself as a contact")

    result = (
        supabase.table("contacts")
        .upsert({"owner_id": owner_id, "contact_id": contact_id})
        .execute()
    )

    # Ensure direct chat room exists for messaging between both users
    try:
        from app.services import chat_service
        chat_service.create_chat(owner_id, "direct", [contact_id], None)
    except Exception:
        pass

    return result.data[0] if (result and getattr(result, "data", None)) else {"owner_id": owner_id, "contact_id": contact_id}



def list_contacts(owner_id: str) -> list[dict]:
    try:
        result = (
            supabase.table("contacts")
            .select("contact_id, users(id, username, profile_photo_url, is_online, last_seen)")
            .eq("owner_id", owner_id)
            .execute()
        )
        if result and getattr(result, "data", None):
            return [row["users"] for row in result.data if isinstance(row, dict) and row.get("users")]
    except Exception:
        pass
    return []


def search_users(q: str, current_user_id: str) -> list[dict]:
    q = (q or "").strip()
    if not q:
        return []
    try:
        result = (
            supabase.table("users")
            .select("id, username, profile_photo_url, about, is_online, last_seen")
            .ilike("username", f"%{q}%")
            .neq("id", current_user_id)
            .limit(10)
            .execute()
        )
        if result and getattr(result, "data", None):
            return result.data
    except Exception:
        pass
    return []


