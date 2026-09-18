"""
Phase 1: profile-side auth logic.

Supabase Auth itself (signup/login/password reset) is called directly
from the frontend using the anon key — that's the free, standard way to
use Supabase Auth and keeps passwords off our backend entirely.

This service only owns the *profile* side of things:
  - creating the public.users row right after a Supabase Auth signup
  - resolving a username to its email so username-based login works
  - fetching/updating the public profile for the authenticated user

Routers call into this; this is the only layer allowed to touch the
`users` table for auth-adjacent concerns.
"""
from fastapi import HTTPException, status

from app.core.supabase_client import supabase


def create_profile(user_id: str, email: str, username: str) -> dict:
    existing_user = (
        supabase.table("users").select("*").eq("id", user_id).execute()
    )
    if existing_user and getattr(existing_user, "data", None) and len(existing_user.data) > 0:
        return existing_user.data[0]

    existing_username = (
        supabase.table("users").select("id").eq("username", username).execute()
    )
    if existing_username and getattr(existing_username, "data", None) and len(existing_username.data) > 0:
        if existing_username.data[0]["id"] == user_id:
            return existing_username.data[0]
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")

    try:
        result = (
            supabase.table("users")
            .insert({"id": user_id, "email": email, "username": username})
            .execute()
        )
        if result and getattr(result, "data", None) and len(result.data) > 0:
            return result.data[0]
        return {"id": user_id, "email": email, "username": username}
    except HTTPException:
        raise
    except Exception as err:
        err_msg = str(err)
        err_details = str(getattr(err, "details", "")) + str(getattr(err, "message", ""))
        combined_err = f"{err_msg} {err_details}"
        if "23503" in combined_err or "users_id_fkey" in combined_err or "foreign key constraint" in combined_err.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user_id: User has not signed up in Supabase Auth first or table constraint failed.",
            )
        if "23505" in combined_err or "already exists" in combined_err or "unique constraint" in combined_err.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username or Email already registered.",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error creating profile: {err_msg}",
        )


def resolve_username_to_email(username: str) -> str:
    result = (
        supabase.table("users").select("email").eq("username", username).execute()
    )
    if not result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No account with that username")
    return result.data[0]["email"]


def get_profile(user_id: str) -> dict:
    try:
        result = supabase.table("users").select("*").eq("id", user_id).execute()
        if result and getattr(result, "data", None):
            profile = dict(result.data[0])
            profile.pop("email", None)  # never return email from a general profile fetch
            return profile
    except Exception:
        pass

    # Safe fallback profile if user row or DB table isn't initialized yet
    return {
        "id": user_id,
        "username": f"user_{user_id[:6]}",
        "profile_photo_url": None,
        "about": "Hey there! I'm using NovaChat",
        "is_dnd": False,
        "is_online": True,
    }

