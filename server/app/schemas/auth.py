from pydantic import BaseModel, EmailStr, Field


class RegisterProfileRequest(BaseModel):
    """Called right after the frontend creates the Supabase Auth user,
    to create the matching public.users profile row."""
    email: EmailStr
    username: str = Field(min_length=3, max_length=20, pattern=r"^[a-zA-Z0-9_]+$")
    password: str = Field(min_length=8)  # accepted for validation parity; not stored here


class ResolveUsernameRequest(BaseModel):
    username: str


class ResolveUsernameResponse(BaseModel):
    email: EmailStr
