# Supabase + Railway Deployment Guide

This guide covers everything needed to take the MicroLearning Coach from this repository to a live, production deployment using **Supabase** (PostgreSQL + Auth + Storage) and **Railway** (Node.js hosting).

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project**, choose your organisation, enter a project name (e.g. `microlearning-coach`), and set a strong database password. Save this password — you will need it for the `DATABASE_URL`.
3. Wait ~2 minutes for the project to provision.

---

## 2. Run the Database Schema

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Open the file `supabase/schema.sql` from this repository and paste its entire contents into the editor.
3. Click **Run**. This creates all 35 tables, enums, and the `media` storage bucket.

> **Note:** If you see errors about types already existing, run `DROP TYPE IF EXISTS ... CASCADE;` for each conflicting type, then re-run the schema.

---

## 3. Configure Supabase Auth

1. In the Supabase dashboard, go to **Authentication → Providers**.
2. **Email** is enabled by default. Leave it on — the app uses email/password sign-in.
3. Under **Authentication → URL Configuration**, add your Railway app URL to **Site URL** and **Redirect URLs** once you have it (e.g. `https://your-app.up.railway.app`).
4. Optionally enable **Google**, **GitHub**, or other OAuth providers — the login page supports any provider Supabase exposes.

---

## 4. Create a Supabase Storage Bucket

The schema SQL already runs `INSERT INTO storage.buckets` to create the `media` bucket. Verify it exists:

1. Go to **Storage** in the Supabase dashboard.
2. Confirm the `media` bucket is listed and marked **Public**.
3. If it is missing, click **New bucket**, name it `media`, and toggle **Public bucket** on.

---

## 5. Collect Your Supabase Credentials

Navigate to **Project Settings → API** in the Supabase dashboard and copy the following values:

| Environment Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Project URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | `anon` / `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (keep secret — server-side only) |
| `SUPABASE_JWT_SECRET` | **Project Settings → API → JWT Settings → JWT Secret** |
| `DATABASE_URL` | **Project Settings → Database → Connection string → URI** (use the **Transaction** pooler URI for Railway) |

> **Security:** Never expose `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_JWT_SECRET` to the browser. They are server-side only.

---

## 6. Deploy to Railway

### 6a. Create a Railway Project

1. Go to [https://railway.app](https://railway.app) and sign in.
2. Click **New Project → Deploy from GitHub repo**.
3. Select `Smarthinkerz/microlearning` (or your fork).
4. Railway will auto-detect the Node.js project.

### 6b. Set Environment Variables

In the Railway project dashboard, go to **Variables** and add all of the following:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase Transaction pooler URI (from Step 5) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase `service_role` key |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret |
| `JWT_SECRET` | Any random 64-character string (used for session signing) |
| `NODE_ENV` | `production` |
| `VITE_APP_TITLE` | `MicroLearning Coach` (or your brand name) |
| `VITE_APP_LOGO` | URL to your logo image |
| `BUILT_IN_FORGE_API_KEY` | Your Manus Forge API key (for LLM features) |
| `BUILT_IN_FORGE_API_URL` | Manus Forge API base URL |
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend Forge API key |
| `VITE_FRONTEND_FORGE_API_URL` | Frontend Forge API URL |
| `ELEVENLABS_API_KEY` | ElevenLabs key (for voice narration feature) |
| `RESEND_API_KEY` | Resend key (for transactional email) |

### 6c. Configure the Build Command

Railway should auto-detect `pnpm build` from `package.json`. If not, set:

- **Build command:** `pnpm install && pnpm build`
- **Start command:** `node dist/server/index.js`

### 6d. Add a Custom Domain (optional)

In Railway, go to **Settings → Domains** and either use the auto-generated `*.up.railway.app` domain or add your own custom domain. Copy the final URL and update the Supabase **Site URL** and **Redirect URLs** (Step 3).

---

## 7. First-Time Admin Setup

After deployment, you need to promote at least one user to `super_admin`:

1. Sign up through the `/login` page of your deployed app.
2. In the Supabase dashboard, go to **Table Editor → users**.
3. Find your user row and set `role = 'admin'` and `app_role = 'super_admin'`.
4. Refresh the app — you will now have access to the CRM and admin dashboards.

---

## 8. Environment Variables Quick Reference

The following table summarises every environment variable the application reads, grouped by concern.

| Variable | Required | Side | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | Server | Supabase PostgreSQL connection string |
| `SUPABASE_URL` | Yes | Both | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Frontend | Public anon key for client-side auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server | Service role key for storage uploads |
| `SUPABASE_JWT_SECRET` | Yes | Server | JWT secret for verifying Supabase tokens |
| `JWT_SECRET` | Yes | Server | Session cookie signing secret |
| `NODE_ENV` | Yes | Server | Set to `production` for deployment |
| `VITE_APP_TITLE` | No | Frontend | App display name |
| `VITE_APP_LOGO` | No | Frontend | URL to app logo |
| `BUILT_IN_FORGE_API_KEY` | No | Server | Manus LLM API key |
| `BUILT_IN_FORGE_API_URL` | No | Server | Manus LLM API base URL |
| `VITE_FRONTEND_FORGE_API_KEY` | No | Frontend | Manus LLM API key (frontend) |
| `VITE_FRONTEND_FORGE_API_URL` | No | Frontend | Manus LLM API URL (frontend) |
| `ELEVENLABS_API_KEY` | No | Server | ElevenLabs voice narration |
| `RESEND_API_KEY` | No | Server | Resend transactional email |

> Variables prefixed with `VITE_` are embedded into the frontend bundle at build time and are visible in the browser. Never put secrets in `VITE_` variables.

---

## 9. Local Development

```bash
# 1. Clone the repo
git clone https://github.com/Smarthinkerz/microlearning.git
cd microlearning

# 2. Install dependencies
pnpm install

# 3. Create a .env file with your Supabase credentials
cp .env.example .env   # edit with your values

# 4. Push the schema to your Supabase DB
pnpm db:push

# 5. Start the dev server
pnpm dev
```

The app will be available at `http://localhost:3000`.

---

## 10. Regenerating the Schema

If you modify `drizzle/schema.ts`, regenerate the Supabase SQL file with:

```bash
node_modules/.bin/drizzle-kit generate --config=drizzle.supabase.config.ts
cp supabase/migrations_tmp/0000_*.sql supabase/schema.sql
rm -rf supabase/migrations_tmp
```

Then re-run the new SQL in the Supabase SQL Editor (or use `pnpm db:push` to apply changes directly to a connected Supabase database).
