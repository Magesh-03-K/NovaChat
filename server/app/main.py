from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.limiter import limiter
from app.routers import auth, users, contacts, chats, messages, media, notifications

app = FastAPI(title="NovaChat API")
# Free, in-memory rate limiter (per-IP) — protects /auth/resolve-username
# and any other endpoint tagged with @limiter.limit(...), zero extra cost.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CLIENT_URL, "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(contacts.router, prefix="/api/contacts", tags=["contacts"])
app.include_router(chats.router, prefix="/api/chats", tags=["chats"])
app.include_router(messages.router, prefix="/api", tags=["messages"])
app.include_router(media.router, prefix="/api/media", tags=["media"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])



@app.get("/api/health")
def health():
    return {"status": "ok"}
