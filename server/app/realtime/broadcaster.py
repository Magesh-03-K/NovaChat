"""Phase 2/4/6: wraps Supabase Realtime channel publishing so services can
emit `new_message`, `message_delivered`, `message_read`, and
`presence_update` events without knowing the transport details.
Falls back to a plain WebSocket broadcaster if Realtime is unavailable."""
