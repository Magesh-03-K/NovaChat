# 🐙 How to Upload NovaChat to GitHub

This step-by-step guide will walk you through initializing Git, securing sensitive environment variables, creating a repository on GitHub, and pushing your project online.

---

## ⚠️ STEP 0: Crucial Security Check (Prevent Leaking Secrets)

Before uploading any code to GitHub, **you must ensure sensitive environment files (`.env`) are ignored**. 

Your `.env` files contain Supabase API keys, database credentials, and JWT secrets. They should **NEVER** be committed to a public or private GitHub repository.

### Check `.gitignore` at the root:
Make sure your root `.gitignore` file includes the following entries:

```gitignore
# Node / Frontend
node_modules/
dist/

# Python / Backend
__pycache__/
*.pyc
.venv/

# Secrets & Environment Variables (CRITICAL)
.env
.env.local
client/.env
server/.env

# OS Files
.DS_Store
```

---

## 🚀 STEP 1: Initialize Local Git Repository

Open your terminal at the root of the project (`novachat-1` folder) and run:

```bash
# 1. Initialize git
git init

# 2. Set the default branch name to 'main'
git branch -M main
```

---

## 📝 STEP 2: Stage and Commit Your Code

```bash
# 1. Add all project files to staging
git add .

# 2. Check status to confirm .env and node_modules are NOT staged
git status
```

> 📌 **Verification**: You should **NOT** see `.env` or `node_modules` or `.venv` listed under "Changes to be committed".

```bash
# 3. Create your initial commit
git commit -m "Initial commit: NovaChat real-time messaging app"
```

---

## 🌐 STEP 3: Create a Repository on GitHub

### Option A: Using GitHub Website (Recommended for beginners)
1. Go to [GitHub.com](https://github.com) and log in.
2. Click the **`+`** icon in the top right corner and select **New repository**.
3. Repository details:
   - **Repository name**: `novachat` (or any name you prefer)
   - **Description**: Real-time WhatsApp/Telegram style messaging app built with React, FastAPI, and Supabase.
   - **Public / Private**: Select based on your preference.
   - **DO NOT** check "Add a README file", "Add .gitignore", or choose a license (you already have these locally).
4. Click **Create repository**.

### Option B: Using GitHub CLI (`gh`)
If you have the GitHub CLI installed, you can create and link the repository directly from terminal:
```bash
gh repo create novachat --public --source=. --remote=origin --push
```

---

## 🔗 STEP 4: Link Local Repository to GitHub and Push

After creating the repository on GitHub website (Option A), copy the repository URL and run the following in your terminal:

### Using HTTPS:
```bash
# Link local repo to GitHub
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/novachat.git

# Push code to main branch
git push -u origin main
```

### Using SSH (If SSH keys are configured):
```bash
# Link local repo to GitHub
git remote add origin git@github.com:YOUR_GITHUB_USERNAME/novachat.git

# Push code to main branch
git push -u origin main
```

*(Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username).*

---

## 🔄 How to Push Future Changes

Whenever you make updates to your project in the future, push them to GitHub with these commands:

```bash
# 1. Stage updated files
git add .

# 2. Commit with a descriptive message
git commit -m "Add new feature or fix issue"

# 3. Push to GitHub
git push
```

---

## 🛠️ Troubleshooting Common Issues

| Problem | Cause & Fix |
| :--- | :--- |
| **`fatal: remote origin already exists`** | A remote is already set. Run `git remote remove origin` then add your new URL. |
| **`error: src refspec main does not match any`** | You haven't made a commit yet. Run `git commit -m "Initial commit"` first. |
| **`Support for password authentication was removed`** | GitHub requires a **Personal Access Token (PAT)** or **SSH key** instead of account password for HTTPS authentication. Go to GitHub Settings -> Developer Settings -> Personal Access Tokens to generate one. |
| **`error: 'server/' does not have a commit checked out`** | A nested `.git` directory exists inside `server/`. Remove it with `rm -rf server/.git` then run `git add .` again. |
| **Accidentally committed `.env` file** | Untrack it immediately by running:<br>`git rm --cached client/.env server/.env .env`<br>`git commit -m "Remove sensitive env files"`<br>`git push` |
