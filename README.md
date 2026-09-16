# 💬 NovaChat

A full-stack, real-time messaging application inspired by WhatsApp and Telegram. Designed for 1-to-1 and group communication, rich media sharing, delivery/read receipts, online status tracking, and push notifications — engineered to run **completely free (₹0/$0)** using modern cloud serverless primitives.

---

## 🚀 How the App Works

NovaChat connects users through a real-time reactive architecture combining a **FastAPI** backend, a **React + Vite** single-page application, and **Supabase** cloud infrastructure.

```
┌─────────────────┐       REST API / JWT       ┌─────────────────┐
│                 ├───────────────────────────►│                 │
│  React Client   │                            │ FastAPI Server  │
│  (Vite + state) │◄───────────────────────────┤ (Python 3.12)   │
│                 │       Web Push / WS        └────────┬────────┘
└────────┬────────┘                                     │
         │                                              │ DB Operations / Auth
         │ Supabase Realtime / Storage                  ▼
         └─────────────────────────────────────►┌─────────────────┐
                                                │    Supabase     │
                                                │ (PostgreSQL,    │
                                                │ Auth, Realtime) │
                                                └─────────────────┘
```

1. **Authentication Flow**:
   - Users register with an **email**, a unique **username**, and a **password**.
   - Login supports both **email or username**. If a username is provided, the backend resolves the username to the registered email before authenticating against Supabase Auth.
   - Authenticated sessions receive a Supabase JWT token, which is passed in HTTP headers and verified on FastAPI API endpoints.

2. **Real-Time Messaging**:
   - When a user sends a message, the client posts to the FastAPI REST API, which persists the message in the `messages` table in PostgreSQL.
   - Real-time message delivery to online clients is handled via **Supabase Realtime Postgres Change Feeds** (or WebSockets fallback).
   - Delivery and read receipts automatically update `delivered_at` and `read_at` timestamps, triggering status tick updates (**✓** Sent, **✓✓** Delivered, Read).

3. **Presence & Receipts**:
   - Online status (`is_online`) and `last_seen` timestamps are tracked via heartbeat signals and real-time socket connection state.

4. **Media Sharing & Storage**:
   - Images, videos, documents, and voice recordings are uploaded to secure Supabase Storage buckets, returning CDN-hosted media URLs attached to messages.

5. **Push Notifications**:
   - Uses browser-native **Web Push API** with VAPID keys for zero-cost background notifications when the app is inactive.

---

## 🛠️ Tech Stack & Frameworks

| Layer | Framework / Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) | High-performance SPA frontend |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) | Lightweight, central client state management |
| **Styling** | [Tailwind CSS v3](https://tailwindcss.com/) | Modern utility-first responsive styling |
| **HTTP Client** | [Axios](https://axios-http.com/) | REST API requests & JWT interceptors |
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) (Python) | High-performance async REST API framework |
| **ASGI Server** | [Uvicorn](https://www.uvicorn.org/) | Async server implementation for FastAPI |
| **Validation** | [Pydantic v2](https://docs.pydantic.dev/) | Data validation & schema serialization |
| **Database** | [Supabase PostgreSQL](https://supabase.com/) | Relational database with Row Level Security (RLS) |
| **Authentication** | [Supabase Auth](https://supabase.com/auth) | Email/username + password identity management |
| **Realtime Engine** | [Supabase Realtime](https://supabase.com/docs/guides/realtime) | Real-time WebSocket Postgres change broadcast |
| **File Storage** | [Supabase Storage](https://supabase.com/storage) | Media bucket storage for attachments |
| **Push Engine** | [PyWebPush](https://github.com/web-push-libs/pywebpush) | VAPID key-based browser Web Push notifications |

---

## 📊 Data Model Overview

The database schema enforces data privacy with Row Level Security (RLS) policies:

- **`users`**: User profiles (`id`, `email`, `username`, `profile_photo_url`, `about`, `is_online`, `last_seen`).
- **`chats`**: Direct and group conversation channels (`id`, `type`, `name`, `avatar_url`).
- **`chat_members`**: Chat participant mappings (`chat_id`, `user_id`, `role`).
- **`messages`**: Message items (`id`, `chat_id`, `sender_id`, `message_type`, `content`, `media_url`, `delivered_at`, `read_at`).
- **`contacts`**: User contact lists (`owner_id`, `contact_id`).

---

## 🔑 Key Features

- 🔒 **Secure Auth & Dual Login**: Email or Username login alias.
- ⚡ **Instant Messaging**: Real-time delivery with zero delay.
- ✔️ **Message Status Ticks**: Single tick (Sent), double tick (Delivered),(Read).
- 📷 **Rich Attachment Sharing**: Images, videos, documents, and voice clips.
- 👥 **Group Conversations**: Create multi-user groups with admin controls.
- 🟢 **Live Online Presence**: Real-time status indicators and last seen timestamps.
- 🔔 **Background Notifications**: Web Push browser alerts for new messages.
- 💰 **Permanent Free Tier**: Built entirely on free-tier serverless cloud infrastructure.

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v18 or higher
- **Python**: 3.10+ (Python 3.12 recommended)

### 2. Backend Setup (FastAPI)
```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup (React + Vite)
```bash
cd client
npm install
npm run dev
```
- App URL: `http://localhost:5173`

---

## ⚙️ Environment Variables

Create `.env` files in both directories based on their `.env.example` templates:

**Client (`client/.env`):**
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:8000/api
```

**Server (`server/.env`):**
```env
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
CLIENT_URL=http://localhost:5173
```

---

## 📖 Further Documentation

- **[RUNNING.md](RUNNING.md)**: Detailed step-by-step running guide, port management, and troubleshooting.
- **[DEPLOY.md](DEPLOY.md)**: Step-by-step instructions for deploying the FastAPI backend to Render and React frontend to Vercel.
- **[GITHUB_UPLOAD.md](GITHUB_UPLOAD.md)**: Step-by-step guide to initializing Git, securing `.env` secrets, creating a GitHub repository, and pushing code online.
- **[SPEC.md](SPEC.md)**: Full architecture specification, technical implementation plan, database security rules, and API endpoints.
