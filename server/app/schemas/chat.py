from pydantic import BaseModel
from typing import Optional, Literal


class CreateChatRequest(BaseModel):
    type: Literal["direct", "group"]
    member_ids: list[str]
    name: Optional[str] = None
