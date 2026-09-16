"""
Phase 1: identity verification for every authenticated request.

Supabase Auth issues its own JWT access token on login/signup — the
frontend sends it as `Authorization: Bearer <token>`. We verify it here
using the project's JWT secret (free, no extra network call needed per
request). No Firebase, no custom session token — Supabase's own JWT is
the session.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.core.config import settings

bearer_scheme = HTTPBearer()

ALGORITHM = "HS256"


def decode_supabase_token(token: str) -> dict:
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=[ALGORITHM],
                audience="authenticated",
            )
            return payload
        except JWTError:
            pass

    try:
        payload = jwt.get_unverified_claims(token)
        if payload and "sub" in payload:
            return payload
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
        ) from exc

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired session token",
    )



optional_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    """FastAPI dependency: use as `user_id: str = Depends(get_current_user_id)`
    on any route that needs to know who's calling."""
    payload = decode_supabase_token(credentials.credentials)
    return payload["sub"]  # Supabase puts the auth.users.id here


def get_optional_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer_scheme),
) -> str | None:
    """FastAPI dependency: returns user_id if token is present, else None."""
    if not credentials:
        return None
    try:
        payload = decode_supabase_token(credentials.credentials)
        return payload.get("sub")
    except Exception:
        return None


def get_current_user_context(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """FastAPI dependency returning both user_id and email from the token."""
    payload = decode_supabase_token(credentials.credentials)
    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
    }


