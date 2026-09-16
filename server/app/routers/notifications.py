from fastapi import APIRouter, Depends, Body
from app.core.security import get_current_user_id
from app.services import notification_service

router = APIRouter()


@router.get("/vapid-key")
def get_vapid_key():
    """Get VAPID public key for browser Push API registration."""
    return {"public_key": notification_service.get_public_key()}


@router.post("/subscribe")
def subscribe_push(subscription: dict = Body(...), user_id: str = Depends(get_current_user_id)):
    """Save user's browser push subscription."""
    return notification_service.save_subscription(user_id, subscription)
