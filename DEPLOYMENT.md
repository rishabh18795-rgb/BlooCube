# Deploying BlooCube to production

This repo is ready to deploy. Nothing below requires further code changes —
only your authentication, run once each.

## What's blocking an automatic deploy

This machine has no Vercel login and no Google Cloud SDK/credentials at all
(checked: `vercel whoami` → logged out; `gcloud` → not installed; no
`GOOGLE_APPLICATION_CREDENTIALS`, no stored tokens for either; no Docker/
Podman either, so the backend image couldn't be built locally regardless).

Vercel's login-free `--temporary` deploy mode was tried, to get something
live without needing your credentials. It hit two independent platform-level
gates, in order:

1. Anonymous deployments don't support Edge-runtime middleware. Fixed —
   `src/middleware.ts` now declares `runtime: 'nodejs'` (this app's
   middleware only reads cookies and redirects; nothing in it needs the Edge
   runtime specifically). Verified against a real production build
   (`next build` + the standalone server, not just `next dev`): unauthenticated
   → redirects to `/login`, authenticated creator → passes through, creator
   hitting `/brand` → redirected back to `/creator`. All still correct.
2. After that fix, Vercel's anonymous pipeline then rejected the deploy for
   a different reason: "Vulnerable version of Next.js detected" — a security
   policy on login-free deploys specifically, tied to this project's Next.js
   15.5.3. The fix would be upgrading Next.js, which is not something to do
   unilaterally to route around a demo-deploy restriction — it touches every
   page in the app and carries real regression risk for no benefit to the
   actual production path, where an authenticated deploy isn't subject to
   this restriction at all.

Net effect: the login-free path is a dead end for this app; an authenticated
`vercel login` is genuinely required, not a workaround I'm missing.

## 1. Deploy the frontend (Vercel) — recommended first

```bash
npm install -g vercel   # or just use `npx vercel` each time
vercel login            # opens a browser — log in with your own account
cd /path/to/this/repo   # the repo root (Next.js app)
vercel --prod
```

Vercel auto-detects Next.js; no `vercel.json` is needed. When prompted, link
it to a new project (any name). After it finishes you'll have a real
`https://<something>.vercel.app` URL — that's your **LIVE WEBSITE**.

It will work for the public pages (homepage, Find Creators, Campaigns,
Pricing, etc.) immediately. Login/signup and anything else that calls the
API won't work yet because `NEXT_PUBLIC_API_URL` isn't pointed at a real
backend — that's step 2.

## 2. Deploy the backend (Cloud Run)

```bash
# One-time setup
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
gcloud artifacts repositories create Bloocube --repository-format=docker --location=asia-southeast1

# Deploy
cd backend
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_FRONTEND_ORIGIN=https://<your-vercel-url-from-step-1>.vercel.app \
  .
```

This builds `backend/Dockerfile`, pushes it, and deploys to Cloud Run. Note
what it prints as the **BACKEND API** URL (`https://bloocube-backend-xxxx.run.app`).

**Before this works for real sign-ins**, set two more env vars on the
service — ideally via Secret Manager, not plain `--set-env-vars` (those are
visible in Cloud Run's console/logs):

```bash
gcloud run services update Bloocube-backend --region=asia-southeast1 \
  --set-env-vars=JWT_ACCESS_SECRET=$(openssl rand -hex 32),JWT_REFRESH_SECRET=$(openssl rand -hex 32)
```

(Generate your own random values — don't reuse the dev defaults in
`backend/.env.example`.)

**Database**: the image ships with SQLite living inside the container
(`--max-instances=1` in `cloudbuild.yaml` is deliberate — SQLite can't be
shared across instances, and the file is lost on every redeploy/restart).
That's enough to put a real, working backend online today. Before relying on
this for actual user data, provision a managed Postgres instance (e.g. Cloud
SQL), set `DATABASE_URL` to it, and change `provider = "sqlite"` to
`provider = "postgresql"` in `backend/prisma/schema.prisma` (then
`npx prisma migrate dev` once locally against that database to generate
Postgres-dialect migrations, commit those, and deploy).

## 3. Connect the two

```bash
# Point the frontend at the real backend and redeploy
vercel env add NEXT_PUBLIC_API_URL production
# paste: https://<your-cloud-run-url-from-step-2>
vercel --prod
```

The backend's `FRONTEND_ORIGIN` was already set from your Vercel URL in step
2's `_FRONTEND_ORIGIN` substitution — if you deploy the frontend again and
get a *different* Vercel URL (e.g. first deploy before a project rename),
update it:

```bash
gcloud run services update Bloocube-backend --region=asia-southeast1 \
  --set-env-vars=FRONTEND_ORIGIN=https://<final-vercel-url>
```

## 4. Seed demo data (optional, so there's something to look at)

```bash
# From your machine, pointed at the deployed database — only works if
# DATABASE_URL in your local shell matches the deployed one (i.e. you've
# already switched to Postgres and can reach it, or you exec into the
# Cloud Run container). With the default SQLite setup described above,
# seed by adding one line to the Dockerfile's CMD instead:
#   CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && node dist/index.js"]
# (only do this for a demo deployment — it will reset data on every restart).
```

## Already done for you in this repo

- `backend/Dockerfile` + `backend/cloudbuild.yaml` — didn't exist before;
  the only Docker config previously in this repo was for the frontend.
- Fixed a real bug in the pre-existing root `cloudbuild.yaml`: it referenced
  a `Bloocube-frontend/` subfolder that doesn't exist in this repo's actual
  layout (the Next.js app is the repo root) — it would have failed outright
  if triggered as-is.
- Fixed cross-domain cookies: `backend/src/utils/cookies.ts` was hardcoded
  to `SameSite=Lax`, which browsers never attach on cross-site `fetch()`
  calls — only same-site or top-level-navigation requests. Once frontend
  (vercel.app) and backend (run.app) are on different domains, every
  authenticated API call would have silently dropped its cookies and login
  would appear to "not work" with no obvious error. Now `SameSite=None;
  Secure` in production, unchanged (`Lax`, not `Secure`) in local dev.
- GitHub Pages disabled on this repo (it was serving `README.md` at
  `https://rishabh18795-rgb.github.io/BlooCube/` — wrong host entirely for
  a Next.js+Express+Prisma app; that URL now 404s instead of misleading
  anyone).
- `src/middleware.ts` switched to the Node.js runtime (see above) — this is
  a real, permanent improvement, not just a deploy-attempt workaround left
  behind; it doesn't change what the middleware does, only which runtime
  executes it.

## What you'll have at the end

- **LIVE WEBSITE**: your Vercel URL — the actual BlooCube app, not a README.
- **BACKEND API**: your Cloud Run URL.
- Real login works once steps 1–3 are done, using the seeded demo accounts
  documented in the root `README.md` (password `Demo@12345` for all of them).
