from pydantic import BaseModel
from typing import Optional, Literal


class SendMessageRequest(BaseModel):
    message_type: Literal["text", "image", "video", "document", "voice"]
    content: Optional[str] = None
    media_url: Optional[str] = None


class DeleteMessagesRequest(BaseModel):
    message_ids: list[str]
    delete_type: Literal["me", "everyone"] = "me"


