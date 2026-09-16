from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.security import get_current_user_id, get_optional_user_id
from app.core.limiter import limiter
from app.schemas.auth import (
    RegisterProfileRequest,
    ResolveUsernameRequest,
    ResolveUsernameResponse,
)
from app.services import auth_service

router = APIRouter()


@router.post("/register")
def register_profile(
    body: RegisterProfileRequest,
    authenticated_user_id: str | None = Depends(get_optional_user_id),
):
    """Create the public.users profile row right after Supabase Auth signup.
    Supports both instant session token or user_id when email confirmation is pending."""
    target_user_id = authenticated_user_id or body.user_id
    if not target_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID is required for profile registration",
        )
    return auth_service.create_profile(target_user_id, body.email, body.username)


@router.post("/resolve-username", response_model=ResolveUsernameResponse)
@limiter.limit("10/minute")
def resolve_username(request: Request, body: ResolveUsernameRequest):
    """Public endpoint: lets the login form turn a typed username into the
    email Supabase Auth needs for signInWithPassword. Rate-limited per IP
    to prevent username-enumeration abuse — free, no external service."""
    email = auth_service.resolve_username_to_email(body.username)
    return {"email": email}


@router.get("/me")
def get_me(user_id: str = Depends(get_current_user_id)):
    """Fetch the current authenticated user's public profile."""
    return auth_service.get_profile(user_id)
