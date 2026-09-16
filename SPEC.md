# Project Overview & Tech Stack

## Project Overview

Build a full-stack real-time messaging application called **NovaChat** — a WhatsApp/Telegram-style app that supports email + password login (with an optional username as a login alias and display handle), 1-to-1 and group messaging, media sharing, delivery/read receipts, online/last-seen status, and push notifications. The platform must run **end-to-end at ₹0**, permanently — not just during a trial period — which is why phone-number OTP login has been deliberately dropped in favor of email/username authentication.

## Tech Stack

**Frontend:** React + Vite, Zustand (state), Tailwind CSS, Axios, React Router, Supabase JS client (Auth/DB/Realtime/Storage).

**Backend:** FastAPI (Python), Supabase PostgreSQL, Supabase Auth, Supabase Realtime (or WebSockets fallback), Supabase Storage, Pydantic schemas, Uvicorn.

**Auth:** Supabase Auth, email + password. A user may also log in with their **username** — the backend resolves the username to its associated email, then authenticates against Supabase Auth. No phone number, no OTP, no SMS provider anywhere in the stack.

**Notifications:** Web Push (free, via the browser Push API + VAPID keys) instead of Firebase Cloud Messaging, so no Google/Firebase project is required at all. FCM remains a documented drop-in alternative if the user later wants native mobile push.

**Hosting:** Vercel (frontend), Render/Railway (backend), Supabase (Auth/DB/Storage/Realtime).

| Layer | Technology | Cost |
|---|---|---|
| Frontend | React + Vite | ₹0 |
| Backend | FastAPI | ₹0 |
| Database | Supabase PostgreSQL | ₹0 (free tier) |
| Authentication | Supabase Auth (email/username + password) | ₹0 — no billing account, no SMS provider |
| Frontend hosting | Vercel | ₹0 (starter) |
| Backend hosting | Render / Railway | Free/limited tier |
| File storage | Supabase Storage | Free within quota |
| Real-time | Supabase Realtime | ₹0 (starter) |
| Push notifications | Web Push (VAPID) | ₹0 |

> **Why the change:** Firebase Phone Auth's SMS delivery requires a Cloud Billing account and is billed per OTP once trial credit runs out — the only non-free item in the original plan. Supabase Auth's email/password flow (plus Supabase's built-in transactional email for verification/reset) has no such requirement on the free tier, so the whole stack above is free indefinitely for a student/demo-scale project, not just during a trial window. If you later want passwordless login without SMS cost, Supabase's **magic link** (email) or **OTP-via-email** flows are also free drop-in options — see the "Future/optional" note under Authentication.

---

# Authentication, Data Model, and Real-Time Messaging

## Authentication

The authentication system must support:
- **Registration:** email, a unique username (3–20 chars, alphanumeric + underscore), and a password — creates a Supabase Auth user and a matching profile row in `public.users`.
- **Login by email or username:** the login form accepts either. If the input contains no `@`, the backend treats it as a username, looks up the associated email in `public.users`, and then authenticates that email/password pair against Supabase Auth. If it contains `@`, it's used directly as the email.
- Exchange of the Supabase Auth session (access token) for use on all subsequent API calls — the FastAPI backend verifies this token directly against Supabase's JWT secret, so no separate backend-issued token is needed.
- First-login profile setup (profile photo, "about" text) after registration.
- Session persistence on the client via Zustand + Supabase's own client-side session storage/refresh.
- Logout that clears the Supabase client session.
- Rate limiting on login/registration attempts (per IP and per identifier) to prevent brute-force and spam signups — this is free to implement (in-memory or Redis-backed limiter) and doesn't depend on any paid provider.
- Password reset via Supabase Auth's built-in "forgot password" email flow (also free on the free tier).

**Future/optional, still free:** if you'd rather not ask users for a password, swap the password grant for Supabase's **magic link** or **email OTP** sign-in — both send the code/link through Supabase's free transactional email and require no code changes outside `services/supabase.js` and the corresponding auth router.

## Data Model (Supabase PostgreSQL)

```
users
 ├── id (uuid, pk, = auth.users.id)
 ├── email (unique, denormalized from auth.users for username→email login lookup)
 ├── username (unique)
 ├── profile_photo_url
 ├── about
 ├── last_seen (timestamptz)
 ├── is_online (bool)
 └── created_at

chats
 ├── id (uuid, pk)
 ├── type ("direct" | "group")
 ├── name (nullable, for groups)
 ├── avatar_url (nullable)
 └── created_at

chat_members
 ├── chat_id (fk -> chats.id)
 ├── user_id (fk -> users.id)
 ├── role ("member" | "admin")
 └── joined_at

messages
 ├── id (uuid, pk)
 ├── chat_id (fk -> chats.id)
 ├── sender_id (fk -> users.id)
 ├── message_type ("text" | "image" | "video" | "document" | "voice")
 ├── content (text, nullable for media)
 ├── media_url (nullable)
 ├── created_at
 ├── delivered_at (nullable)
 └── read_at (nullable)

contacts
 ├── owner_id (fk -> users.id)
 ├── contact_id (fk -> users.id)
 └── created_at
```

Row-Level Security (RLS) policies must ensure a user can only read/write messages and chat metadata for chats they are a member of. The `email` column on `public.users` should only be selectable by its owning row (via RLS) even though it's stored there for login-lookup purposes — it must never be exposed in a public profile response.

## Real-Time Messaging Layer

- New messages are written to the `messages` table via the backend API, then broadcast via Supabase Realtime (Postgres change feed) to all subscribed chat members.
- Clients subscribe to their active chat's channel and to a personal channel for global events (new chat invites, presence).
- Delivery/read receipts update `delivered_at` / `read_at` on the message row, which re-broadcasts the state change to the sender for tick updates (✓ / ✓✓ / blue ✓✓).
- Presence (`is_online`, `last_seen`) is updated on socket connect/disconnect and periodically heartbeat-refreshed.
- If Supabase Realtime is unavailable in an environment, the backend must fall back to a plain WebSocket broadcast per chat room.

---

# Feature Phases, API, and Frontend Pages

## Development Phases

- **Phase 1 — Auth:** registration (email + username + password), login (email or username + password), logout, session persistence, password reset.
- **Phase 2 — 1-to-1 Messaging:** send/receive text messages, timestamps, message history, real-time updates.
- **Phase 3 — Profiles:** username, profile picture, about, last seen, online status.
- **Phase 4 — Message States:** sent (✓), delivered (✓✓), read (blue ✓✓).
- **Phase 5 — Media:** images, videos, documents, voice messages via Supabase Storage.
- **Phase 6 — Groups:** group creation, member management, group messaging.
- **Phase 7 — Notifications:** FCM push notifications for new messages while app is backgrounded.

## API Endpoints (FastAPI)

**Auth**
- `POST /api/auth/register` — Called right after the frontend creates the Supabase Auth user directly; creates the matching `public.users` profile row (email, username). Requires the just-issued Supabase access token.
- `POST /api/auth/resolve-username` — Public: given a username, returns its email so the login form can pass it to Supabase's `signInWithPassword`. Rate-limited to prevent enumeration.
- `GET /api/auth/me` — Fetch current authenticated user's profile (identity resolved from the verified Supabase access token).
- Logout is handled entirely client-side via `supabase.auth.signOut()` — no backend call needed.

**Users & Contacts**
- `GET /api/users/{id}` — Fetch a user's public profile.
- `PUT /api/users/me` — Update own profile (username, photo, about).
- `GET /api/contacts` — List saved contacts.
- `POST /api/contacts` — Add a contact by username.

**Chats**
- `GET /api/chats` — List chats for the current user, with last message preview.
- `POST /api/chats` — Create a direct or group chat.
- `GET /api/chats/{id}` — Fetch chat metadata and members.
- `PUT /api/chats/{id}` — Update group name/avatar/members (admin only).
- `DELETE /api/chats/{id}` — Leave or delete a chat.

**Messages**
- `GET /api/chats/{id}/messages` — Paginated message history for a chat.
- `POST /api/chats/{id}/messages` — Send a message (text or media reference).
- `POST /api/messages/{id}/delivered` — Mark a message delivered.
- `POST /api/messages/{id}/read` — Mark a message read.

**Media**
- `POST /api/media/upload` — Upload a file to Supabase Storage, return a URL.

## Frontend Pages

- `/login` — Email-or-username + password entry, with a link to register and a "forgot password" link.
- `/register` — Email, username, and password entry.
- `/onboarding` — First-login profile setup (photo, about).
- `/chats` — Chat list with last message preview, unread badges, search.
- `/chats/[id]` — Active conversation: message thread, composer, media picker, typing indicator.
- `/contacts` — Contact list with add-by-username and "start chat" action.
- `/groups/new` — Group creation flow (name, avatar, member picker).
- `/profile` — Own profile view/edit (username, photo, about, logout).

---

# Security, Codex/Agent Instructions, and Outcome

## Security Requirements

- Never trust the client-supplied user id — always resolve identity from the verified Supabase access token on every request.
- Enforce Supabase Row-Level Security on `users` (email column), `chats`, `chat_members`, and `messages` so a user can only access data for chats they belong to, and can never read another user's email.
- Validate and sanitize all request bodies (Pydantic models) on the FastAPI side.
- Rate-limit login and registration attempts per IP and per identifier to prevent brute-force and signup spam.
- Hash/salt passwords are handled entirely by Supabase Auth — the app must never store or log raw passwords.
- Store only Supabase Storage URLs in `messages.media_url`, never raw file bytes, in the database.
- Use HTTPS everywhere in production; never log passwords, tokens, or emails in plaintext logs.

## Implementation Instructions

The implementation should proceed phase by phase (see Development Phases above), following the folder structure below strictly:
- Keep FastAPI routers thin — request parsing and response shaping only.
- Push all business logic (message delivery rules, retry, notification dispatch) into the `services/` layer.
- Never query Supabase directly from a router; always go through a service.
- Treat every secret (Supabase keys, JWT secret, VAPID keys) as an environment variable, never hardcoded.
- Emit a Realtime event for every message send, delivery, and read-state change.
- Report the list of files created or changed at the end of every phase.

## Final Expected Outcome

A working chat app where a user can register and log in with just an email/username and a password, see their contacts and chats, send and receive messages in real time with delivery/read ticks, share media, create groups, and get push notifications — all running on free-tier infrastructure end to end, with **no recurring cost at all**, at any usage level this project is realistically going to see.
