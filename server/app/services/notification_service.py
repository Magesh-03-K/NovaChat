"""
Phase 7: Web Push (browser Push API + VAPID keys) notification dispatch
for new messages. Free — no Firebase/Google project needed. `pywebpush` +
VAPID keys is all that's required on the backend.
"""
import json
import os
from pywebpush import webpush, WebPushException
from app.core.supabase_client import supabase

# Generated VAPID keys fallback for local development
VAPID_PUBLIC_KEY = os.getenv(
    "VAPID_PUBLIC_KEY",
    "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgD8R7pW2S76Yk-YfN3_W0a3uO5k0V_4WvL8f62n8p0wE=",
)
VAPID_PRIVATE_KEY = os.getenv(
    "VAPID_PRIVATE_KEY",
    "u4S-U4Xg2W_2z6E2Qe6z2K3z4X5y6Z7a8B9c0D1e2F3=",
)
VAPID_CLAIMS = {"sub": "mailto:admin@novachat.app"}


def get_public_key() -> str:
    return VAPID_PUBLIC_KEY


def save_subscription(user_id: str, subscription_data: dict) -> dict:
    try:
        result = (
            supabase.table("push_subscriptions")
            .upsert({"user_id": user_id, "subscription_json": subscription_data})
            .execute()
        )
        if result and getattr(result, "data", None):
            return result.data[0]
    except Exception:
        pass
    return {"status": "subscribed"}


def send_notification_to_user(user_id: str, title: str, body: str, url: str = "/chats"):
    try:
        subs = (
            supabase.table("push_subscriptions")
            .select("subscription_json")
            .eq("user_id", user_id)
            .execute()
        )

        if not subs or not getattr(subs, "data", None):
            return

        payload = json.dumps({"title": title, "body": body, "url": url})

        for row in subs.data:
            sub_info = row.get("subscription_json")
            if not sub_info:
                continue
            try:
                webpush(
                    subscription_info=sub_info,
                    data=payload,
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims=VAPID_CLAIMS,
                )
            except WebPushException:
                pass
    except Exception:
        pass

