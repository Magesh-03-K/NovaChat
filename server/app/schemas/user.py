from pydantic import BaseModel


class UpdateProfileRequest(BaseModel):
    username: str | None = None
    profile_photo_url: str | None = None
    about: str | None = None
    is_dnd: bool | None = None



class AddContactRequest(BaseModel):
    username: str
