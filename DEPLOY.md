# Deploying Apni Dukan (Free Tier)

This guide walks you through deploying:

| Layer | Service | Cost |
|---|---|---|
| Frontend (Next.js) | **Vercel** | Free |
| Backend (Django) | **Render** | Free (sleeps after 15 min idle) |
| Database (Postgres) | **Neon** | Free forever |
| Media uploads | **Cloudinary** | Free 25 GB |

Total cost: **$0/month**. End-to-end setup takes ~30 minutes.

---

## 0. Prerequisites

- A GitHub account
- The project pushed to a GitHub repo (instructions below if you haven't yet)

### Push to GitHub (first-time only)

From the project root:

```bash
git init
git add .
git commit -m "Initial commit"
# Create a new empty repo on github.com first, then:
git remote add origin https://github.com/<your-username>/apni-dukan.git
git branch -M main
git push -u origin main
```

---

## 1. Set up Postgres on Neon (free)

1. Go to <https://neon.tech> → Sign up (GitHub login works).
2. Click **Create Project** → name it `apni-dukan` → region close to you.
3. After creation, copy the **connection string** (looks like `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).
4. Save it — you'll paste it into Render as `DATABASE_URL`.

> Alternative: <https://supabase.com> also offers free Postgres. Either works.

---

## 2. Set up Cloudinary for image uploads (free)

1. Go to <https://cloudinary.com> → Sign up (free, no credit card).
2. On the dashboard, find your **API Environment variable** — it looks like:
   ```
   CLOUDINARY_URL=cloudinary://123456789012345:AbCdEfGhIjKlMnOpQrSt@your-cloud-name
   ```
3. Copy the **value** (everything after `CLOUDINARY_URL=`). Save it — you'll paste it into Render.

That's it. As soon as `CLOUDINARY_URL` is set in production, every uploaded product/category image goes to Cloudinary instead of the (ephemeral) server disk.

---

## 3. Deploy backend to Render

1. Go to <https://render.com> → Sign up with GitHub.
2. Click **New +** → **Blueprint**.
3. Select your `apni-dukan` repo. Render auto-detects `render.yaml`.
4. Click **Apply**.
5. The first build will fail because env vars aren't set yet — that's expected.
6. Open the new service → **Environment** tab and set:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Your Neon connection string from step 1 |
   | `CLOUDINARY_URL` | Your Cloudinary URL from step 2 |
   | `CORS_ALLOWED_ORIGINS` | (leave empty for now — fill after step 4) |
   | `CSRF_TRUSTED_ORIGINS` | `https://*.onrender.com` (we'll add Vercel later) |

   `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `PYTHON_VERSION` are auto-set by `render.yaml`.

7. Click **Manual Deploy → Deploy latest commit**. Wait ~3–5 min.
8. Once green, visit `https://<your-service>.onrender.com/admin/` — you should see the Django admin login.
9. Create your superuser via Render's **Shell** tab:
   ```bash
   python manage.py createsuperuser
   ```

✅ Backend is live. Note the URL — you'll need it for Vercel.

---

## 4. Deploy frontend to Vercel

1. Go to <https://vercel.com> → Sign up with GitHub.
2. Click **Add New → Project** → import your `apni-dukan` repo.
3. **Important — set the Root Directory** to `frontend`:
   - Click "Edit" next to Root Directory → select `frontend`.
4. Vercel auto-detects Next.js. Leave Build/Output settings as-is.
5. Under **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<your-render-service>.onrender.com/api` |

6. Click **Deploy**. Wait ~2 min.
7. Once live, copy your Vercel URL (e.g. `https://apni-dukan.vercel.app`).

---

## 5. Connect frontend & backend (CORS)

Back on Render → your service → **Environment** tab:

| Key | Value |
|---|---|
| `CORS_ALLOWED_ORIGINS` | `https://<your-app>.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | `https://<your-app>.vercel.app,https://*.onrender.com` |

Save → Render redeploys automatically.

---

## 6. Verify

1. Open your Vercel URL.
2. Sign up / log in — should hit the Render API successfully.
3. In Django admin, upload a product image — confirm it appears with a Cloudinary URL (`res.cloudinary.com/...`).
4. Refresh the Vercel app — the image should render.

---

## Troubleshooting

**Render free instance is slow on first request.**
That's the cold start (~30 s). Free plan sleeps after 15 min idle. Options:
- Upgrade Render to Starter ($7/mo) — no sleep.
- Switch backend to **Fly.io** (free, doesn't sleep).
- Use a free uptime pinger like UptimeRobot to keep it warm (note: this technically violates Render's free tier ToS).

**Migrations didn't run.**
The `release` step in `Procfile` and the `build.sh` both run `python manage.py migrate`. You can also run it manually from Render's **Shell** tab.

**Static files / admin look broken.**
Make sure `collectstatic` ran (it's in `build.sh`). WhiteNoise serves them automatically.

**CORS errors in browser console.**
Double-check `CORS_ALLOWED_ORIGINS` includes the *exact* Vercel URL (no trailing slash) and redeploy Render after changing.

**Images uploaded before Cloudinary was set are gone.**
That's the ephemeral disk problem this guide is built to avoid. Re-upload after Cloudinary is configured and they'll persist forever.

---

## Local development (still works exactly the same)

Nothing about your local workflow changes:

```bash
# Backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

Without `DATABASE_URL` and `CLOUDINARY_URL` set, the project falls back to local SQLite + local `media/` directory.
