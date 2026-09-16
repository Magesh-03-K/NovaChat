import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException


def test_delete_for_everyone_authorization():
    from app.services import message_service

    # Mock chat membership check
    with patch("app.services.message_service.assert_member") as mock_assert_member, \
         patch("app.services.message_service.supabase") as mock_supabase:
        
        mock_assert_member.return_value = None

        # Message belongs to user_2 (another user)
        mock_msgs_res = MagicMock()
        mock_msgs_res.data = [{"id": "msg_100", "chat_id": "chat_1", "sender_id": "user_2", "deleted_for_everyone": False}]
        mock_supabase.table().select().in_().execute.return_value = mock_msgs_res

        # Attempt to delete user_2's message for everyone as user_1
        with pytest.raises(HTTPException) as exc_info:
            message_service.delete_messages("user_1", ["msg_100"], delete_type="everyone")

        assert exc_info.value.status_code == 403
        assert "You can't delete this message for everyone" in str(exc_info.value.detail)


def test_delete_for_everyone_success():
    from app.services import message_service

    with patch("app.services.message_service.assert_member") as mock_assert_member, \
         patch("app.services.message_service.supabase") as mock_supabase:
        
        mock_assert_member.return_value = None

        # Message belongs to sender (user_1)
        mock_msgs_res = MagicMock()
        mock_msgs_res.data = [{"id": "msg_100", "chat_id": "chat_1", "sender_id": "user_1", "deleted_for_everyone": False}]
        mock_supabase.table().select().in_().execute.return_value = mock_msgs_res

        mock_update_builder = MagicMock()
        mock_supabase.table().update.return_value = mock_update_builder
        mock_update_builder.in_().eq().execute.return_value = MagicMock()

        res = message_service.delete_messages("user_1", ["msg_100"], delete_type="everyone")

        assert res["status"] == "success"
        assert res["delete_type"] == "everyone"
        assert res["count"] == 1


def test_delete_for_me_success():
    from app.services import message_service

    with patch("app.services.message_service.assert_member") as mock_assert_member, \
         patch("app.services.message_service.supabase") as mock_supabase:
        
        mock_assert_member.return_value = None

        mock_msgs_res = MagicMock()
        mock_msgs_res.data = [{"id": "msg_200", "chat_id": "chat_1", "sender_id": "user_2", "deleted_for_everyone": False}]
        mock_supabase.table().select().in_().execute.return_value = mock_msgs_res

        mock_upsert_builder = MagicMock()
        mock_supabase.table().upsert.return_value = mock_upsert_builder
        mock_upsert_builder.execute.return_value = MagicMock()

        res = message_service.delete_messages("user_1", ["msg_200"], delete_type="me")

        assert res["status"] == "success"
        assert res["delete_type"] == "me"
        assert res["count"] == 1


def test_list_messages_sanitization():
    from app.services import message_service

    with patch("app.services.message_service.assert_member") as mock_assert_member, \
         patch("app.services.message_service.supabase") as mock_supabase:
        
        mock_assert_member.return_value = None

        # No per-user deletions
        mock_del_res = MagicMock()
        mock_del_res.data = []
        
        # 2 messages in chat: 1 normal, 1 deleted for everyone
        mock_msgs_res = MagicMock()
        mock_msgs_res.data = [
            {"id": "msg_2", "chat_id": "chat_1", "sender_id": "user_1", "content": "Sensitive info", "media_url": "https://media.org/pic.png", "deleted_for_everyone": True, "created_at": "2026-09-14T10:00:00Z"},
            {"id": "msg_1", "chat_id": "chat_1", "sender_id": "user_2", "content": "Hello", "media_url": None, "deleted_for_everyone": False, "created_at": "2026-09-14T09:50:00Z"}
        ]

        def table_side_effect(table_name):
            mock_table = MagicMock()
            if table_name == "message_deletions":
                mock_table.select().eq().execute.return_value = mock_del_res
            elif table_name == "messages":
                mock_table.select().eq().order().limit().execute.return_value = mock_msgs_res
            return mock_table

        mock_supabase.table.side_effect = table_side_effect

        msgs = message_service.list_messages("user_1", "chat_1", before=None, limit=50)

        assert len(msgs) == 2
        # Check that msg_2 content and media_url are stripped
        msg_2 = [m for m in msgs if m["id"] == "msg_2"][0]
        assert msg_2["content"] is None
        assert msg_2["media_url"] is None
        assert msg_2["deleted_for_everyone"] is True
