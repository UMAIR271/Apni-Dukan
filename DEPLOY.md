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

## 6. (Optional but recommended) Email notifications on every order

When a customer places an order, the shop owner gets an email with full order details (items, address, total). Setup takes 5 minutes using **Gmail** (free, reliable, 500 emails/day).

### 6.1 Generate a Gmail App Password

1. Sign in to the Gmail account you want to **send from** (it can be your business email or a fresh `apni.dukan.notify@gmail.com`).
2. Enable 2-Step Verification: <https://myaccount.google.com/security> → "2-Step Verification" → ON.
3. Go to <https://myaccount.google.com/apppasswords>.
4. App: pick **Mail**. Device: pick **Other** → name it `Apni Dukan`.
5. Click **Generate** → copy the **16-character password** (no spaces). You won't see it again.

### 6.2 Add Render env vars

Render → `apni-dukan-api` → **Environment** tab → add:

| Key | Value |
|---|---|
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USE_TLS` | `True` |
| `EMAIL_HOST_USER` | `your-sending-account@gmail.com` |
| `EMAIL_HOST_PASSWORD` | the 16-character app password from step 6.1 |
| `DEFAULT_FROM_EMAIL` | `Apni Dukan <your-sending-account@gmail.com>` |
| `ORDER_NOTIFICATION_EMAIL` | the email where you want to **receive** order alerts |

Save. Render redeploys automatically (~1-2 min).

### 6.3 Test it

1. Go to your live frontend, log in as a regular user, add items > Rs. 800, place an order.
2. Within ~10 seconds you should receive an email at `ORDER_NOTIFICATION_EMAIL` with subject:
   `New Order #X - Rs. YYYY (Retail)`

> **Don't have Gmail?** Brevo (Sendinblue) and Resend also work — set `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` to whatever they give you. Anything that supports SMTP works.

> **Local dev:** with `DEBUG=True` (default) emails print to your terminal instead of being sent — handy for testing email contents.

---

## 7. (Optional) Customize business rules

Default rules are read from env vars at startup (sane defaults baked in):

| Key | Default | Meaning |
|---|---|---|
| `RETAIL_MIN_ORDER` | `800` | Minimum order amount for regular customers |
| `RETAIL_FREE_DELIVERY_THRESHOLD` | `5000` | Free home delivery above this amount |
| `RETAIL_DELIVERY_FEE` | `100` | Delivery fee when below threshold |
| `WHOLESALE_MIN_ORDER` | `3000` | Minimum order for wholesale customers |
| `LOW_STOCK_THRESHOLD` | `5` | Show "Only N left!" badges + appear in admin "Low stock" |

Change them on Render → Environment → save → auto-redeploy. Update the matching constants at the top of `frontend/app/cart/page.tsx` so the cart UI shows the same values, then push.

---

## 8. New features setup (WhatsApp / coupons / SEO / dashboard)

### 8.1 WhatsApp floating button

Set on Vercel → Project → Settings → Environment Variables:

| Key | Example value |
|---|---|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `923001234567` (digits only, country code first) |
| `NEXT_PUBLIC_WHATSAPP_MESSAGE` | `Hi! I have a question about my order on Apni Dukan.` |

Leave `NEXT_PUBLIC_WHATSAPP_NUMBER` blank to hide the button.

### 8.2 Promo codes / coupons

Coupons are managed entirely from Django admin → **Coupons**.
- Choose `PERCENT` (e.g. `10` = 10% off, optionally cap with `max_discount_amount`) or `FLAT` (e.g. `200` = Rs. 200 off).
- Optional: set `min_order_amount`, `valid_from`, `valid_until`, `max_uses_total`, `max_uses_per_user`.
- Customers enter the code on the cart page.

### 8.3 SEO (sitemap.xml / robots.txt / per-product meta)

Add this Render env var so the sitemap points to your storefront, not the API:

| Key | Example |
|---|---|
| `SITE_URL` | `https://apni-dukan.vercel.app` |
| `SITE_NAME` | `Apni Dukan` |

Then submit `https://<your-render-service>.onrender.com/sitemap.xml` to Google Search Console.

### 8.4 Admin dashboard (frontend)

Visit `/admin/dashboard` while logged in as a staff/superuser to see revenue, orders by status, top products, and low-stock alerts.

### 8.5 Newsletter, reviews, reorder, status tracker

These all work out of the box. Manage subscribers and review moderation from Django admin.

### 8.6 Rate limiting & caching

Enabled by default in production:
- Login: 10/min per IP, 5/min per username.
- Signup: 5/min and 30/hour per IP.
- Newsletter subscribe: 5/hour per IP.
- Categories listing cached for 5 minutes; product detail for 2 minutes.

Set `REDIS_URL` to use a shared cache across Render workers (otherwise an in-process cache is used, which is fine for a single web instance). To temporarily disable rate limiting: `RATELIMIT_ENABLE=False`.

---

## 9. Verify

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
