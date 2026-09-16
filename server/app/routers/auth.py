from fastapi import APIRouter, Depends, Request

from app.core.security import get_current_user_id
from app.core.limiter import limiter
from app.schemas.auth import (
    RegisterProfileRequest,
    ResolveUsernameRequest,
    ResolveUsernameResponse,
)
from app.services import auth_service

router = APIRouter()


@router.post("/register")
def register_profile(body: RegisterProfileRequest, user_id: str = Depends(get_current_user_id)):
    """Create the public.users profile row right after Supabase Auth signup.
    Requires the just-issued Supabase access token, so `user_id` here is
    already the authenticated auth.users.id."""
    return auth_service.create_profile(user_id, body.email, body.username)


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
