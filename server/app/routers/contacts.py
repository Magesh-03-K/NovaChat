from fastapi import APIRouter, Depends

from app.core.security import get_current_user_id
from app.schemas.user import AddContactRequest
from app.services import user_service

router = APIRouter()


@router.get("")
def list_contacts(user_id: str = Depends(get_current_user_id)):
    """Phase 2: list saved contacts."""
    return user_service.list_contacts(user_id)


@router.post("")
def add_contact(body: AddContactRequest, user_id: str = Depends(get_current_user_id)):
    """Phase 2: add a contact by username (free — no phone book/SMS lookup needed)."""
    return user_service.add_contact_by_username(user_id, body.username)
