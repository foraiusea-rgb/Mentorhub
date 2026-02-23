# MentorHub 🎯

AI-powered mentor-mentee platform with smart scheduling, payments, analytics, and shareable no-install booking links.

**68 files • 5,740 lines • 14 pages • 12 API routes • PWA installable**

---

## 🚀 STEP-BY-STEP DEPLOYMENT GUIDE

### Prerequisites
- GitHub account (github.com)
- Vercel account (vercel.com)
- Supabase account (supabase.com)
- Stripe account (stripe.com) — for payments
- OpenRouter account (openrouter.ai) — for AI features

---

### STEP 1: Download this project

Download the `mentorhub` folder from Claude. It contains all 68 files.

---

### STEP 2: Create GitHub Repository

**Option A: Using GitHub website (easiest)**

1. Go to **github.com** → click **"+"** (top right) → **"New repository"**
2. Name it: `mentorhub`
3. Leave it **Public** or **Private** (your choice)
4. **DO NOT** check "Add README", ".gitignore", or license (we already have them)
5. Click **"Create repository"**
6. You'll see a page with setup instructions — keep this tab open

**Option B: Upload files via GitHub website (no Git needed)**

1. After creating the empty repo, click **"uploading an existing file"** link
2. Drag and drop ALL files/folders from the `mentorhub` folder
3. ⚠️ **Important:** GitHub's web upload can miss hidden files (`.env.example`, `.gitignore`, `.eslintrc.json`). 
   - If they're missing, click "Add file" → "Create new file" and add them manually

**Option C: Using Git command line (recommended)**

```bash
# 1. Open terminal, navigate to the mentorhub folder you downloaded
cd ~/Downloads/mentorhub    # or wherever you saved it

# 2. Initialize Git (if not already done)
git init
git branch -M main

# 3. Add all files
git add -A

# 4. Commit
git commit -m "Initial commit: MentorHub v1.0"

# 5. Connect to your GitHub repo (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/mentorhub.git

# 6. Push
git push -u origin main
```

If you don't have Git installed:
- **Mac**: Open Terminal, type `git` — it will prompt you to install Xcode command line tools
- **Windows**: Download from https://git-scm.com/download/win
- **Linux**: `sudo apt install git`

---

### STEP 3: Set up Supabase (Database)

1. Go to **supabase.com** → **"New Project"**
2. Choose an org, name it `mentorhub`, set a database password, pick a region close to you
3. Wait for it to spin up (~2 minutes)
4. Go to **SQL Editor** (left sidebar)
5. Click **"New Query"**
6. Open the file `supabase/schema.sql` from your project
7. **Copy the ENTIRE contents** and paste into the SQL editor
8. Click **"Run"** (or Ctrl/Cmd+Enter)
9. You should see "Success. No rows returned" — that's correct!

**Get your keys:**

10. Go to **Settings** → **API** (left sidebar)
11. Copy these values (you'll need them in Step 6):
    - **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
    - **anon public key** → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - **service_role secret key** → this is `SUPABASE_SERVICE_ROLE_KEY` (click to reveal)

**Set up OAuth (optional but recommended):**

12. Go to **Authentication** → **Providers**
13. Enable **Google**: Follow their instructions to get OAuth client ID from Google Cloud Console
14. Enable **GitHub**: Go to GitHub → Settings → Developer Settings → OAuth Apps → New → set callback URL to `https://YOUR_SUPABASE_URL/auth/v1/callback`

---

### STEP 4: Set up Stripe (Payments)

1. Go to **stripe.com** → create an account or log in
2. Make sure you're in **Test Mode** (toggle in top right)
3. Go to **Developers** → **API Keys**
4. Copy:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

**Set up Webhook (do this AFTER deploying to Vercel in Step 6):**

5. Go to **Developers** → **Webhooks** → **Add endpoint**
6. URL: `https://your-app-name.vercel.app/api/payments/webhook`
7. Select events: `checkout.session.completed`, `charge.refunded`
8. Click **Add endpoint**
9. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

### STEP 5: Set up OpenRouter (AI)

1. Go to **openrouter.ai** → create account
2. Go to **Keys** → **Create Key**
3. Copy the key → `OPENROUTER_API_KEY`

---

### STEP 6: Deploy to Vercel

1. Go to **vercel.com** → click **"Add New Project"**
2. Click **"Import Git Repository"**
3. Find your `mentorhub` repo and click **"Import"**
4. **Framework Preset** should auto-detect **Next.js** ✓
5. Expand **"Environment Variables"** and add ALL of these:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `STRIPE_SECRET_KEY` | `sk_test_...` from Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` from Stripe |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (add after creating webhook) |
| `OPENROUTER_API_KEY` | Your OpenRouter key |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `ADMIN_EMAILS` | Your email (for admin panel access) |

6. Click **"Deploy"**
7. Wait 1-2 minutes for the build
8. Your app is now live! 🎉

**After deploying:** Go back to Stripe (Step 4, point 5) and add the webhook URL using your actual Vercel URL.

---

### STEP 7: Update Supabase Auth Redirect URLs

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://your-app.vercel.app`
3. Add **Redirect URLs**: 
   - `https://your-app.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Vercel (Frontend)                    │
│  Next.js 14 App Router • React 18 • Tailwind • PWA     │
├─────────────────────────────────────────────────────────┤
│                    API Routes (12)                       │
│  meetings • bookings • reviews • profile • notifications│
│  payments/checkout • payments/webhook • share • admin   │
│  ai/recommendations • ai/availability • auth/callback   │
├─────────┬────────────┬──────────────┬───────────────────┤
│ Supabase│   Stripe   │  OpenRouter  │    Supabase       │
│   Auth  │  Payments  │    AI API    │   PostgreSQL      │
│  + OAuth│  Checkout  │ Claude/GPT-4 │   9 tables + RLS  │
└─────────┴────────────┴──────────────┴───────────────────┘
```

## Pages (14)

| Page | Route | Auth? | Description |
|------|-------|-------|-------------|
| Landing | `/` | No | Hero, features, testimonials, CTA |
| Auth | `/auth` | No | Login/signup with OAuth |
| Dashboard | `/dashboard` | Yes | Stats, meetings, bookings, profile editor |
| Explore | `/explore` | No | Browse mentors + meetings with filters |
| Create Meeting | `/meetings/create` | Yes | Meeting builder with agenda + slots |
| Meeting Detail | `/meetings/[id]` | No | View + book meetings |
| Profile | `/profile/[id]` | No | Public mentor profile + credentials |
| Schedule | `/schedule/[shareId]` | **No** | Shareable link (no install needed!) |
| Calendar | `/calendar` | Yes | Weekly calendar + availability mgmt |
| Payments | `/payments` | Yes | Payment history |
| AI Match | `/ai/recommendations` | Yes | AI mentor matching |
| Admin | `/admin` | Yes* | User management, stats, moderation |
| Analytics | `/admin/analytics` | Yes* | Charts, KPIs, growth metrics |
| Offline | `/offline` | No | PWA offline fallback |

*Admin pages require email in ADMIN_EMAILS env var

## Security Checklist

- ✅ Row Level Security on all 9 tables
- ✅ Auth middleware on protected routes
- ✅ Stripe webhook signature verification
- ✅ API rate limiting (per-IP)
- ✅ Zod input validation on all mutations
- ✅ XSS sanitization
- ✅ Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type)
- ✅ Server-side only API keys
- ✅ Atomic database operations (slot booking)
- ✅ Double-booking + self-booking prevention
- ✅ Admin access control via ADMIN_EMAILS
- ✅ CSRF via SameSite cookies

## Local Development

```bash
cp .env.example .env.local    # Fill in your keys
npm install
npm run dev                    # http://localhost:3000
```

## License
MIT
