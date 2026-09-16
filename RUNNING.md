# Running NovaChat

This guide covers how to set up and run both the **Frontend** and **Backend** servers for NovaChat.

---

## 📋 Prerequisites

- **Node.js**: v18+ installed
- **Python**: Python 3.12 (or Python 3.10+) installed (`python3` or `python3.12`)

---

## 🚀 Quick Start Guide

Open **two separate terminal windows/tabs** from the root folder (`novachat-1`).

### 1️⃣ Terminal 1 — Backend (FastAPI)

```bash
# Navigate to server directory
cd server

# Create Python virtual environment (use python3 or python3.12)
python3.12 -m venv .venv

# Activate the virtual environment
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Start the backend server with auto-reload
uvicorn app.main:app --reload


# To kill server and run 
lsof -ti:8000 | xargs kill -9 2>/dev/null; source .venv/bin/activate && uvicorn app.main:app --reload
```

- **Backend API Base URL:** `http://127.0.0.1:8000`
- **Health Check Endpoint:** `http://127.0.0.1:8000/api/health`
- **Interactive Swagger API Docs:** `http://127.0.0.1:8000/docs`

---

### 2️⃣ Terminal 2 — Frontend (React + Vite)

```bash
# Navigate to client directory
cd client

# Install frontend dependencies
npm install

# Start the Vite development server
npm run dev
```

- **Frontend App URL:** `http://localhost:5173/`

---

## ⚙️ Environment Variables Setup

Configuration environment files exist in both `client/` and `server/`:

### Client Environment (`client/.env`)
```env
VITE_SUPABASE_URL=https://xyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMH0.dummy
VITE_API_BASE_URL=http://localhost:8000/api
```

### Server Environment (`server/.env`)
```env
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMH0.dummy
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjAwMDAwMDAwfQ.dummy
SUPABASE_JWT_SECRET=dummy_secret
CLIENT_URL=http://localhost:5173
```

---

## 🛠️ Common Troubleshooting

| Issue | Cause & Solution |
| :--- | :--- |
| **`zsh: command not found: python`** | Run `python3` or `python3.12` instead of `python` on macOS. |
| **`[Errno 48] Address already in use`** | A server process is already running on port `8000` or `5173`. Stop the existing process or restart your terminal. |
| **White/Blank screen on Frontend** | Ensure `client/.env` is initialized and `npm run dev` is active. |
