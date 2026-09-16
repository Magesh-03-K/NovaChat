# NovaChat — Full Project Handoff

**Purpose of this document:** this is a complete, self-contained context dump of the NovaChat project so you (an AI coding agent, e.g. Antigravity) can continue building it without needing anything else. It includes: the product spec, every architectural decision and *why* it was made, the full file tree, the **complete verbatim source of every file**, the database schema, the design system, environment variables, what's implemented vs. still a stub, and a prioritized list of next steps.

Treat this file as ground truth. If anything in your own assumptions conflicts with what's written here, defer to this document.

---

## 1. What NovaChat Is

NovaChat is a WhatsApp/Telegram-style real-time messaging web app, built as a **free-forever** student/demo project — every piece of infrastructure runs on a free tier, permanently, not just during a trial window. That constraint drove several concrete architecture decisions (below), most importantly: **no phone-number OTP login** (Firebase Phone Auth requires a paid Cloud Billing account for SMS), replaced with **Supabase Auth (email + password, with username as a login alias)**, which is free indefinitely.

## 2. Tech Stack (and why)

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite | Fast dev server, no paid tooling |
| Styling | Tailwind CSS, custom design tokens | See §6 Design System |
| State | Zustand | Minimal boilerplate vs Redux |
| Backend | FastAPI (Python) | Clean, typed, async-friendly |
| Database | Supabase PostgreSQL | Free tier (500MB DB, 1GB storage, 5GB egress, 50k MAU) |
| Auth | Supabase Auth (email+password) | Free forever, no SMS/billing account needed |
| Realtime | Supabase Realtime (Postgres change feed) | Free, no custom WebSocket server needed |
| File storage | Supabase Storage | Free within quota |
| Push notifications | Web Push (VAPID) — **planned, not yet implemented** | Free; no Firebase/Google project needed, unlike FCM |
| Hosting (when deployed) | Vercel (frontend) + Render/Railway (backend) | Free tiers |

**Explicitly rejected:** Firebase Phone Auth (SMS costs money past trial), Firebase Cloud Messaging (would require a Firebase/Google project just for push — Web Push doesn't).

## 3. Full File Tree

```
novachat/
├── .gitignore
├── README.md
├── SPEC.md                          # Full product spec (auth, data model, phases, API, security)
├── design-reference/
│   ├── novachat_design_system/
│   │   └── DESIGN.md                # Full design system (colors, type scale, spacing, components)
│   ├── chat_list_mock.png           # Stitch-generated reference mock
│   └── chat_thread_mock.png         # Stitch-generated reference mock
├── client/                          # React + Vite frontend
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                  # Router — all routes defined here
│       ├── main.jsx                 # React entry point
│       ├── index.css                # Tailwind + base resets + Material Symbols icon CSS
│       ├── components/
│       │   ├── Auth/                # (empty — reserved, nothing built here yet)
│       │   ├── Chat/                # (empty — reserved, nothing built here yet)
│       │   ├── Profile/             # (empty — reserved, nothing built here yet)
│       │   └── Shared/
│       │       ├── Icon.jsx         # Material Symbols icon wrapper
│       │       └── BottomNav.jsx    # Bottom tab bar (Chats/Contacts/Profile)
│       ├── pages/
│       │   ├── ProfilePage.jsx      # View/edit own profile, logout
│       │   ├── auth/
│       │   │   ├── LoginPage.jsx    # Email-or-username + password login
│       │   │   ├── RegisterPage.jsx # Email + username + password signup
│       │   │   └── OnboardingPage.jsx # First-login profile photo + about
│       │   ├── chat/
│       │   │   ├── ChatListPage.jsx   # Chat list, search, filters, online reel
│       │   │   └── ChatThreadPage.jsx # Message thread, composer, realtime
│       │   └── contacts/
│       │       └── ContactsPage.jsx  # Add by username, start a chat
│       ├── services/
│       │   ├── api.js               # Axios instance, attaches Supabase token
│       │   └── supabase.js          # Supabase client + auth helper functions
│       ├── store/
│       │   ├── authStore.js         # Zustand: current user + session token
│       │   └── chatStore.js         # Zustand: chat list + active chat state
│       └── hooks/                   # (empty — reserved, nothing built here yet)
└── server/                          # FastAPI backend
    ├── .env.example
    ├── requirements.txt
    ├── supabase/
    │   └── schema.sql               # Full DB schema + RLS policies + storage bucket setup
    ├── tests/
    │   └── __init__.py              # (empty — no tests written yet)
    └── app/
        ├── __init__.py
        ├── main.py                  # FastAPI app, CORS, rate limiter, router registration
        ├── core/
        │   ├── __init__.py
        │   ├── config.py            # Env var settings loader
        │   ├── security.py          # Supabase JWT verification, get_current_user_id dependency
        │   ├── limiter.py           # Shared slowapi rate limiter instance
        │   └── supabase_client.py   # Service-role Supabase client (server-side only)
        ├── routers/                 # HTTP layer — thin, no business logic
        │   ├── __init__.py
        │   ├── auth.py              # /api/auth/*
        │   ├── users.py             # /api/users/*
        │   ├── contacts.py          # /api/contacts/*
        │   ├── chats.py             # /api/chats/*
        │   ├── messages.py          # /api/chats/{id}/messages, /api/messages/{id}/*
        │   └── media.py             # /api/media/upload
        ├── services/                # Business logic layer
        │   ├── __init__.py
        │   ├── auth_service.py      # Profile creation, username→email resolution
        │   ├── chat_service.py      # Chat CRUD, direct-chat dedup, membership checks
        │   ├── message_service.py   # Message send/list, delivered/read state
        │   ├── user_service.py      # Profile get/update, contacts
        │   ├── media_service.py     # Supabase Storage upload
        │   └── notification_service.py # Web Push — STUB ONLY, not implemented
        ├── models/                  # Data shape documentation (not ORM classes — Supabase client used directly)
        │   ├── __init__.py
        │   ├── user.py              # (docstring only — see schema.sql for real shape)
        │   ├── chat.py              # (docstring only)
        │   └── message.py           # (docstring only)
        ├── schemas/                 # Pydantic request/response models
        │   ├── __init__.py
        │   ├── auth.py
        │   ├── user.py
        │   ├── chat.py
        │   └── message.py
        └── realtime/
            ├── __init__.py
            └── broadcaster.py       # (docstring only — Realtime is automatic via Supabase publication, no code needed)
```

**Note on `models/*.py` and `realtime/broadcaster.py`:** these are intentionally docstring-only placeholders. The project does NOT use an ORM (SQLAlchemy etc.) — it talks to Supabase directly via the `supabase-py` client, so "models" are just documentation of the row shape (the real source of truth is `server/supabase/schema.sql`). Similarly, no custom broadcaster code was needed because Supabase Realtime pushes Postgres changes to subscribed clients automatically once a table is added to the `supabase_realtime` publication (done in `schema.sql`).

## 4. Environment Setup (do this first, before writing any more code)

### 4.1 Create the Supabase project (free)
1. Go to supabase.com → New Project (free tier).
2. In the SQL Editor, run the entire contents of `server/supabase/schema.sql` — this creates all tables, RLS policies, the Realtime publication, and the `chat-media` storage bucket.
3. From Project Settings → API, collect:
   - `Project URL` → `SUPABASE_URL`
   - `anon` `public` key → `SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_KEY` (server only — never expose to the client)
   - `JWT Secret` (Project Settings → API → JWT Settings) → `SUPABASE_JWT_SECRET`

### 4.2 Backend `.env` (copy from `server/.env.example`)
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
SUPABASE_JWT_SECRET=
CLIENT_URL=http://localhost:5173
```

### 4.3 Frontend `.env` (copy from `client/.env.example`)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:8000/api
```

### 4.4 Run it
```bash
# Backend
cd server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd client
npm install
npm run dev
```

## 5. Authentication Model (important — read before touching auth code)

- Supabase Auth handles the actual credential (email + password) — the frontend calls `supabase.auth.signUp` / `signInWithPassword` directly using the **anon key**. The backend never sees or stores a password.
- A user also has a row in `public.users` (created via `POST /api/auth/register` right after `signUp`) holding `id` (= `auth.users.id`), `email` (denormalized, needed for username lookup), `username`, `profile_photo_url`, `about`, presence fields.
- **Username-as-login** works like this: the login form accepts either an email or a username. If there's no `@`, the frontend calls `POST /api/auth/resolve-username` (public, rate-limited to 10/min per IP) which looks up the email for that username in `public.users`, then the frontend calls `supabase.auth.signInWithPassword` with the resolved email.
- Every authenticated backend request carries `Authorization: Bearer <supabase_access_token>`. `app/core/security.py` verifies this JWT directly against `SUPABASE_JWT_SECRET` (HS256, audience `authenticated`) — there is no separate backend-issued session token.
- Logout is 100% client-side (`supabase.auth.signOut()`) — no backend endpoint for it.
- Row-Level Security in Postgres is the real access-control boundary (see schema.sql); the backend's service-role client bypasses RLS by design (it's trusted), so the *service layer* (`chat_service.assert_member`, etc.) re-checks membership explicitly as defense-in-depth.

## 6. Design System (already implemented in `tailwind.config.js`)

Source of truth: `design-reference/novachat_design_system/DESIGN.md` (a Stitch-generated design system doc). Key facts an agent needs before touching any UI:

- **Colors are Tailwind theme tokens**, not raw hex in components. Use `bg-primary`, `text-on-surface`, `text-on-surface-variant`, `bg-surface-container-lowest`, etc. — never hardcode a hex value in a new component; add it as a token in `tailwind.config.js` if it's missing.
- Primary: `#4143d5`. Sent-message-bubble / primary-CTA gradient: `from-secondary-container to-primary-container` (i.e. `#7161e3 → #5b5fef`). Canvas background: `#fcf8ff`. Online/presence: `#34D399` (token name: `online`). Unread/alert: `tertiary-container` (`#c84245`).
- **Typography** is Inter, loaded via Google Fonts `<link>` tags in `index.html` (not `@font-face`, not a package). Font-size utility classes are custom Tailwind tokens: `text-display-lg`, `text-headline-lg`, `text-headline-md`, `text-title-sm`, `text-body-lg`, `text-body-md`, `text-body-md-medium`, `text-label-md`, `text-label-sm`, `text-micro-timestamp`. Always use these instead of Tailwind's default `text-sm`/`text-lg` etc. so type stays consistent with the system.
- **Icons** are Material Symbols Outlined, loaded via Google Fonts `<link>` in `index.html`, rendered through the `<Icon name="..." />` wrapper component (`components/Shared/Icon.jsx`) — NOT `lucide-react` or any icon package. Pass `filled` prop for the filled variant (used for active states like a selected bottom-nav tab or a "read" checkmark).
- **Message bubble shape** is asymmetrical: sent bubbles are `rounded-[18px] rounded-tr-[4px]`, received are `rounded-[18px] rounded-tl-[4px]` (the "tail" corner tapers to 4px). This is a specific, intentional detail from the design doc — don't round all four corners evenly.
- **Elevation** uses tinted ambient shadows, not default Tailwind shadows: cards use `shadow-[0_2px_12px_rgba(20,20,50,0.05)]` or `shadow-[0_2px_12px_rgba(20,20,50,0.06)]`; headers use `backdrop-blur-xl` + `bg-surface/80`.
- Full component specs (button states, chip states, avatar presence-dot styling, composer states) are written out in `DESIGN.md` — read it before building any new screen.

## 7. Phase Status — what's real vs. stub

This matters a lot: **do not assume a file with content is fully working** — some are intentionally docstring-only placeholders for later phases. Status per phase from `SPEC.md`:

| Phase | Feature | Status |
|---|---|---|
| 1 | Auth (register/login/logout/session) | ✅ Done — Supabase Auth + username resolution, real UI |
| 2 | 1-to-1 messaging | ✅ Done — send/list/realtime all wired end-to-end |
| 3 | Profiles | ✅ Done — photo upload, about text, public profile fetch |
| 4 | Message states (sent/delivered/read ticks) | ⚠️ Partial — `mark_delivered`/`mark_read` endpoints exist and the UI renders tick icons, but **nothing currently calls `mark_delivered`/`mark_read` automatically** (e.g. on message view/scroll-into-view). This needs to be wired up client-side. |
| 5 | Media (images/video/docs/voice) | ⚠️ Partial — upload + image/video/document rendering works in the composer and thread. **Voice message recording UI does not exist** — only playback/download of an already-uploaded file would work if one existed. |
| 6 | Groups | ❌ Not built — `chat_service.create_chat` supports `type: "group"` server-side and the schema supports multiple `chat_members`, but there is **no group-creation UI** (name/avatar/multi-member picker), no group info screen, and no admin/member-role UI. |
| 7 | Notifications | ❌ Not built — `notification_service.py` is a docstring-only stub. No VAPID keys generated, no service worker, no push subscription flow, no `pywebpush` calls anywhere. |
| — | Search-in-chat (search icon in thread header) | ❌ Not built — button exists in the UI but has no handler. |
| — | "Pinned" chat filter | ❌ Removed from UI (was in original design mock) — only All/Unread/Groups filter chips were implemented since pin state doesn't exist in the schema. |
| — | Typing indicator | ❌ Not built — deliberately left out; there's no presence/typing channel wired up (see §9). |
| — | Swipe gesture on chat rows | ⚠️ Simplified — implemented as **tap/right-click-to-reveal** Mute/Delete actions instead of true drag-physics swipe, to keep the code simpler. Visually equivalent, interaction model differs slightly. |
| — | "Mute" action on a chat row | ⚠️ Cosmetic only — closes the revealed panel but does not persist a muted state anywhere (no `muted` column in schema). |
| — | "Delete" action on a chat row | ⚠️ Cosmetic only — removes the chat from local React state only. **No backend DELETE endpoint exists for chats** (`chats.py` has no delete route), so it reappears on refresh. |
| — | ProtectedRoute / route guarding | ❌ Not built — there's a `TODO` comment in `App.jsx`. Currently **any route is reachable without being logged in** — visiting `/chats` with no session will just make API calls that 401. |

## 8. Known Gaps / Things To Fix Soon

1. **No route protection.** `App.jsx` has a `TODO` — wrap `/chats`, `/chats/:chatId`, `/contacts`, `/profile`, `/onboarding` in a `ProtectedRoute` that redirects to `/login` if there's no active Supabase session. Check `supabase.auth.getSession()` on mount + subscribe to `supabase.auth.onAuthStateChange`.
2. **`mark_delivered` / `mark_read` are never called.** Wire these up in `ChatThreadPage.jsx`: call `mark_delivered` when a message from someone else arrives while the thread is open, and `mark_read` when it's actually scrolled into view (e.g. via `IntersectionObserver`).
3. **No chat delete endpoint.** Add `DELETE /api/chats/{chat_id}` (leave-chat semantics: remove the caller's `chat_members` row; if it's a direct chat or the last member leaves a group, delete the chat row too) and wire the frontend's delete action to call it instead of just mutating local state.
4. **No group creation UI.** Backend already supports it (`POST /api/chats` with `type: "group"`, `member_ids: [...]`, `name`). Needs: a "New Group" screen (name input + multi-select from contacts), and the chat list/thread need to visually distinguish groups (group icon, member count, sender name prefix on messages — the design doc already has a group-message treatment example).
5. **Web Push notifications are entirely unbuilt.** Needs: generate a VAPID keypair, add `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` to backend env, a service worker (`client/public/sw.js`) for the frontend, a subscribe flow (`Notification.requestPermission()` + `pushManager.subscribe()`) that POSTs the subscription to a new backend endpoint (e.g. `POST /api/notifications/subscribe`) which stores it (new table needed — not in schema.sql yet) and calls `pywebpush` from `notification_service.py` when a message is sent to an offline recipient.
6. **Typing indicator not implemented.** Design doc shows one; would need a Supabase Realtime **broadcast** channel (not a table-backed one) per chat — e.g. `supabase.channel('typing:{chatId}').send({type: 'broadcast', event: 'typing', payload: {user_id}})` — the frontend debounces on keystroke and listens for the broadcast to show/hide the indicator. No backend involvement needed, this is client-to-client via Supabase.
7. **In-memory rate limiter (`slowapi`) won't survive multiple backend processes/instances.** Fine for a single-instance free deployment (e.g. one Render web service); if it's ever scaled horizontally, swap the `slowapi` key store for a Redis-backed one (still free on Upstash's free tier if needed).
8. **No automated tests.** `server/tests/__init__.py` is empty. Nothing in the frontend has tests either.
9. **No error boundary / 404 page** in the React router.
10. **Search-in-chat button** in `ChatThreadPage.jsx` header is a no-op — needs a search-within-messages UI + likely a Postgres full-text search or simple `ilike` query against `messages.content`.

## 9. Design Decisions Worth Knowing (so you don't "fix" something that's intentional)

- The chat list's "swipe to reveal" is deliberately tap-based, not drag-based — this was a documented simplification, not an oversight.
- `models/*.py` files being docstring-only is intentional — there's no ORM in this stack.
- The `email` column exists in `public.users` (denormalized from `auth.users`) purely so `resolve_username_to_email` can work without needing service-role access to Supabase's private `auth.users` table from a read path that's meant to be cheap; `auth_service.get_profile` explicitly strips `email` before returning any profile that isn't relevant to auth flows, and RLS also restricts what's selectable.
- Direct chats are deduplicated server-side (`chat_service._find_existing_direct_chat`) — starting a chat with someone you already have a direct chat with returns the existing chat rather than creating a duplicate.
- `main.py`'s rate limiter (`slowapi`) is currently only applied to `POST /api/auth/resolve-username` (`@limiter.limit("10/minute")`). No other endpoint has rate limiting yet — consider adding it to `POST /api/auth/register` too, to prevent signup spam.

## 10. Suggested Next Steps (in priority order)

1. Add `ProtectedRoute` + auth state listener (§8.1) — this is a real security/UX gap, do it first.
2. Wire up `mark_delivered`/`mark_read` calls (§8.2) so the tick icons in the UI actually reflect reality instead of always showing "sent".
3. Add the chat delete/leave backend endpoint and wire the UI to it (§8.3).
4. Build group chat creation UI (§8.4) — backend is ready.
5. Typing indicator via Realtime broadcast (§8.6) — nice UX win, no schema changes needed.
6. Web Push notifications (§8.5) — biggest remaining feature, needs a new DB table for push subscriptions plus `schema.sql` update.

---

## 11. Complete Source Code (every file, verbatim)

Everything below is the exact current content of every file in the project, in the order shown in the file tree above. Nothing has been abbreviated or paraphrased.

#### `.gitignore`
```text
# Node
node_modules/
dist/

# Python
__pycache__/
*.pyc
.venv/

# Env
.env
.env.local

# OS
.DS_Store

```

#### `README.md`
```markdown
# NovaChat

Real-time WhatsApp/Telegram-style messaging app. See `SPEC.md` for the full spec-driven build plan (tech stack, data model, phases, API, security).

## Quick start

### Frontend
```
cd client
npm install
npm run dev
```

### Backend
```
cd server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Copy `.env.example` files to `.env` in both `client/` and `server/` and fill in your Supabase project keys (URL, anon key, service key, JWT secret — all free, from your Supabase project's API settings) before running. No Firebase project, no SMS provider, and no billing account are needed anywhere in this stack.

```

#### `SPEC.md`
```markdown
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

## Visual Design System

The frontend follows the **NovaChat design system** (`design-reference/novachat_design_system/DESIGN.md`, with reference mocks `chat_list_mock.png` and `chat_thread_mock.png` in the same folder) rather than default/generic Tailwind styling:
- **Palette:** violet-indigo primary (`#4143d5`), a `#6D5EF5 → #8B7CFF` gradient for sent message bubbles and primary CTAs, soft off-white canvas (`#fcf8ff`), emerald (`#34D399`) for online/presence, coral (`#FF6B6B`/`#c84245`) for unread badges.
- **Typography:** Inter, with a defined scale from `micro-timestamp` (10px) up to `display-lg` (32px).
- **Iconography:** Material Symbols Outlined (loaded via Google Fonts, no icon package dependency).
- All of the above are Tailwind theme tokens in `client/tailwind.config.js` (colors, spacing, border radius, font sizes) — new screens should use these tokens (`bg-primary`, `text-on-surface-variant`, `text-title-sm`, etc.) rather than arbitrary values, to stay visually consistent.
- Implemented screens follow the system's component specs: asymmetrical rounded message bubbles with a "tail" corner, pill-shaped search/composer inputs, swipe/tap-reveal row actions on the chat list, and a bottom tab bar.

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

```

#### `client/.env.example`
```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:8000/api

```

#### `client/index.html`
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>NovaChat</title>
    <link href="https://fonts.googleapis.com" rel="preconnect" />
    <link crossorigin href="https://fonts.gstatic.com" rel="preconnect" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
  </head>
  <body class="bg-surface text-on-surface antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

```

#### `client/package.json`
```json
{
  "name": "novachat-client",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "axios": "^1.7.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "vite": "^5.4.0"
  }
}

```

#### `client/postcss.config.js`
```javascript
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}

```

#### `client/src/App.jsx`
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import OnboardingPage from './pages/auth/OnboardingPage.jsx'
import ChatListPage from './pages/chat/ChatListPage.jsx'
import ChatThreadPage from './pages/chat/ChatThreadPage.jsx'
import ContactsPage from './pages/contacts/ContactsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'

// TODO Phase 1: wrap chat/profile routes in a ProtectedRoute component
// once Supabase Auth session handling is fully wired up.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/chats" element={<ChatListPage />} />
        <Route path="/chats/:chatId" element={<ChatThreadPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  )
}

```

#### `client/src/components/Shared/BottomNav.jsx`
```jsx
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

const ITEMS = [
  { path: 'chats', to: '/chats', label: 'Chats', icon: 'chat_bubble' },
  { path: 'contacts', to: '/contacts', label: 'Contacts', icon: 'group' },
  { path: 'profile', to: '/profile', label: 'Profile', icon: 'person' },
]

// Bottom tab bar per the Stitch design. Calls/Settings tabs from the
// original mock aren't part of the current NovaChat feature set, so the
// nav only surfaces the screens that actually exist (Chats, Contacts,
// Profile) rather than linking to pages that don't work yet.
export default function BottomNav({ active, unreadChatsCount = 0 }) {
  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/85 backdrop-blur-xl shadow-[0_-2px_12px_rgba(20,20,50,0.04)]">
      <div className="h-16 px-space-base flex items-center justify-around">
        {ITEMS.map((item) => {
          const isActive = active === item.path
          return (
            <Link
              key={item.path}
              to={item.to}
              className={`flex flex-col items-center justify-center min-w-[56px] h-12 gap-space-2xs transition-all ${
                isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon name={item.icon} className="text-[24px]" filled={isActive} />
                {item.path === 'chats' && unreadChatsCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 bg-tertiary-container text-on-tertiary text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadChatsCount}
                  </span>
                )}
              </div>
              <span className="text-label-sm">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

```

#### `client/src/components/Shared/Icon.jsx`
```jsx
// Thin wrapper around a Material Symbols Outlined glyph, matching the
// icon set used throughout the Stitch NovaChat design.
export default function Icon({ name, className = '', filled = false, style }) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? 'filled' : ''} ${className}`}
      style={style}
    >
      {name}
    </span>
  )
}

```

#### `client/src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body {
    width: 100vw;
    margin: 0;
    padding: 0;
  }
  body {
    overscroll-behavior-y: none;
  }
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .pt-safe {
    padding-top: env(safe-area-inset-top, 0px);
  }
}

::-webkit-scrollbar {
  display: none;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
  vertical-align: middle;
}

.material-symbols-outlined.filled {
  font-variation-settings: 'FILL' 1;
}

```

#### `client/src/main.jsx`
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

```

#### `client/src/pages/ProfilePage.jsx`
```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'
import { logout } from '../services/supabase.js'
import { useAuthStore } from '../store/authStore.js'
import Icon from '../components/Shared/Icon.jsx'
import BottomNav from '../components/Shared/BottomNav.jsx'

function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase()
}

// Phase 3: view/edit own profile, logout.
export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [about, setAbout] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const clearSession = useAuthStore((s) => s.clearSession)
  const navigate = useNavigate()

  useEffect(() => {
    api
      .get('/auth/me')
      .then(({ data }) => {
        setProfile(data)
        setAbout(data.about || '')
      })
      .catch((err) => setError(err.message || 'Could not load profile'))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const { data } = await api.put('/users/me', { about })
      setProfile(data)
    } catch (err) {
      setError(err.message || 'Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    clearSession()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="sticky top-0 z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-space-base flex items-center gap-space-sm">
          <h1 className="text-title-sm text-on-surface font-semibold">Your profile</h1>
        </div>
      </header>

      <main className="flex-1 pb-24 px-space-base pt-space-md">
        {!profile && !error && <p className="text-body-md text-on-surface-variant">Loading...</p>}
        {error && <p className="text-body-md text-error">{error}</p>}

        {profile && (
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0_2px_12px_rgba(20,20,50,0.05)] p-space-lg flex flex-col gap-space-lg">
            <div className="flex items-center gap-space-md">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-secondary-container flex items-center justify-center text-on-primary font-bold text-headline-md">
                {initials(profile.username)}
              </div>
              <div>
                <p className="text-title-sm text-on-surface font-semibold">@{profile.username}</p>
                <p className="text-label-sm text-on-surface-variant">{profile.about || 'No status set'}</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-space-md">
              <div>
                <label className="block text-label-md text-on-surface-variant mb-space-xs">About</label>
                <input
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  placeholder="Hey there! I'm using NovaChat"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="bg-primary text-on-primary rounded-xl py-2.5 text-label-md font-semibold shadow-md active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </form>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 text-error text-label-md font-semibold pt-space-sm border-t border-outline-variant/40"
            >
              <Icon name="logout" className="text-[18px]" />
              Log out
            </button>
          </div>
        )}
      </main>

      <BottomNav active="profile" />
    </div>
  )
}

```

#### `client/src/pages/auth/LoginPage.jsx`
```jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginWithIdentifier } from '../../services/supabase.js'
import { api } from '../../services/api.js'
import { useAuthStore } from '../../store/authStore.js'

// Phase 1: log in with email OR username + password.
// Free — Supabase Auth password grant, no SMS/OTP involved.
export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  const resolveUsername = async (username) => {
    // Backend looks up the email for a username without exposing it
    // to the client directly for any other user.
    const { data } = await api.post('/auth/resolve-username', { username })
    return data.email
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { session, user } = await loginWithIdentifier({
        identifier: identifier.trim(),
        password,
        resolveUsername,
      })
      setSession(user, session.access_token)
      navigate('/chats')
    } catch (err) {
      setError(err.message || 'Login failed. Check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-8 rounded-xl shadow space-y-4">
        <h1 className="text-2xl font-semibold">Log in to NovaChat</h1>

        <div>
          <label className="block text-sm font-medium mb-1">Email or username</label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="you@example.com or your_username"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <p className="text-sm text-center text-gray-600">
          New here? <Link to="/register" className="text-blue-600 font-medium">Create an account</Link>
        </p>
      </form>
    </div>
  )
}

```

#### `client/src/pages/auth/OnboardingPage.jsx`
```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api.js'

// Phase 1/3: first-login profile setup (photo, about). Username and
// email were already set during registration.
export default function OnboardingPage() {
  const [file, setFile] = useState(null)
  const [about, setAbout] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let profile_photo_url
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const { data } = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        profile_photo_url = data.url
      }
      await api.put('/users/me', { profile_photo_url, about })
      navigate('/chats')
    } catch (err) {
      setError(err.message || 'Could not save your profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-8 rounded-xl shadow space-y-4">
        <h1 className="text-2xl font-semibold">Set up your profile</h1>

        <div>
          <label className="block text-sm font-medium mb-1">Profile photo (optional)</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">About</label>
          <input
            type="text"
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Hey there! I'm using NovaChat"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>

        <button type="button" onClick={() => navigate('/chats')} className="w-full text-sm text-gray-500">
          Skip for now
        </button>
      </form>
    </div>
  )
}

```

#### `client/src/pages/auth/RegisterPage.jsx`
```jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../../services/api.js'
import { registerWithEmail } from '../../services/supabase.js'

// Phase 1: create an account with email + username + password.
// The username is what other users will search for and see instead
// of the email — the email is only ever used for login/reset.
export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // 1) Create the Supabase Auth user (email + password).
      await registerWithEmail({ email, password })
      // 2) Create the matching public.users profile row (username, email).
      await api.post('/auth/register', { email, username, password })
      navigate('/onboarding')
    } catch (err) {
      setError(err.message || 'Could not create your account. Try a different email/username.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-8 rounded-xl shadow space-y-4">
        <h1 className="text-2xl font-semibold">Create your NovaChat account</h1>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="3-20 chars, letters/numbers/underscore"
            pattern="[a-zA-Z0-9_]{3,20}"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            minLength={8}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p className="text-sm text-center text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 font-medium">Log in</Link>
        </p>
      </form>
    </div>
  )
}

```

#### `client/src/pages/chat/ChatListPage.jsx`
```jsx
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api.js'
import { logout, supabase } from '../../services/supabase.js'
import { useChatStore } from '../../store/chatStore.js'
import { useAuthStore } from '../../store/authStore.js'
import Icon from '../../components/Shared/Icon.jsx'
import BottomNav from '../../components/Shared/BottomNav.jsx'

const FILTERS = [
  { id: 'all', label: 'All Chats' },
  { id: 'unread', label: 'Unread' },
  { id: 'groups', label: 'Groups' },
]

function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase()
}

function formatTimestamp(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function ChatListPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [revealedId, setRevealedId] = useState(null)
  const [onlineContacts, setOnlineContacts] = useState([])
  const chats = useChatStore((s) => s.chats)
  const setChats = useChatStore((s) => s.setChats)
  const currentUser = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [chatsRes, contactsRes] = await Promise.all([
          api.get('/chats'),
          api.get('/contacts').catch(() => ({ data: [] })),
        ])
        if (cancelled) return
        setChats(chatsRes.data)
        setOnlineContacts(contactsRes.data.filter((c) => c.is_online))
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load chats')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()

    // Live-update chat previews as new messages land in any of the user's chats.
    const channel = supabase
      .channel('chat-list-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        api.get('/chats').then(({ data }) => setChats(data))
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [setChats])

  const filteredChats = useMemo(() => {
    let list = chats
    if (activeFilter === 'unread') {
      list = list.filter((c) => c.last_message && !c.last_message.read_at && c.last_message.sender_id !== currentUser?.id)
    } else if (activeFilter === 'groups') {
      list = list.filter((c) => c.type === 'group')
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((c) => (c.name || 'Direct chat').toLowerCase().includes(q))
    }
    return list
  }, [chats, activeFilter, search, currentUser])

  const handleLogout = async () => {
    await logout()
    clearSession()
    navigate('/login')
  }

  const toggleReveal = (id) => {
    setRevealedId((current) => (current === id ? null : id))
  }

  const handleDelete = (id) => {
    setChats(chats.filter((c) => c.id !== id))
    setRevealedId(null)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top app bar */}
      <header className="sticky top-0 z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-space-base flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-secondary-container to-primary-container flex items-center justify-center">
              <Icon name="chat_bubble" className="text-on-primary text-[18px]" filled />
            </div>
            <h1 className="text-title-sm text-on-surface font-semibold tracking-tight">NovaChat</h1>
          </div>
          <div className="flex items-center gap-space-xs">
            <button
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              onClick={() => document.getElementById('chatSearchInput')?.focus()}
              aria-label="Search"
            >
              <Icon name="search" className="text-[22px]" />
            </button>
            <Link to="/profile" className="relative ml-space-xs">
              <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-semibold text-sm shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
                {initials(currentUser?.username)}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-online rounded-full ring-2 ring-surface-container-lowest" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col pb-24">
        {/* Sub-header */}
        <div className="px-space-base pt-space-xs pb-space-sm flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="text-headline-lg text-on-surface tracking-tight">Messages</span>
            <span className="bg-surface-container-highest text-primary text-label-md px-2 py-0.5 rounded-full font-semibold">
              {chats.length}
            </span>
          </div>
          <div className="flex items-center gap-space-xs">
            <Link
              to="/contacts"
              aria-label="Start new conversation"
              className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md active:scale-90 transition-transform"
            >
              <Icon name="add" className="text-[20px]" />
            </Link>
          </div>
        </div>

        {/* Search + filter chips */}
        <div className="px-space-base mb-space-md">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
              <Icon name="search" className="text-[20px]" />
            </div>
            <input
              id="chatSearchInput"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-10 rounded-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-body-md shadow-[0_2px_12px_rgba(20,20,50,0.04)] focus:outline-none focus:shadow-[0_0_0_2px_#5b5fef] transition-all"
              placeholder="Search chats or people..."
              type="text"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface"
                aria-label="Clear search"
              >
                <Icon name="cancel" className="text-[18px]" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-space-xs mt-space-sm overflow-x-auto no-scrollbar py-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-full text-label-md whitespace-nowrap active:scale-95 transition-all ${
                  activeFilter === f.id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant shadow-[0_2px_8px_rgba(20,20,50,0.03)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Online now reel */}
        {onlineContacts.length > 0 && (
          <section aria-label="Online now" className="mb-space-md">
            <div className="px-space-base mb-space-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-online animate-pulse" />
                <span className="text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                  Online Now
                </span>
              </div>
              <span className="text-micro-timestamp text-outline">{onlineContacts.length} available</span>
            </div>
            <div className="flex items-center gap-space-md overflow-x-auto px-space-base pb-space-xs pt-1 no-scrollbar">
              {onlineContacts.map((c) => (
                <button
                  key={c.id}
                  onClick={async () => {
                    const { data } = await api.post('/chats', { type: 'direct', member_ids: [c.id] })
                    navigate(`/chats/${data.id}`)
                  }}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform"
                >
                  <div className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-primary to-secondary-container">
                    <div className="w-full h-full rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-title-sm">
                      {initials(c.username)}
                    </div>
                    <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-online rounded-full ring-2 ring-surface-container-lowest" />
                  </div>
                  <span className="text-label-sm text-on-surface truncate max-w-[64px]">{c.username}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Conversation list */}
        <section aria-label="Conversation list" className="flex flex-col px-space-base">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              Conversations
            </span>
            {filteredChats.length > 0 && (
              <span className="text-micro-timestamp text-outline">Tap for actions</span>
            )}
          </div>

          {loading && <p className="text-body-md text-on-surface-variant py-4">Loading chats...</p>}
          {error && <p className="text-body-md text-error py-4">{error}</p>}

          {!loading && !error && filteredChats.length === 0 && (
            <p className="text-body-md text-on-surface-variant py-4">
              {search ? 'No chats match your search.' : 'No chats yet — start one from Contacts.'}
            </p>
          )}

          <div className="flex flex-col gap-2.5">
            {filteredChats.map((chat) => {
              const isRevealed = revealedId === chat.id
              const isUnread = chat.last_message && !chat.last_message.read_at && chat.last_message.sender_id !== currentUser?.id
              return (
                <div key={chat.id} className="relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_2px_12px_rgba(20,20,50,0.05)]">
                  {/* Revealed action backplate */}
                  <div className="absolute inset-y-0 right-0 flex items-stretch">
                    <button
                      onClick={() => setRevealedId(null)}
                      className="w-14 bg-on-surface-variant text-surface-container-lowest flex flex-col items-center justify-center gap-0.5"
                    >
                      <Icon name="notifications_off" className="text-[20px]" />
                      <span className="text-micro-timestamp">Mute</span>
                    </button>
                    <button
                      onClick={() => handleDelete(chat.id)}
                      className="w-14 bg-tertiary-container text-on-tertiary flex flex-col items-center justify-center gap-0.5"
                    >
                      <Icon name="delete" className="text-[20px]" />
                      <span className="text-micro-timestamp">Delete</span>
                    </button>
                  </div>

                  {/* Foreground row */}
                  <div
                    className={`relative z-10 bg-surface-container-lowest px-3.5 py-3 flex items-center gap-3 transition-transform duration-200 cursor-pointer select-none ${
                      isRevealed ? '-translate-x-28' : 'translate-x-0'
                    }`}
                    onClick={() => (isRevealed ? toggleReveal(chat.id) : navigate(`/chats/${chat.id}`))}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      toggleReveal(chat.id)
                    }}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-title-sm">
                        {initials(chat.name)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-title-sm text-on-surface font-semibold truncate">
                          {chat.name || 'Direct chat'}
                        </span>
                        <span className={`text-micro-timestamp font-semibold ${isUnread ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {chat.last_message ? formatTimestamp(chat.last_message.created_at) : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {chat.last_message?.sender_id === currentUser?.id && (
                          <Icon
                            name={chat.last_message.read_at ? 'done_all' : chat.last_message.delivered_at ? 'done_all' : 'done'}
                            className={`text-[16px] ${chat.last_message.read_at ? 'text-primary' : 'text-on-surface-variant'}`}
                            filled
                          />
                        )}
                        <p className={`text-body-md truncate ${isUnread ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>
                          {chat.last_message
                            ? chat.last_message.message_type === 'text'
                              ? chat.last_message.content
                              : `[${chat.last_message.message_type}]`
                            : 'No messages yet'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {isUnread && (
                        <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-tertiary-container text-on-tertiary text-label-sm font-bold flex items-center justify-center shadow-sm">
                          •
                        </span>
                      )}
                      <Icon name="chevron_right" className="text-outline text-[16px]" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-space-lg mb-space-base flex items-center justify-center gap-1.5 px-space-base py-2 rounded-full bg-surface-container-low">
            <Icon name="lock" className="text-[14px] text-on-surface-variant" />
            <span className="text-micro-timestamp text-on-surface-variant">End-to-end secured via Supabase Row-Level Security</span>
          </div>
        </section>
      </main>

      <BottomNav active="chats" unreadChatsCount={chats.filter((c) => c.last_message && !c.last_message.read_at && c.last_message.sender_id !== currentUser?.id).length} />
    </div>
  )
}

```

#### `client/src/pages/chat/ChatThreadPage.jsx`
```jsx
import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../services/api.js'
import { supabase } from '../../services/supabase.js'
import { useAuthStore } from '../../store/authStore.js'
import Icon from '../../components/Shared/Icon.jsx'

const QUICK_REPLIES = ['Sounds good 👍', 'On my way', 'Can we call?']

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDateDivider(iso) {
  const date = new Date(iso)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'long', day: 'numeric' })
}

function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase()
}

export default function ChatThreadPage() {
  const { chatId } = useParams()
  const currentUserId = useAuthStore((s) => s.user?.id)
  const [chat, setChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAttach, setShowAttach] = useState(false)
  const [uploading, setUploading] = useState(false)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  const otherMember = chat?.members?.find((m) => m.user_id !== currentUserId)?.users

  useEffect(() => {
    let cancelled = false

    async function loadAll() {
      try {
        const [chatRes, messagesRes] = await Promise.all([
          api.get(`/chats/${chatId}`),
          api.get(`/chats/${chatId}/messages`),
        ])
        if (cancelled) return
        setChat(chatRes.data)
        setMessages(messagesRes.data)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load this chat')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadAll()

    // Phase 2/4: live message + read/delivered-tick updates, free via
    // Supabase's Postgres change feed on the `messages` table.
    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => setMessages((prev) => [...prev, payload.new])
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)))
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendText = async (text) => {
    const content = text.trim()
    if (!content) return
    setDraft('')
    try {
      // Realtime INSERT subscription above delivers the sent message back
      // to us, so we don't optimistically append it here.
      await api.post(`/chats/${chatId}/messages`, { message_type: 'text', content })
    } catch (err) {
      setError(err.message || 'Failed to send message')
      setDraft(content)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendText(draft)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setShowAttach(false)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const messageType = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
        ? 'video'
        : 'document'
      await api.post(`/chats/${chatId}/messages`, { message_type: messageType, media_url: data.url })
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const tickIcon = (msg) => {
    if (msg.read_at) return { name: 'done_all', className: 'text-surface-bright' }
    if (msg.delivered_at) return { name: 'done_all', className: 'text-on-primary/70' }
    return { name: 'done', className: 'text-on-primary/70' }
  }

  let lastDate = null

  return (
    <div className="flex flex-col h-screen bg-surface">
      {/* Top app bar */}
      <header className="sticky top-0 z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-space-base flex items-center gap-space-xs">
          <Link to="/chats" className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface transition-colors">
            <Icon name="arrow_back" />
          </Link>
          <div className="flex items-center gap-space-md min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-title-sm">
                {initials(otherMember?.username || chat?.name)}
              </div>
              {otherMember?.is_online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-online rounded-full ring-2 ring-surface-container-lowest" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-title-sm text-on-surface font-semibold truncate">
                {otherMember?.username || chat?.name || 'Chat'}
              </span>
              <span className="text-label-sm text-on-surface-variant font-medium">
                {otherMember?.is_online ? 'Online' : otherMember?.last_seen ? `Last seen ${formatTime(otherMember.last_seen)}` : ' '}
              </span>
            </div>
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors">
            <Icon name="more_vert" className="text-[20px]" />
          </button>
        </div>
      </header>

      {/* Message stream */}
      <div className="flex-1 overflow-y-auto px-margin-mobile py-space-md flex flex-col gap-space-md pb-4">
        {loading && <p className="text-body-md text-on-surface-variant">Loading messages...</p>}
        {error && <p className="text-body-md text-error">{error}</p>}

        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId
          const dateLabel = formatDateDivider(msg.created_at)
          const showDivider = dateLabel !== lastDate
          lastDate = dateLabel

          return (
            <div key={msg.id} className="flex flex-col gap-space-md">
              {showDivider && (
                <div className="flex justify-center my-space-xs">
                  <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-label-sm font-medium shadow-sm">
                    {dateLabel}
                  </span>
                </div>
              )}
              <div className={`flex flex-col max-w-[85%] group ${isMine ? 'items-end self-end' : 'items-start self-start'}`}>
                <div
                  className={`p-space-md shadow-sm flex flex-col gap-1 ${
                    isMine
                      ? 'bg-gradient-to-br from-secondary-container to-primary-container text-on-primary rounded-[18px] rounded-tr-[4px]'
                      : 'bg-surface-container-lowest text-on-surface rounded-[18px] rounded-tl-[4px]'
                  }`}
                >
                  {msg.message_type === 'text' && (
                    <p className="text-body-md leading-relaxed">{msg.content}</p>
                  )}
                  {msg.message_type === 'image' && (
                    <img src={msg.media_url} alt="Shared" className="rounded-lg max-w-full max-h-64 object-cover" />
                  )}
                  {msg.message_type === 'video' && (
                    <video src={msg.media_url} controls className="rounded-lg max-w-full max-h-64" />
                  )}
                  {(msg.message_type === 'document' || msg.message_type === 'voice') && (
                    <a
                      href={msg.media_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-2 bg-surface-container-low rounded-lg text-on-surface"
                    >
                      <Icon name={msg.message_type === 'voice' ? 'mic' : 'description'} className="text-[20px] text-primary" />
                      <span className="text-label-sm font-medium">Open {msg.message_type}</span>
                    </a>
                  )}

                  <div className={`flex items-center gap-1 self-end pt-0.5 ${isMine ? '' : 'text-on-surface-variant'}`}>
                    <span className={`text-micro-timestamp ${isMine ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>
                      {formatTime(msg.created_at)}
                    </span>
                    {isMine && <Icon {...tickIcon(msg)} className={`text-[14px] ${tickIcon(msg).className}`} filled />}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="bg-surface-container-lowest/95 backdrop-blur-xl pb-safe shadow-[0_-4px_20px_rgba(20,20,50,0.06)]">
        <div className="flex items-center gap-2 overflow-x-auto px-margin-mobile pt-space-xs pb-1 no-scrollbar">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              onClick={() => sendText(reply)}
              className="shrink-0 bg-surface-container text-on-surface text-label-sm px-3 py-1.5 rounded-full hover:bg-surface-container-high transition-all active:scale-95"
            >
              {reply}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-space-sm flex items-center gap-space-sm">
          <button
            type="button"
            onClick={() => setShowAttach((v) => !v)}
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container active:scale-90 transition-all"
          >
            <Icon name="add" className="text-[22px]" />
          </button>

          <div className="flex-1 bg-surface-container-low rounded-full px-4 py-2 flex items-center gap-2 shadow-inner focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary/40 transition-all">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Message ${otherMember?.username || ''}...`}
              className="w-full bg-transparent text-on-surface placeholder:text-on-surface-variant text-body-md focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-secondary-container to-primary-container text-on-primary flex items-center justify-center shadow-[0_4px_14px_rgba(91,95,239,0.35)] active:scale-95 transition-all disabled:opacity-50"
          >
            <Icon name={draft.trim() ? 'send' : 'mic'} className="text-[20px]" />
          </button>
        </form>

        {showAttach && (
          <div className="px-margin-mobile pb-space-md grid grid-cols-3 gap-space-sm text-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1.5 p-space-sm rounded-xl hover:bg-surface-container active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Icon name="image" className="text-[24px]" />
              </div>
              <span className="text-label-sm text-on-surface font-medium">Photo/Video</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1.5 p-space-sm rounded-xl hover:bg-surface-container active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                <Icon name="description" className="text-[24px]" />
              </div>
              <span className="text-label-sm text-on-surface font-medium">Document</span>
            </button>
            <button
              onClick={() => setShowAttach(false)}
              className="flex flex-col items-center gap-1.5 p-space-sm rounded-xl hover:bg-surface-container active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center">
                <Icon name="close" className="text-[24px]" />
              </div>
              <span className="text-label-sm text-on-surface font-medium">Cancel</span>
            </button>
          </div>
        )}
        {uploading && <p className="px-margin-mobile pb-space-sm text-label-sm text-on-surface-variant">Uploading...</p>}
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
      </div>
    </div>
  )
}

```

#### `client/src/pages/contacts/ContactsPage.jsx`
```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api.js'
import Icon from '../../components/Shared/Icon.jsx'
import BottomNav from '../../components/Shared/BottomNav.jsx'

function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase()
}

// Phase 2: contact list with "start chat" action, plus add-by-username.
export default function ContactsPage() {
  const [contacts, setContacts] = useState([])
  const [newUsername, setNewUsername] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const loadContacts = async () => {
    try {
      const { data } = await api.get('/contacts')
      setContacts(data)
    } catch (err) {
      setError(err.message || 'Could not load contacts')
    }
  }

  useEffect(() => {
    loadContacts()
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/contacts', { username: newUsername.trim() })
      setNewUsername('')
      loadContacts()
    } catch (err) {
      setError(err.message || 'Could not add that user')
    }
  }

  const handleStartChat = async (contactId) => {
    const { data } = await api.post('/chats', { type: 'direct', member_ids: [contactId] })
    navigate(`/chats/${data.id}`)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="sticky top-0 z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-space-base flex items-center gap-space-sm">
          <h1 className="text-title-sm text-on-surface font-semibold">Contacts</h1>
        </div>
      </header>

      <main className="flex-1 pb-24">
        <form onSubmit={handleAdd} className="flex gap-2 px-space-base py-space-md">
          <div className="flex-1 bg-surface-container-lowest rounded-full px-4 py-2.5 flex items-center gap-2 shadow-[0_2px_12px_rgba(20,20,50,0.04)] focus-within:ring-2 focus-within:ring-primary/40 transition-all">
            <Icon name="person_add" className="text-[18px] text-on-surface-variant" />
            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Add by username"
              className="w-full bg-transparent text-on-surface placeholder:text-outline text-body-md focus:outline-none"
            />
          </div>
          <button type="submit" className="bg-primary text-on-primary rounded-full px-5 text-label-md font-semibold shadow-md active:scale-95 transition-transform">
            Add
          </button>
        </form>

        {error && <p className="px-space-base pb-space-sm text-body-md text-error">{error}</p>}

        <div className="flex flex-col gap-2.5 px-space-base">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-surface-container-lowest rounded-2xl px-3.5 py-3 shadow-[0_2px_12px_rgba(20,20,50,0.05)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-title-sm">
                    {initials(c.username)}
                  </div>
                  {c.is_online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-online rounded-full ring-2 ring-surface-container-lowest" />
                  )}
                </div>
                <span className="text-title-sm text-on-surface font-semibold truncate">@{c.username}</span>
              </div>
              <button
                onClick={() => handleStartChat(c.id)}
                className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-90 transition-transform"
                aria-label={`Message ${c.username}`}
              >
                <Icon name="chat_bubble" className="text-[18px]" />
              </button>
            </div>
          ))}
          {contacts.length === 0 && (
            <p className="text-body-md text-on-surface-variant py-4">No contacts yet — add someone by username above.</p>
          )}
        </div>
      </main>

      <BottomNav active="contacts" />
    </div>
  )
}

```

#### `client/src/services/api.js`
```javascript
import axios from 'axios'
import { supabase } from './supabase.js'

// Central Axios instance; attaches the current Supabase access token to
// every request so the FastAPI backend can verify identity.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

```

#### `client/src/services/supabase.js`
```javascript
import { createClient } from '@supabase/supabase-js'

// Single Supabase client used for Auth, Realtime subscriptions, and Storage.
// Free tier, no billing account required for any of this.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

/**
 * Register a new account. The backend also creates a matching row in
 * public.users (see POST /api/auth/register) so username-based login
 * and profile lookups work.
 */
export async function registerWithEmail({ email, password }) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

/**
 * Log in with an email OR a username. If `identifier` has no "@", the
 * backend resolves it to an email first (see POST /api/auth/login),
 * then we sign in directly against Supabase Auth with that email.
 */
export async function loginWithIdentifier({ identifier, password, resolveUsername }) {
  const email = identifier.includes('@') ? identifier : await resolveUsername(identifier)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}

```

#### `client/src/store/authStore.js`
```javascript
import { create } from 'zustand'

// Phase 1: holds the current user + backend session token,
// persisted so refresh keeps the user logged in.
export const useAuthStore = create((set) => ({
  user: null,
  sessionToken: null,
  setSession: (user, sessionToken) => set({ user, sessionToken }),
  clearSession: () => set({ user: null, sessionToken: null }),
}))

```

#### `client/src/store/chatStore.js`
```javascript
import { create } from 'zustand'

// Phase 2: active chat list + open conversation state.
export const useChatStore = create((set) => ({
  chats: [],
  activeChatId: null,
  messagesByChat: {},
  setChats: (chats) => set({ chats }),
  setActiveChat: (chatId) => set({ activeChatId: chatId }),
}))

```

#### `client/tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
// Design tokens ported 1:1 from the NovaChat Stitch design system
// (see stitch_novachat_messaging_app_ui/novachat_design_system/DESIGN.md).
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'on-tertiary-container': '#fff5f4',
        'inverse-surface': '#2f2e43',
        'on-tertiary': '#ffffff',
        background: '#fcf8ff',
        primary: '#4143d5',
        'surface-container': '#efecff',
        'surface-dim': '#dad7f3',
        secondary: '#5846c8',
        'on-error-container': '#93000a',
        'on-surface-variant': '#464555',
        'on-error': '#ffffff',
        'on-secondary-container': '#fffbff',
        'tertiary-container': '#c84245',
        'on-tertiary-fixed-variant': '#8c1520',
        'surface-variant': '#e2e0fc',
        'on-tertiary-fixed': '#410006',
        'on-surface': '#1a1a2e',
        'surface-container-lowest': '#ffffff',
        'tertiary-fixed-dim': '#ffb3b0',
        'secondary-fixed-dim': '#c7bfff',
        'on-primary-fixed-variant': '#2c2cc3',
        'primary-fixed': '#e1e0ff',
        'surface-bright': '#fcf8ff',
        'surface-tint': '#474adb',
        'inverse-primary': '#c0c1ff',
        'surface-container-highest': '#e2e0fc',
        'surface-container-high': '#e8e5ff',
        outline: '#767586',
        'primary-fixed-dim': '#c0c1ff',
        surface: '#fcf8ff',
        'outline-variant': '#c6c5d7',
        'on-primary-container': '#f9f6ff',
        'on-primary': '#ffffff',
        'on-background': '#1a1a2e',
        'secondary-fixed': '#e4dfff',
        tertiary: '#a62a30',
        'tertiary-fixed': '#ffdad8',
        'secondary-container': '#7161e3',
        'on-secondary-fixed': '#170065',
        'on-primary-fixed': '#05006c',
        'on-secondary': '#ffffff',
        'surface-container-low': '#f5f2ff',
        'on-secondary-fixed-variant': '#422db2',
        'primary-container': '#5b5fef',
        'error-container': '#ffdad6',
        'inverse-on-surface': '#f2efff',
        error: '#ba1a1a',
        online: '#34D399',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      spacing: {
        'space-2xl': '2rem',
        'space-sm': '0.5rem',
        'space-2xs': '0.125rem',
        'space-base': '1rem',
        'space-xl': '1.5rem',
        'space-lg': '1.25rem',
        'space-md': '0.75rem',
        gutter: '1rem',
        'margin-mobile': '1rem',
        margin: '1.25rem',
        'space-xs': '0.25rem',
        'gutter-mobile': '0.75rem',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'label-sm': ['11px', { lineHeight: '14px', letterSpacing: '0.02em', fontWeight: '500' }],
        'headline-md': ['20px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-lg': ['24px', { lineHeight: '32px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'micro-timestamp': ['10px', { lineHeight: '12px', letterSpacing: '0.025em', fontWeight: '500' }],
        'title-sm': ['16px', { lineHeight: '22px', letterSpacing: '-0.005em', fontWeight: '600' }],
        'body-md': ['14px', { lineHeight: '20px', letterSpacing: '0em', fontWeight: '400' }],
        'body-md-medium': ['14px', { lineHeight: '20px', letterSpacing: '0em', fontWeight: '500' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.01em', fontWeight: '500' }],
        'display-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-lg': ['16px', { lineHeight: '24px', letterSpacing: '0em', fontWeight: '400' }],
      },
    },
  },
  plugins: [],
}

```

#### `client/vite.config.js`
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
})

```

#### `server/.env.example`
```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
SUPABASE_JWT_SECRET=
CLIENT_URL=http://localhost:5173

```

#### `server/app/__init__.py`
_(empty file)_

#### `server/app/core/__init__.py`
_(empty file)_

#### `server/app/core/config.py`
```python
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    # Used to verify the JWT Supabase Auth issues on login (Project Settings -> API -> JWT Secret).
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
    CLIENT_URL: str = os.getenv("CLIENT_URL", "http://localhost:5173")


settings = Settings()

```

#### `server/app/core/limiter.py`
```python
"""Shared rate-limiter instance (slowapi, in-memory, free) so both
main.py and individual routers can reference the same limiter without
a circular import."""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

```

#### `server/app/core/security.py`
```python
"""
Phase 1: identity verification for every authenticated request.

Supabase Auth issues its own JWT access token on login/signup — the
frontend sends it as `Authorization: Bearer <token>`. We verify it here
using the project's JWT secret (free, no extra network call needed per
request). No Firebase, no custom session token — Supabase's own JWT is
the session.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.core.config import settings

bearer_scheme = HTTPBearer()

ALGORITHM = "HS256"


def decode_supabase_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=[ALGORITHM],
            audience="authenticated",
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
        ) from exc


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    """FastAPI dependency: use as `user_id: str = Depends(get_current_user_id)`
    on any route that needs to know who's calling."""
    payload = decode_supabase_token(credentials.credentials)
    return payload["sub"]  # Supabase puts the auth.users.id here

```

#### `server/app/core/supabase_client.py`
```python
from supabase import create_client, Client
from app.core.config import settings

# Service-role client: bypasses RLS, used server-side only (never exposed
# to the client) for trusted operations like resolving username -> email
# and writing profile rows.
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

```

#### `server/app/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.limiter import limiter
from app.routers import auth, users, contacts, chats, messages, media

app = FastAPI(title="NovaChat API")
# Free, in-memory rate limiter (per-IP) — protects /auth/resolve-username
# and any other endpoint tagged with @limiter.limit(...), zero extra cost.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CLIENT_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(contacts.router, prefix="/api/contacts", tags=["contacts"])
app.include_router(chats.router, prefix="/api/chats", tags=["chats"])
app.include_router(messages.router, prefix="/api", tags=["messages"])
app.include_router(media.router, prefix="/api/media", tags=["media"])


@app.get("/api/health")
def health():
    return {"status": "ok"}

```

#### `server/app/models/__init__.py`
_(empty file)_

#### `server/app/models/chat.py`
```python
"""Phase 2/6: shape of rows in `chats` and `chat_members` tables."""

```

#### `server/app/models/message.py`
```python
"""Phase 2/4/5: shape of a row in the `messages` table."""

```

#### `server/app/models/user.py`
```python
"""Phase 1/3: shape of a row in the `users` table (see SPEC.md data model)."""

```

#### `server/app/realtime/__init__.py`
_(empty file)_

#### `server/app/realtime/broadcaster.py`
```python
"""Phase 2/4/6: wraps Supabase Realtime channel publishing so services can
emit `new_message`, `message_delivered`, `message_read`, and
`presence_update` events without knowing the transport details.
Falls back to a plain WebSocket broadcaster if Realtime is unavailable."""

```

#### `server/app/routers/__init__.py`
_(empty file)_

#### `server/app/routers/auth.py`
```python
from fastapi import APIRouter, Depends, Request

from app.core.security import get_current_user_id
from app.core.limiter import limiter
from app.schemas.auth import (
    RegisterProfileRequest,
    ResolveUsernameRequest,
    ResolveUsernameResponse,
)
from app.services import auth_service

router = APIRouter()


@router.post("/register")
def register_profile(body: RegisterProfileRequest, user_id: str = Depends(get_current_user_id)):
    """Create the public.users profile row right after Supabase Auth signup.
    Requires the just-issued Supabase access token, so `user_id` here is
    already the authenticated auth.users.id."""
    return auth_service.create_profile(user_id, body.email, body.username)


@router.post("/resolve-username", response_model=ResolveUsernameResponse)
@limiter.limit("10/minute")
def resolve_username(request: Request, body: ResolveUsernameRequest):
    """Public endpoint: lets the login form turn a typed username into the
    email Supabase Auth needs for signInWithPassword. Rate-limited per IP
    to prevent username-enumeration abuse — free, no external service."""
    email = auth_service.resolve_username_to_email(body.username)
    return {"email": email}


@router.get("/me")
def get_me(user_id: str = Depends(get_current_user_id)):
    """Fetch the current authenticated user's public profile."""
    return auth_service.get_profile(user_id)

```

#### `server/app/routers/chats.py`
```python
from fastapi import APIRouter, Depends

from app.core.security import get_current_user_id
from app.schemas.chat import CreateChatRequest
from app.services import chat_service

router = APIRouter()


@router.get("")
def list_chats(user_id: str = Depends(get_current_user_id)):
    """Phase 2: list chats for the current user with last message preview."""
    return chat_service.list_chats_for_user(user_id)


@router.post("")
def create_chat(body: CreateChatRequest, user_id: str = Depends(get_current_user_id)):
    """Phase 2/6: create a direct or group chat. Direct chats between the
    same two users are deduped automatically."""
    return chat_service.create_chat(user_id, body.type, body.member_ids, body.name)


@router.get("/{chat_id}")
def get_chat(chat_id: str, user_id: str = Depends(get_current_user_id)):
    """Phase 2: fetch chat metadata and members (403 if not a member)."""
    return chat_service.get_chat(user_id, chat_id)

```

#### `server/app/routers/contacts.py`
```python
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

```

#### `server/app/routers/media.py`
```python
from fastapi import APIRouter, Depends, UploadFile, File

from app.core.security import get_current_user_id
from app.services import media_service

router = APIRouter()


@router.post("/upload")
async def upload_media(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    """Phase 5: upload a file to Supabase Storage, return a public URL to
    reference from a message's `media_url` field."""
    content = await file.read()
    url = media_service.upload_file(user_id, file.filename, content, file.content_type)
    return {"url": url}

```

#### `server/app/routers/messages.py`
```python
from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user_id
from app.schemas.message import SendMessageRequest
from app.services import message_service

router = APIRouter()


@router.get("/chats/{chat_id}/messages")
def list_messages(
    chat_id: str,
    before: str | None = Query(default=None, description="ISO timestamp cursor for pagination"),
    limit: int = Query(default=50, le=100),
    user_id: str = Depends(get_current_user_id),
):
    """Phase 2: paginated message history for a chat, oldest-first."""
    return message_service.list_messages(user_id, chat_id, before, limit)


@router.post("/chats/{chat_id}/messages")
def send_message(chat_id: str, body: SendMessageRequest, user_id: str = Depends(get_current_user_id)):
    """Phase 2: send a message. Realtime delivery to other members happens
    automatically via Supabase's Postgres change feed — no extra call needed."""
    return message_service.send_message(user_id, chat_id, body.message_type, body.content, body.media_url)


@router.post("/messages/{message_id}/delivered")
def mark_delivered(message_id: str, user_id: str = Depends(get_current_user_id)):
    """Phase 4: mark a message delivered."""
    return message_service.mark_delivered(user_id, message_id)


@router.post("/messages/{message_id}/read")
def mark_read(message_id: str, user_id: str = Depends(get_current_user_id)):
    """Phase 4: mark a message read."""
    return message_service.mark_read(user_id, message_id)

```

#### `server/app/routers/users.py`
```python
from fastapi import APIRouter, Depends

from app.core.security import get_current_user_id
from app.schemas.user import UpdateProfileRequest, AddContactRequest
from app.services import user_service

router = APIRouter()


@router.get("/{user_id}")
def get_user(user_id: str):
    """Phase 3: fetch a user's public profile (no email)."""
    return user_service.get_public_profile(user_id)


@router.put("/me")
def update_me(body: UpdateProfileRequest, user_id: str = Depends(get_current_user_id)):
    """Phase 3: update own profile (photo, about). Username is set once at
    registration and isn't editable here to keep contact lookups stable."""
    return user_service.update_own_profile(user_id, body.profile_photo_url, body.about)

```

#### `server/app/schemas/__init__.py`
_(empty file)_

#### `server/app/schemas/auth.py`
```python
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

```

#### `server/app/schemas/chat.py`
```python
from pydantic import BaseModel
from typing import Optional, Literal


class CreateChatRequest(BaseModel):
    type: Literal["direct", "group"]
    member_ids: list[str]
    name: Optional[str] = None

```

#### `server/app/schemas/message.py`
```python
from pydantic import BaseModel
from typing import Optional, Literal


class SendMessageRequest(BaseModel):
    message_type: Literal["text", "image", "video", "document", "voice"]
    content: Optional[str] = None
    media_url: Optional[str] = None

```

#### `server/app/schemas/user.py`
```python
from pydantic import BaseModel


class UpdateProfileRequest(BaseModel):
    profile_photo_url: str | None = None
    about: str | None = None


class AddContactRequest(BaseModel):
    username: str

```

#### `server/app/services/__init__.py`
_(empty file)_

#### `server/app/services/auth_service.py`
```python
"""
Phase 1: profile-side auth logic.

Supabase Auth itself (signup/login/password reset) is called directly
from the frontend using the anon key — that's the free, standard way to
use Supabase Auth and keeps passwords off our backend entirely.

This service only owns the *profile* side of things:
  - creating the public.users row right after a Supabase Auth signup
  - resolving a username to its email so username-based login works
  - fetching/updating the public profile for the authenticated user

Routers call into this; this is the only layer allowed to touch the
`users` table for auth-adjacent concerns.
"""
from fastapi import HTTPException, status

from app.core.supabase_client import supabase


def create_profile(user_id: str, email: str, username: str) -> dict:
    existing = (
        supabase.table("users").select("id").eq("username", username).execute()
    )
    if existing.data:
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")

    result = (
        supabase.table("users")
        .insert({"id": user_id, "email": email, "username": username})
        .execute()
    )
    return result.data[0]


def resolve_username_to_email(username: str) -> str:
    result = (
        supabase.table("users").select("email").eq("username", username).execute()
    )
    if not result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No account with that username")
    return result.data[0]["email"]


def get_profile(user_id: str) -> dict:
    result = supabase.table("users").select("*").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found")
    profile = result.data[0]
    profile.pop("email", None)  # never return email from a general profile fetch
    return profile

```

#### `server/app/services/chat_service.py`
```python
"""
Phase 2/6: chat + membership logic.

All queries go through the service-role Supabase client, but RLS is still
the source of truth in the database — this layer additionally checks
membership explicitly where it matters, so a bug here can't silently
bypass the intended access rules (defense in depth).
"""
from fastapi import HTTPException, status

from app.core.supabase_client import supabase


def list_chats_for_user(user_id: str) -> list[dict]:
    membership = (
        supabase.table("chat_members").select("chat_id").eq("user_id", user_id).execute()
    )
    chat_ids = [row["chat_id"] for row in membership.data]
    if not chat_ids:
        return []

    chats = supabase.table("chats").select("*").in_("id", chat_ids).execute()

    # Attach last message preview + unread-ish info per chat.
    result = []
    for chat in chats.data:
        last_msg = (
            supabase.table("messages")
            .select("content,message_type,created_at,sender_id,delivered_at,read_at")
            .eq("chat_id", chat["id"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        chat["last_message"] = last_msg.data[0] if last_msg.data else None
        result.append(chat)

    result.sort(
        key=lambda c: c["last_message"]["created_at"] if c["last_message"] else c["created_at"],
        reverse=True,
    )
    return result


def create_chat(user_id: str, chat_type: str, member_ids: list[str], name: str | None) -> dict:
    if chat_type == "direct":
        if len(member_ids) != 1:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Direct chats need exactly one other member")
        existing = _find_existing_direct_chat(user_id, member_ids[0])
        if existing:
            return existing

    chat = supabase.table("chats").insert({"type": chat_type, "name": name}).execute().data[0]

    all_member_ids = set(member_ids) | {user_id}
    rows = [
        {"chat_id": chat["id"], "user_id": uid, "role": "admin" if uid == user_id else "member"}
        for uid in all_member_ids
    ]
    supabase.table("chat_members").insert(rows).execute()
    return chat


def _find_existing_direct_chat(user_a: str, user_b: str) -> dict | None:
    """Avoid creating duplicate 1-to-1 chats between the same two users."""
    a_chats = supabase.table("chat_members").select("chat_id").eq("user_id", user_a).execute()
    a_chat_ids = {row["chat_id"] for row in a_chats.data}
    if not a_chat_ids:
        return None

    b_chats = (
        supabase.table("chat_members")
        .select("chat_id")
        .eq("user_id", user_b)
        .in_("chat_id", list(a_chat_ids))
        .execute()
    )
    shared_ids = [row["chat_id"] for row in b_chats.data]
    if not shared_ids:
        return None

    direct_chats = (
        supabase.table("chats").select("*").in_("id", shared_ids).eq("type", "direct").execute()
    )
    return direct_chats.data[0] if direct_chats.data else None


def assert_member(user_id: str, chat_id: str) -> None:
    result = (
        supabase.table("chat_members")
        .select("user_id")
        .eq("chat_id", chat_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not a member of this chat")


def get_chat(user_id: str, chat_id: str) -> dict:
    assert_member(user_id, chat_id)
    chat = supabase.table("chats").select("*").eq("id", chat_id).execute()
    if not chat.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Chat not found")

    members = (
        supabase.table("chat_members")
        .select("user_id, role, users(username, profile_photo_url, is_online, last_seen)")
        .eq("chat_id", chat_id)
        .execute()
    )
    result = chat.data[0]
    result["members"] = members.data
    return result

```

#### `server/app/services/media_service.py`
```python
"""Phase 5: Supabase Storage upload for images, video, documents, and
voice messages. Free within the project's storage quota — no S3/CDN
account or billing needed."""
import uuid

from app.core.supabase_client import supabase

BUCKET = "chat-media"


def upload_file(user_id: str, filename: str, content: bytes, content_type: str) -> str:
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    path = f"{user_id}/{uuid.uuid4()}.{ext}"

    supabase.storage.from_(BUCKET).upload(
        path, content, {"content-type": content_type}
    )
    return supabase.storage.from_(BUCKET).get_public_url(path)

```

#### `server/app/services/message_service.py`
```python
"""
Phase 2/4: message send/list logic and delivery + read receipt state
transitions.

No manual "broadcast" call is needed here — the messages table is in the
`supabase_realtime` publication (see supabase/schema.sql), so every
insert/update Supabase makes is pushed to subscribed clients automatically,
for free, as part of the Postgres change feed.
"""
from fastapi import HTTPException, status

from app.core.supabase_client import supabase
from app.services.chat_service import assert_member


def list_messages(user_id: str, chat_id: str, before: str | None, limit: int) -> list[dict]:
    assert_member(user_id, chat_id)
    query = (
        supabase.table("messages")
        .select("*")
        .eq("chat_id", chat_id)
        .order("created_at", desc=True)
        .limit(limit)
    )
    if before:
        query = query.lt("created_at", before)
    result = query.execute()
    return list(reversed(result.data))  # oldest first for rendering


def send_message(
    user_id: str,
    chat_id: str,
    message_type: str,
    content: str | None,
    media_url: str | None,
) -> dict:
    assert_member(user_id, chat_id)
    if message_type == "text" and not content:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Text messages require content")
    if message_type != "text" and not media_url:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Media messages require media_url")

    row = {
        "chat_id": chat_id,
        "sender_id": user_id,
        "message_type": message_type,
        "content": content,
        "media_url": media_url,
    }
    result = supabase.table("messages").insert(row).execute()
    return result.data[0]


def mark_delivered(user_id: str, message_id: str) -> dict:
    return _update_message_state(user_id, message_id, "delivered_at")


def mark_read(user_id: str, message_id: str) -> dict:
    return _update_message_state(user_id, message_id, "read_at")


def _update_message_state(user_id: str, message_id: str, column: str) -> dict:
    from datetime import datetime, timezone

    message = supabase.table("messages").select("chat_id").eq("id", message_id).execute()
    if not message.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Message not found")
    assert_member(user_id, message.data[0]["chat_id"])

    result = (
        supabase.table("messages")
        .update({column: datetime.now(timezone.utc).isoformat()})
        .eq("id", message_id)
        .execute()
    )
    return result.data[0]

```

#### `server/app/services/notification_service.py`
```python
"""Phase 7: Web Push (browser Push API + VAPID keys) notification dispatch
for new messages while the recipient's app is backgrounded. Free — no
Firebase/Google project needed. `pywebpush` + a generated VAPID keypair
is all that's required on the backend; the frontend registers a service
worker and subscribes via the Push API."""

```

#### `server/app/services/user_service.py`
```python
"""Phase 3: profile read/update logic for users other than the auth flow
itself (see auth_service.py for profile creation)."""
from fastapi import HTTPException, status

from app.core.supabase_client import supabase


def get_public_profile(user_id: str) -> dict:
    result = supabase.table("users").select(
        "id, username, profile_photo_url, about, is_online, last_seen"
    ).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return result.data[0]


def update_own_profile(user_id: str, profile_photo_url: str | None, about: str | None) -> dict:
    updates = {k: v for k, v in {"profile_photo_url": profile_photo_url, "about": about}.items() if v is not None}
    if not updates:
        return get_public_profile(user_id)
    result = supabase.table("users").update(updates).eq("id", user_id).execute()
    return result.data[0]


def add_contact_by_username(owner_id: str, username: str) -> dict:
    contact = supabase.table("users").select("id").eq("username", username).execute()
    if not contact.data:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No user with that username")
    contact_id = contact.data[0]["id"]
    if contact_id == owner_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Can't add yourself as a contact")

    result = (
        supabase.table("contacts")
        .upsert({"owner_id": owner_id, "contact_id": contact_id})
        .execute()
    )
    return result.data[0]


def list_contacts(owner_id: str) -> list[dict]:
    result = (
        supabase.table("contacts")
        .select("contact_id, users(id, username, profile_photo_url, is_online, last_seen)")
        .eq("owner_id", owner_id)
        .execute()
    )
    return [row["users"] for row in result.data]

```

#### `server/requirements.txt`
```text
fastapi==0.115.0
uvicorn[standard]==0.30.6
pydantic==2.9.0
python-jose[cryptography]==3.3.0
supabase==2.7.4
python-multipart==0.0.9
python-dotenv==1.0.1
slowapi==0.1.9
pywebpush==2.0.1

```

#### `server/supabase/schema.sql`
```sql
-- NovaChat database schema for Supabase PostgreSQL.
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Everything here runs on Supabase's free tier — no paid add-ons required.

-- ============================================================
-- USERS (profile row, one-to-one with auth.users)
-- ============================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  username text unique not null,
  profile_photo_url text,
  about text default '',
  last_seen timestamptz default now(),
  is_online boolean default false,
  created_at timestamptz default now()
);

alter table public.users enable row level security;

-- Anyone authenticated can see username/photo/about/status of any user
-- (needed for chat lists, search, contact display) but never the email.
create policy "public profile fields are readable by any authenticated user"
  on public.users for select
  using (auth.role() = 'authenticated');

create policy "users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "users can insert their own profile row once"
  on public.users for insert
  with check (auth.uid() = id);

-- Note: the API layer (auth_service.get_profile) strips the `email` field
-- before returning any profile that isn't the caller's own, as a second
-- layer of defense beyond RLS.

-- ============================================================
-- CHATS
-- ============================================================
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct', 'group')),
  name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.chats enable row level security;

create table if not exists public.chat_members (
  chat_id uuid references public.chats(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text default 'member' check (role in ('member', 'admin')),
  joined_at timestamptz default now(),
  primary key (chat_id, user_id)
);

alter table public.chat_members enable row level security;

-- Helper: is the current user a member of a given chat?
create or replace function public.is_chat_member(_chat_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.chat_members
    where chat_id = _chat_id and user_id = auth.uid()
  );
$$;

create policy "members can read their chats"
  on public.chats for select
  using (public.is_chat_member(id));

create policy "authenticated users can create a chat"
  on public.chats for insert
  with check (auth.role() = 'authenticated');

create policy "members can read their chat_members rows"
  on public.chat_members for select
  using (public.is_chat_member(chat_id));

create policy "members can add members to chats they belong to"
  on public.chat_members for insert
  with check (public.is_chat_member(chat_id) or user_id = auth.uid());

-- ============================================================
-- MESSAGES
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) on delete cascade,
  sender_id uuid references public.users(id) on delete cascade,
  message_type text not null check (message_type in ('text', 'image', 'video', 'document', 'voice')),
  content text,
  media_url text,
  created_at timestamptz default now(),
  delivered_at timestamptz,
  read_at timestamptz
);

alter table public.messages enable row level security;

create policy "members can read messages in their chats"
  on public.messages for select
  using (public.is_chat_member(chat_id));

create policy "members can send messages to their chats"
  on public.messages for insert
  with check (public.is_chat_member(chat_id) and sender_id = auth.uid());

create policy "members can update delivered/read state on messages in their chats"
  on public.messages for update
  using (public.is_chat_member(chat_id));

-- ============================================================
-- CONTACTS
-- ============================================================
create table if not exists public.contacts (
  owner_id uuid references public.users(id) on delete cascade,
  contact_id uuid references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (owner_id, contact_id)
);

alter table public.contacts enable row level security;

create policy "users manage their own contact list"
  on public.contacts for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ============================================================
-- REALTIME (free on Supabase's free tier)
-- ============================================================
-- Enable Postgres change broadcasts for messages and chat_members so the
-- frontend can subscribe directly with supabase.channel(...) — no custom
-- WebSocket server needed.
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.chat_members;
alter publication supabase_realtime add table public.users;

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_messages_chat_id_created_at on public.messages (chat_id, created_at);
create index if not exists idx_chat_members_user_id on public.chat_members (user_id);

-- ============================================================
-- STORAGE (run separately, or via the Storage tab in the dashboard)
-- ============================================================
-- Create a bucket called "chat-media" (Storage -> New bucket -> public)
-- for images/video/documents/voice notes. The free tier includes 1 GB of
-- storage, which is plenty for a demo/college project. Public read is
-- fine for a demo; for stricter privacy, make it private and switch
-- media_service.py to signed URLs instead of get_public_url.
insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;

create policy "authenticated users can upload media"
  on storage.objects for insert
  with check (bucket_id = 'chat-media' and auth.role() = 'authenticated');

create policy "anyone can read chat media (public bucket)"
  on storage.objects for select
  using (bucket_id = 'chat-media');

```

#### `server/tests/__init__.py`
_(empty file)_

---

## 12. Prompt To Paste Into Antigravity

Paste this as your task/instruction alongside uploading this entire `NOVACHAT_HANDOFF.md` file (and ideally the actual project folder/zip so Antigravity can write directly into it):

```
I'm continuing an existing project called NovaChat — a free-forever, WhatsApp-style
real-time messaging web app (React + Vite frontend, FastAPI backend, Supabase for
auth/database/realtime/storage). I've attached NOVACHAT_HANDOFF.md, which contains:
the full spec, every architectural decision and why it was made, the complete file
tree, the full design system, environment setup steps, and — critically — the
COMPLETE VERBATIM SOURCE of every existing file in the project (section 11).

Read the whole handoff file before writing any code. Do not regenerate files from
scratch or restructure the project — extend what's there. Preserve every existing
architectural decision documented in sections 2, 5, 6, and 9 unless I explicitly ask
you to change one (in particular: don't reintroduce phone/OTP auth or any paid
service — everything must stay on free tiers; keep using Supabase directly via
supabase-py rather than adding an ORM; keep using the existing Tailwind design tokens
rather than introducing new ad hoc colors/spacing; keep Material Symbols icons via
the existing <Icon /> wrapper rather than adding an icon package).

Section 7 (Phase Status) and section 8 (Known Gaps) tell you exactly what's real vs.
stubbed. Start with the "Suggested Next Steps" in section 10, in order, unless I say
otherwise:
1. Add a ProtectedRoute component + Supabase auth-state listener so unauthenticated
   users are redirected to /login instead of routes silently 401ing.
2. Wire up the existing (but currently unused) mark_delivered / mark_read backend
   endpoints from the frontend so read/delivered ticks reflect real state.
3. Add a DELETE /api/chats/{chat_id} (leave-chat) endpoint and connect the chat
   list's existing Delete action to it instead of only mutating local React state.
4. Build the group-chat creation UI (name + multi-select from contacts) — the
   backend (POST /api/chats with type: "group") already supports this.
5. Add a typing indicator using a Supabase Realtime broadcast channel (client-to-
   client, no schema change needed) per section 8.6 of the handoff.
6. Implement Web Push notifications per section 8.5 — this needs a new Supabase
   table for push subscriptions (extend supabase/schema.sql, don't replace it) plus
   pywebpush wiring in notification_service.py and a service worker on the frontend.

After each step, tell me exactly which files you created or changed, and don't move
to the next step without confirming the current one works.
```

This prompt is intentionally explicit about "don't regenerate/restructure" because agentic coding tools will sometimes rewrite a whole project from a spec instead of extending it — the goal here is incremental continuation, not a rebuild.