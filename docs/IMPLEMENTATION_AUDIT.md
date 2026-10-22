# BlooCube Implementation Audit

Date: 2026-10-22
Scope: Full repository, production deployments (Vercel + Railway), and live site at https://bloocube.com.

This audit reflects the **actual current state** of the codebase across an extended engagement — most
P0/P1 items below were already investigated, fixed, tested and deployed in prior sessions, not assumed.
Status is backed by evidence (code reference, live test, or deployment log), not inference.

## Legend
- **Complete** — implemented, tested, and confirmed deployed.
- **Partial** — implemented but with a known, disclosed gap.
- **Missing** — no implementation exists.
- **Broken** — implementation exists but doesn't work correctly (root cause and fix noted).

---

## 1. Authentication & Authorization

| Feature | Status | Evidence |
|---|---|---|
| Brand/creator signup, login, logout | Complete | `backend/src/routes/auth.ts`; live-tested earlier this engagement |
| Password reset — single-use tokens | Complete | Dedicated `PasswordResetToken` table (not JWT-based), atomic claim via `updateMany` + transaction. 10/10 tests (`passwordResetService.test.ts`). Migration `20261017082809_password_reset_token` confirmed applied to production. |
| Password reset — email delivery | Partial | Resend integration implemented (`services/emailService.ts`, 5/5 tests) but `RESEND_API_KEY`/`EMAIL_FROM` are not yet set in Railway — confirmed by checking variable names only. Degrades safely to a token-free "not configured" log rather than a fake "sent" claim. |
| JWT access/refresh tokens | Complete | Rotated during this engagement after an exposure (see Security section). Verified: a token signed with a different secret is rejected (live 401 test); login pipeline functions post-rotation. |
| Office-admin dedicated login | Complete (code) / **Blocked on deploy** | `POST /api/auth/office-login` added (backend commit `5102c67`, on top of `9181da9`), frontend `/office-admin/login` deployed to Vercel. **Backend deploy blocked by a confirmed, active Railway platform-wide outage** (their status page: "Major Outage", builds disabled for non-Enterprise tiers) — not yet live in production. |
| Admin blocked from public `/login` | Complete (code) / **Blocked on deploy** | Same commit as above — `/login` now rejects `role === 'ADMIN'` with the identical generic message a wrong password produces. Same Railway-outage blocker. |
| Server-side role enforcement | Complete | `admin.ts`: `router.use(requireAuth, requireRole('ADMIN'))` applied globally — every admin route, not per-route. Confirmed by direct code read; a live forged-token test was attempted but blocked by a safety gate (see Known Risks). |
| Rate limiting on auth endpoints | Complete | `express-rate-limit` on login/register/password-reset, keyed by real client IP (`trust proxy` set for Railway's reverse proxy). |

## 2. Admin Credential Exposure (critical finding, this engagement)

| Item | Status | Evidence |
|---|---|---|
| Hardcoded admin password in `prisma/seed.ts` | **Found, partially remediated** | Was a plaintext literal, in this public repo, used to create the live `admin@bloocube.local` account. |
| Source fix | Complete | Commit `0f9d941`: random password generated per run (or `SEED_DEMO_PASSWORD` from a local `.env`); script now refuses to run at all when `RAILWAY_ENVIRONMENT` or `NODE_ENV=production` is detected. Verified locally both paths. |
| Live credential rotation | **Not done — owner action required** | Checked `updatedAt` on the admin row (read-only, timestamp only): unchanged since original seed. **The exposed password is still live as of this audit.** |
| Git history scrub | **Not done — needs owner approval** | Old value remains in every historical commit touching that file. Requires `git filter-repo` + force-push to `main`, which affects any existing clone/fork and this repo's other contributor — flagged for explicit go-ahead, not attempted. |
| Other secrets in repo/history | None found | Full history scan: no `.env` files ever committed (only `.env.example`); no AWS/Stripe/Google key patterns in current source. |

## 3. Bidding & Collaboration Workflow

| Feature | Status | Evidence |
|---|---|---|
| Bid status mapping (SUBMITTED/UNDER_REVIEW/SHORTLISTED → `pending`) | Complete | Fixed in `applicationToBidJson()` — this was the root cause of Accept/Reject never appearing on the brand dashboard and creators always showing 0 pending bids. |
| Bid status filters (`?status=`) on both list routes | Complete | Invalid filter values now return a clean 400 instead of forwarding to Prisma (which would otherwise hang — this codebase has no async-error-to-middleware wrapping). |
| Accept/reject bid, authorization, re-acceptance guard | Complete | Campaign-owner check; status-guard blocks re-accepting an already-ACCEPTED bid. |
| Brand messaging ("Message" button) | Complete | Was a dead button (no `onClick` at all) on the bids page — wired to `/brand/messages?campaignId=...`, with deep-link conversation auto-select added. Scoped to accepted bids only (matches when a conversation row actually gets created). |
| Conversation/message backend (`/api/conversations`) | Complete | Was already fully implemented and correctly authorized — only the frontend entry point was missing. |
| Full brand→creator→message workflow, live | **Blocked** | Requires a real test account on each side; the user performs all production account-bound actions themselves per the standing constraint — not executed by the agent. |

## 4. Payments & Wallet

| Feature | Status | Evidence |
|---|---|---|
| Payment provider | **Mock, confirmed and unchanged** | `PaymentService`'s own docstring: "Mock payment/escrow provider." `providerRef` literally prefixed `mock_...`. No real Razorpay/Stripe integration exists anywhere in the codebase. |
| Payment release/refund atomicity | **Fixed (was Broken)** | `releasePayment`/`refundPayment` only checked status via separate steps — a double-click could double-credit a wallet. Now atomic via `updateMany` claim inside a transaction. 3/3 tests, including an explicit double-release case. |
| Withdrawal request safeguard | **Fixed (was Broken — real risk)** | `/api/wallet/withdraw` checked balance before a separate decrement step — two concurrent requests could together withdraw more than available, going negative. Fixed atomically; proven with a genuine parallel (`Promise.all`) concurrency test, not a sequential assertion. |
| Withdrawal failure → balance refund | **Fixed (was Missing)** | Marking a withdrawal `FAILED` never returned the reserved amount to the wallet — money could be permanently lost. Fixed atomically + idempotently; 3/3 tests. |
| Commission calculation | Complete | Integer-based (`Math.round`), platform fee tracked separately from gross/net on every `Payment` row — no floating-point currency arithmetic. |
| Subscriptions (creator membership tier) | **Missing — not a page gap, a feature gap** | Investigated: `prisma.subscription` is referenced in exactly one place in the whole backend (an admin read-only list). Nothing anywhere ever creates a row — there is no creator-facing purchase flow at all. Building an admin page for it would be a permanently-empty list; not done, disclosed instead. |

## 5. Admin Portals (two, by explicit design decision)

| Item | Status | Evidence |
|---|---|---|
| `/admin/*` (original, general admin) | Complete | Dashboard, users (search/filter/activate), campaigns, payments, withdrawals, disputes, contact, audit logs, settings (platform config + change password). Mobile-responsive sidebar added this engagement. |
| `/office-admin/*` (new, dedicated "office" portal) | Complete (code) / **Blocked on backend deploy** | Fully separate route tree and layout per explicit decision (not a reuse of `/admin`): login, dashboard, dedicated brand management, dedicated creator management (both with confirmation + reason dialogs for suspend/reactivate), campaigns, finance (payments + withdrawals), disputes, contact, audit logs, settings. Frontend deployed to Vercel and visually verified (login page renders, correct redirect behavior). Functionally depends on the backend deploy currently blocked by the Railway outage. |
| Audit logging | Complete | `AuditLog` model existed in the schema but nothing ever wrote to it — zero trail for any admin action. Added `logAdminAction()`, wired into every sensitive mutation (user activate/deactivate with optional reason, creator/brand verify, withdrawal status change, dispute update). 2 dedicated tests. **Not yet exercised against live production data** — `auditLogCount: 0` confirmed via read-only query, since no admin has used the panel since deploy. |
| Dashboard metrics accuracy | Complete | Cross-checked by running the exact same aggregation queries the `/api/admin/overview` route runs, read-only, directly against production: `users:24, creators:14, brands:9, campaigns:5, collaborations:2, pendingCreator:8, pendingBrand:4, pendingWithdrawals:0`. |

## 6. Known Risks / Explicitly Not Attempted

1. **Admin password still exposed and live** — the single most urgent open item (see §2).
2. **Git history still contains the old password** — needs explicit owner approval given force-push + contributor coordination.
3. **Live test of admin-API role rejection with a forged token** — blocked by a safety gate; relying on code-level verification (high confidence, not live-fire).
4. **Full three-portal end-to-end workflow** — blocked on the owner creating test accounts (standing constraint: no account creation on production by the agent).
5. **Resend email delivery** — blocked on the owner configuring `RESEND_API_KEY`/`EMAIL_FROM`.
6. **Backend deploy of commits `9181da9` + `5102c67`** — blocked by a confirmed, active Railway platform outage as of this audit.

## 7. Dependency/Build Health

- Frontend: TypeScript check clean, production build clean.
- Backend: TypeScript check clean, production build clean, **21/21** automated tests pass (Node's built-in test runner — no new test-framework dependency introduced).
- `npm audit`: 3 pre-existing high-severity advisories, all in Prisma's own `@prisma/config`/`deepmerge-ts` dependency chain — confirmed unrelated to any dependency added this engagement (checked before/after the `resend` package install).
