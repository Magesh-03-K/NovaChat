# 🚀 NovaChat Deployment Guide

This guide details how to deploy the **NovaChat** backend to **Render** and the frontend to **Vercel**, completely on free tiers.

---

## 📋 Overview

```
┌─────────────────────────────────────────┐
│     Vercel (Frontend)                   │
│  React + Vite SPA                       │
│  https://nova-chat-eta-taupe.vercel.app │
└────────────────────┬────────────────────┘
                     │
                     │ REST API Requests & JWT
                     ▼
┌─────────────────────────────────────────┐
│     Render (Backend)                    │
│  FastAPI (Python 3.12)                  │
│  https://novachat-fpgc.onrender.com     │
└────────────────────┬────────────────────┘
                     │
                     │ DB / Auth / Storage
                     ▼
┌─────────────────────────────────────────┐
│     Supabase (Cloud)                    │
│  PostgreSQL, Auth, Realtime             │
└─────────────────────────────────────────┘
```

---

## 📤 Step 1: Ensure Latest Code is Pushed to GitHub

Before creating services on Render or Vercel, make sure your latest code and configs are pushed to GitHub:

```bash
git add .
git commit -m "Configure deployment files and vercel rewrites"
git push origin main
```

---

## 🐍 Step 2: Deploy Backend to Render

1. Log in to [Render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: **`Magesh-03-K/NovaChat`**.
4. Configure the Web Service settings:
   - **Name**: `novachat-backend` (or your preferred name)
   - **Region**: Select the region closest to you
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Python 3`
   - **Build Command**: 
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**: 
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: `Free`

5. Scroll down to **Environment Variables** and add the following keys:

   | Key | Value / Source |
   | :--- | :--- |
   | `SUPABASE_URL` | Your Supabase project URL (`https://xyz.supabase.co`) |
   | `SUPABASE_ANON_KEY` | Your Supabase anon API key |
   | `SUPABASE_SERVICE_KEY` | Your Supabase service_role API key |
   | `SUPABASE_JWT_SECRET` | Your Supabase JWT secret (Found in Supabase -> Project Settings -> API) |
   | `CLIENT_URL` | Temporarily put `*` or `http://localhost:5173` (update to Vercel URL in Step 4) |
   | `PYTHON_VERSION` | `3.12.0` |

6. Click **Create Web Service**. 
7. Once deployed, Render will provide your live backend URL (e.g. `https://novachat-backend.onrender.com`). Copy this URL!

---

## ⚡ Step 3: Deploy Frontend to Vercel

1. Log in to [Vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository: **`Magesh-03-K/NovaChat`**.
4. Configure the Project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`client`**
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)

5. Expand **Environment Variables** and add the following:

   | Key | Value |
   | :--- | :--- |
   | `VITE_SUPABASE_URL` | Your Supabase project URL (`https://xyz.supabase.co`) |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon API key |
   | `VITE_API_BASE_URL` | `https://novachat-backend.onrender.com/api` *(replace with your Render backend URL + `/api`)* |

6. Click **Deploy**.
7. Vercel will build and deploy your app, providing a live URL (e.g. `https://novachat-client.vercel.app`).

---

## 🔄 Step 4: Finalize CORS Configuration

To allow secure requests between Vercel and Render:

1. Return to your **Render Dashboard** -> `novachat-backend` service.
2. Go to **Environment Variables**.
3. Update `CLIENT_URL` to your live Vercel URL (e.g. `https://novachat-client.vercel.app`).
4. Save changes (Render will automatically redeploy with updated CORS configuration).

---

## ✅ Step 5: Verify Deployment

1. **Test Health Endpoint**:
   Visit `https://novachat-backend.onrender.com/api/health` in your browser. It should return `{"status":"ok"}`.
2. **Test Frontend**:
   Open your Vercel URL (`https://novachat-client.vercel.app`).
3. **Test Full Flow**:
   - Register a new user with an email and username.
   - Log in and test sending messages.
   - Verify real-time status updates and media sharing.

---

## 🛠️ Troubleshooting

- **Render Cold Start Delay**: Render's free tier spins down after 15 minutes of inactivity. The first request after a period of inactivity may take ~30–50 seconds to wake up the server.
- **404 on Page Refresh (Vercel)**: `client/vercel.json` is included in the repo to handle client-side SPA routing (`react-router-dom`).
- **CORS Error in Browser**: Ensure `CLIENT_URL` in Render matches your Vercel URL exactly (without a trailing slash).
