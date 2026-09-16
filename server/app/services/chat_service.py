"""
Phase 2/6: chat + membership logic.

All queries go through the service-role Supabase client, but RLS is still
the source of truth in the database — this layer additionally checks
membership explicitly where it matters, so a bug here can't silently
bypass the intended access rules (defense in depth).
"""
from fastapi import HTTPException, status

from app.core.supabase_client import supabase


def consolidate_direct_chats():
    """Consolidate duplicate direct chat rooms between the same pairs of users and clean up orphaned self-chats."""
    try:
        chats_res = supabase.table("chats").select("*").eq("type", "direct").execute()
        chats = chats_res.data or []
        if not chats:
            return

        members_res = supabase.table("chat_members").select("*").execute()
        members = members_res.data or []

        members_by_chat = {}
        for m in members:
            cid = m["chat_id"]
            members_by_chat.setdefault(cid, set()).add(m["user_id"])

        pair_chats = {}
        self_chats = []

        for c in chats:
            cid = c["id"]
            u_set = members_by_chat.get(cid, set())
            if len(u_set) == 2:
                key = tuple(sorted(list(u_set)))
                pair_chats.setdefault(key, []).append(cid)
            elif len(u_set) <= 1:
                self_chats.append((cid, u_set))

        # 1. Deduplicate pair chats with >1 chat ID
        for pair, cids in pair_chats.items():
            if len(cids) > 1:
                primary_id = cids[0]
                for dup_id in cids[1:]:
                    supabase.table("messages").update({"chat_id": primary_id}).eq("chat_id", dup_id).execute()
                    supabase.table("chat_members").delete().eq("chat_id", dup_id).execute()
                    supabase.table("chats").delete().eq("id", dup_id).execute()

        # 2. Merge orphaned self_chats if a pair chat exists for that user
        for sc_id, u_set in self_chats:
            if not u_set:
                supabase.table("chats").delete().eq("id", sc_id).execute()
                continue
            uid = list(u_set)[0]
            target_pair_chat = None
            for pair, cids in pair_chats.items():
                if uid in pair and cids:
                    target_pair_chat = cids[0]
                    break
            if target_pair_chat:
                supabase.table("messages").update({"chat_id": target_pair_chat}).eq("chat_id", sc_id).execute()
                supabase.table("chat_members").delete().eq("chat_id", sc_id).execute()
                supabase.table("chats").delete().eq("id", sc_id).execute()
            else:
                msg_check = supabase.table("messages").select("id").eq("chat_id", sc_id).limit(1).execute()
                if not msg_check.data:
                    supabase.table("chat_members").delete().eq("chat_id", sc_id).execute()
                    supabase.table("chats").delete().eq("id", sc_id).execute()
    except Exception:
        pass


def list_chats_for_user(user_id: str) -> list[dict]:
    try:
        # 1. Find all chat memberships for current user
        membership = (
            supabase.table("chat_members").select("chat_id").eq("user_id", user_id).execute()
        )
        if not membership or not getattr(membership, "data", None):
            return []

        chat_ids = [row["chat_id"] for row in membership.data if "chat_id" in row]
        if not chat_ids:
            return []

        # 2. Fetch chats metadata
        chats_res = supabase.table("chats").select("*").in_("id", chat_ids).execute()
        if not chats_res or not getattr(chats_res, "data", None):
            return []

        chats = chats_res.data

        # 3. Fetch member profiles for all these chats in a single batch query
        members_by_chat = {}
        try:
            members_res = (
                supabase.table("chat_members")
                .select("chat_id, user_id, role, users(id, username, profile_photo_url, is_online, last_seen, is_dnd, about)")
                .in_("chat_id", chat_ids)
                .execute()
            )
            if members_res and getattr(members_res, "data", None):
                for m in members_res.data:
                    cid = m.get("chat_id")
                    if cid:
                        members_by_chat.setdefault(cid, []).append(m)
        except Exception:
            pass

        # 4. Fetch per-user deletions for current user
        deleted_msg_ids = set()
        try:
            del_res = (
                supabase.table("message_deletions")
                .select("message_id")
                .eq("user_id", user_id)
                .execute()
            )
            if del_res and getattr(del_res, "data", None):
                deleted_msg_ids = {r["message_id"] for r in del_res.data if "message_id" in r}
        except Exception:
            pass

        # 5. Batch fetch messages across ALL chats for last_message and unread_count calculation
        msgs_by_chat = {}
        try:
            msgs_res = (
                supabase.table("messages")
                .select("id, chat_id, content, message_type, created_at, sender_id, read_at, deleted_for_everyone")
                .in_("chat_id", chat_ids)
                .order("created_at", desc=True)
                .limit(500)
                .execute()
            )
            if msgs_res and getattr(msgs_res, "data", None):
                for msg in msgs_res.data:
                    cid = msg.get("chat_id")
                    if cid:
                        msgs_by_chat.setdefault(cid, []).append(msg)
        except Exception:
            pass

        # 6. Assemble response objects
        result = []
        seen_peer_ids = set()

        for chat in chats:
            cid = chat["id"]
            c_members = members_by_chat.get(cid, [])
            chat["members"] = c_members

            if chat.get("type") == "direct":
                peers = [m for m in c_members if m.get("user_id") != user_id]
                if not peers:
                    continue
                if peers and isinstance(peers[0], dict) and peers[0].get("users"):
                    peer_user = peers[0]["users"]
                    peer_id = peer_user.get("id")
                    if peer_id == user_id or (peer_id and peer_id in seen_peer_ids):
                        continue
                    if peer_id:
                        seen_peer_ids.add(peer_id)
                    chat["peer_user"] = peer_user

            chat_msgs = msgs_by_chat.get(cid, [])
            visible_msgs = [m for m in chat_msgs if m["id"] not in deleted_msg_ids]

            if visible_msgs:
                lm = dict(visible_msgs[0])
                if lm.get("deleted_for_everyone"):
                    if lm.get("sender_id") == user_id:
                        lm["content"] = "🚫 You deleted this message"
                    else:
                        lm["content"] = "🚫 This message was deleted"
                    lm["message_type"] = "text"
                chat["last_message"] = lm
            else:
                chat["last_message"] = None

            chat["unread_count"] = sum(
                1 for m in visible_msgs
                if m.get("sender_id") != user_id and not m.get("read_at")
            )

            result.append(chat)

        result.sort(
            key=lambda c: c["last_message"]["created_at"] if (c.get("last_message") and c["last_message"].get("created_at")) else c.get("created_at", ""),
            reverse=True,
        )
        return result
    except Exception:
        return []


def _find_or_create_direct_chat(user_a: str, user_b: str) -> dict:
    existing = _find_existing_direct_chat(user_a, user_b)
    if existing:
        return existing
    return create_chat(user_a, "direct", [user_b], None)


def create_chat(user_id: str, chat_type: str, member_ids: list[str], name: str | None) -> dict:
    if chat_type == "direct":
        other_members = [m for m in member_ids if m != user_id]
        if not other_members:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Direct chats need another member")
        target_peer_id = other_members[0]
        existing = _find_existing_direct_chat(user_id, target_peer_id)
        if existing:
            return existing
        member_ids = [target_peer_id]

    chat_res = supabase.table("chats").insert({"type": chat_type, "name": name}).execute()
    if not chat_res or not getattr(chat_res, "data", None):
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to create chat")
    
    chat = chat_res.data[0]

    all_member_ids = set(member_ids) | {user_id}
    rows = [
        {"chat_id": chat["id"], "user_id": uid, "role": "admin" if uid == user_id else "member"}
        for uid in all_member_ids
    ]
    supabase.table("chat_members").insert(rows).execute()
    return chat


def _find_existing_direct_chat(user_a: str, user_b: str) -> dict | None:
    """Avoid creating duplicate 1-to-1 chats between the same two users."""
    if not user_a or not user_b or user_a == user_b:
        return None
    try:
        a_chats = supabase.table("chat_members").select("chat_id").eq("user_id", user_a).execute()
        if not a_chats or not getattr(a_chats, "data", None):
            return None
        a_chat_ids = {row["chat_id"] for row in a_chats.data if "chat_id" in row}
        if not a_chat_ids:
            return None

        b_chats = (
            supabase.table("chat_members")
            .select("chat_id")
            .eq("user_id", user_b)
            .in_("chat_id", list(a_chat_ids))
            .execute()
        )
        if not b_chats or not getattr(b_chats, "data", None):
            return None
        shared_ids = [row["chat_id"] for row in b_chats.data if "chat_id" in row]
        if not shared_ids:
            return None

        direct_chats = (
            supabase.table("chats").select("*").in_("id", shared_ids).eq("type", "direct").execute()
        )
        if direct_chats and getattr(direct_chats, "data", None) and direct_chats.data:
            return direct_chats.data[0]
    except Exception:
        pass
    return None


def assert_member(user_id: str, chat_id: str) -> None:
    try:
        result = (
            supabase.table("chat_members")
            .select("user_id")
            .eq("chat_id", chat_id)
            .eq("user_id", user_id)
            .execute()
        )
        if result and getattr(result, "data", None) and len(result.data) > 0:
            return
    except Exception:
        pass
    raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a member of this chat")


def get_chat(user_id: str, chat_id: str) -> dict:
    assert_member(user_id, chat_id)
    chat = supabase.table("chats").select("*").eq("id", chat_id).execute()
    if not chat.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Chat not found")

    members = (
        supabase.table("chat_members")
        .select("user_id, role, users(username, profile_photo_url, is_online, last_seen, is_dnd)")
        .eq("chat_id", chat_id)
        .execute()
    )
    result = chat.data[0]
    result["members"] = members.data if members and getattr(members, "data", None) else []
    return result


def delete_or_leave_chat(user_id: str, chat_id: str) -> dict:
    assert_member(user_id, chat_id)
    supabase.table("chat_members").delete().eq("chat_id", chat_id).eq("user_id", user_id).execute()

    remaining = supabase.table("chat_members").select("user_id").eq("chat_id", chat_id).execute()
    if not remaining.data:
        supabase.table("chats").delete().eq("id", chat_id).execute()

    return {"status": "success", "message": "Left and deleted chat"}



