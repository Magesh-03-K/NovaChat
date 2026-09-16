from fastapi import APIRouter, Depends

from app.core.security import get_current_user_id, get_current_user_context
from app.schemas.user import UpdateProfileRequest, AddContactRequest
from app.services import user_service

router = APIRouter()


@router.get("/search/username")
def search_users(q: str = "", user_id: str = Depends(get_current_user_id)):
    """Search registered users by username substring."""
    return user_service.search_users(q, user_id)


@router.get("/{user_id}")
def get_user(user_id: str):
    """Fetch a user's public profile."""
    return user_service.get_public_profile(user_id)



@router.put("/me")
def update_me(
    body: UpdateProfileRequest,
    user_ctx: dict = Depends(get_current_user_context),
):
    """Update own profile (username, photo, about, is_dnd)."""
    return user_service.update_own_profile(
        user_id=user_ctx["id"],
        email=user_ctx.get("email"),
        username=body.username,
        profile_photo_url=body.profile_photo_url,
        about=body.about,
        is_dnd=body.is_dnd,
    )


