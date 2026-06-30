# Deploy to GitHub Pages

Run these commands from the project root. **GitHub CLI (`gh`) is installed locally** into `tools/gh/` when you run `npm install` (or `npm run setup:gh`). Use the npm scripts below — no global `gh` install required.

| Command | What it does |
|---------|----------------|
| `npm run gh:auth` | Log in to GitHub |
| `npm run gh:status` | Check login status |
| `npm run github:secrets` | Push secrets from `.env.local` to the repo |
| `npm run github:push` | Push code to GitHub and enable Pages |
| `npm run github:deploy` | Trigger the GitHub Pages deploy workflow |

You still need [Git](https://git-scm.com/) installed to push code.

## Database (Supabase) — required for live data

The dashboard reads members from **Supabase PostgreSQL**. Without it, the app falls back to browser local storage.

### 1. Create a Supabase project

1. Sign in at [supabase.com](https://supabase.com) → **New project**.
2. Pick a name (e.g. `lgf-skool-automation`), region, and database password.
3. Wait until the project is **Active**.

### 2. Apply the schema

**Option A — Supabase CLI (recommended)**

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npm run db:push
```

`YOUR_PROJECT_REF` is the ID in your project URL: `https://YOUR_PROJECT_REF.supabase.co`

**Option B — SQL Editor**

1. Open **SQL → New query** in the Supabase dashboard.
2. Paste the contents of `supabase/schema.sql` and run it.

### 3. Local connection

```powershell
copy .env.example .env.local
```

Edit `.env.local` with values from **Project Settings → API**:

| Variable | Supabase dashboard |
|----------|-------------------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | `anon` `public` key |

Verify:

```powershell
npm run db:verify
```

### 4. GitHub Secrets (for live GitHub Pages build)

**Easy way** — after `.env.local` is filled in and you are logged in (`npm run gh:auth`):

```powershell
npm run github:secrets
```

**Manual way** — in your repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|--------|--------|
| `VITE_SUPABASE_URL` | Same as `.env.local` |
| `VITE_SUPABASE_ANON_KEY` | Same as `.env.local` |
| `SUPABASE_ACCESS_TOKEN` | [Account → Access tokens](https://supabase.com/dashboard/account/tokens) |
| `SUPABASE_PROJECT_REF` | Project ref from URL |
| `SUPABASE_DB_PASSWORD` | Database password you set when creating the project |

The deploy workflows inject `VITE_*` at build time. The **Apply Supabase migrations** workflow uses the token + ref to run `supabase db push` when migrations change.

### 5. Zapier API key (after schema is applied)

In Supabase SQL Editor:

```sql
UPDATE app_settings SET value = 'your-long-random-secret' WHERE key = 'zapier_api_key';
```

Use that same secret in your Zapier HTTP steps.

### 6. Confirm live site uses the database

After deploy, open the admin dashboard → **Members**. The data source badge should show **Supabase**, not **Local storage**.

---

## One-time setup

Target repo: **https://github.com/recillagimson/lgf-skool-automation**

```powershell
# 1. Log in to GitHub (project-local gh)
npm run gh:auth

# 2. Push code, enable Pages, and trigger deploy
npm run github:push
```

If the repo already has commits and you only need to push updates:

```powershell
npm run gh:auth
git remote add origin https://github.com/recillagimson/lgf-skool-automation.git
git push -u origin main
```

## Enable GitHub Pages

Choose **one** of these options:

### Option A — Deploy from `gh-pages` branch (recommended if you use “Deploy from a branch”)

1. Push this repo to GitHub (include the `.github` folder).
2. Go to **Actions** and run **“Build and deploy to gh-pages branch”** (or push to `main` to trigger it).
3. Wait for the workflow to finish with a green checkmark.
4. Go to **Settings → Pages**.
5. Set **Source** to **Deploy from a branch**.
6. Set **Branch** to **`gh-pages`** and folder **`/ (root)`** — **not `main`**.

### Option B — GitHub Actions artifact deploy

1. Go to **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Push to `main` — the **“Deploy to GitHub Pages”** workflow runs automatically.

> **White screen?** You are probably deploying **`main`** (source code). The app must be served from the **built** output on **`gh-pages`** or via the Actions deploy workflow.

Your live URL:

`https://recillagimson.github.io/lgf-skool-automation/`

## Demo login (still works on the deployed site)

- Email: `rhon@letsgetfunded.com`
- Password: `admin123`

> Replace hardcoded auth before sharing publicly with real users.

## Manual deploy trigger

```powershell
npm run github:deploy
```
