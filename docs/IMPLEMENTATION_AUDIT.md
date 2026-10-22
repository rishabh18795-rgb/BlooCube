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
| Hardcoded admin password in `prisma/seed.ts` | **Found, remediated** | Was a plaintext literal, in this public repo, used to create the live `admin@bloocube.local` account. |
| Source fix | Complete | Commit `0f9d941`: random password generated per run (or `SEED_DEMO_PASSWORD` from a local `.env`); script now refuses to run at all when `RAILWAY_ENVIRONMENT` or `NODE_ENV=production` is detected. Verified locally both paths. |
| Live credential rotation | **Complete, verified 2026-10-22** | Owner explicitly authorized this specific action. Rotated by writing a fresh bcrypt hash directly to the admin row via Railway SSH (no session, no login flow — the old self-service change-password path requires the current password, which was the thing being rotated away from). Verified two ways: `updatedAt` changed from the original seed timestamp to 2026-10-22, and a live login attempt with the old password (`Demo@12345`) now returns 401. The new password was disclosed to the owner once, in chat only — never written to any file, doc, or log. |
| Git history scrub | **Reviewed — not recommended to rush** | Old value remains in every historical commit touching that file, but the live credential is now rotated, so the leaked value in history no longer grants access — the urgency that previously justified a disruptive force-push rewrite is gone. Still technically present in history as hygiene debt. If pursued later: `git filter-repo` + force-push to `main`, which affects any existing clone/fork and this repo's other contributor — needs explicit coordination with them first, not just owner approval. Not attempted. |
| Other secrets in repo/history | None found | Full history scan: no `.env` files ever committed (only `.env.example`); no AWS/Stripe/Google key patterns in current source. |

## 3. Bidding & Collaboration Workflow

| Feature | Status | Evidence |
|---|---|---|
| Bid status mapping (SUBMITTED/UNDER_REVIEW/SHORTLISTED → `pending`) | Complete | Fixed in `applicationToBidJson()` — this was the root cause of Accept/Reject never appearing on the brand dashboard and creators always showing 0 pending bids. |
| Bid status filters (`?status=`) on both list routes | Complete | Invalid filter values now return a clean 400 instead of forwarding to Prisma (which would otherwise hang — this codebase has no async-error-to-middleware wrapping). |
| Accept/reject bid, authorization, re-acceptance guard | Complete | Campaign-owner check; status-guard blocks re-accepting an already-ACCEPTED bid. |
| Brand messaging ("Message" button) | Complete | Was a dead button (no `onClick` at all) on the bids page — wired to `/brand/messages?campaignId=...`, with deep-link conversation auto-select added. Scoped to accepted bids only (matches when a conversation row actually gets created). |
| Conversation/message backend (`/api/conversations`) | Complete | Was already fully implemented and correctly authorized — only the frontend entry point was missing. |
| Full brand→creator→message workflow, live | **Complete — live-verified 2026-10-22** | Executed through the real browser + production API: campaign creation/publish → creator discovery/bid → brand accept → exactly one collaboration (DB-verified) → escrow payment with correct 10% commission (DB-verified) → message sent and received both directions → data persists after logout/login on both sides. Duplicate bid, duplicate acceptance, and wrong-role access attempts all correctly rejected (409/400/403). Full detail: `FINAL_IMPLEMENTATION_REPORT.md` §17. Not covered: deliverable/milestone submission, revision flow, payment release. |

## 3a. Mock Data / Placeholder / Dead-Route Scan (Brand & Creator Portals)

Explicitly requested scan across `src/app/(dashboard)/brand` and `src/app/(dashboard)/creator`. Core
marketplace flow (campaigns, bids, payments, messaging) was already audited above and has no undisclosed
mock data — everything there calls real backend endpoints. Two secondary, out-of-core-flow findings:

| Finding | Where | Status |
|---|---|---|
| Social-media auto-posting ("Instagram posting is coming soon") | `creator/posts/page.tsx` | **Honestly disclosed already** — the UI itself shows a "Coming Soon" badge and a toast saying so. A `mockMode` localStorage flag exists for local testing of the posting flow; not reachable by a normal user, and the UI never claims a post succeeded for real while in that mode. Several `TODO: implement view/edit/cancel schedule` comments remain for post-scheduling management — unfinished, not misrepresented. |
| Hardcoded placeholder avatar URL (`/api/placeholder/60/60`) | `brand/analytics/page.tsx`, `creator/competitors/page.tsx` | **Fixed — and reassessed.** On closer inspection this field was never actually rendered anywhere (confirmed via a full-file grep for `avatar` in both files) — not a visible broken image after all, just dead data. Removed. |

No disconnected forms, dead buttons, or authorization gaps were found beyond what's already listed
elsewhere in this document (the brand "Message" button fix, the creator/brand verification UI fix).

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

1. ~~Admin password exposed and live~~ — **Resolved 2026-10-22.** Rotated and verified (see §2).
2. **Git history still contains the old (now-inert) password** — low priority now that it's rotated; needs contributor coordination before any force-push, not just owner approval.
3. ~~Live test of admin-API role rejection~~ — **Resolved 2026-10-22, with real test accounts (not a forged token).** Owner authorized creating isolated brand + creator test accounts directly in production (`qa-brand-test@bloocube.com`, `qa-creator-test@bloocube.com`). Live `curl` tests against the production API confirm: both log in successfully with correct role; both get a clean 403 Forbidden from `/api/admin/overview`; wrong password is rejected (401); logout genuinely invalidates the session server-side (a post-logout request to a protected route returns 401, not a stale-but-still-valid session). See the Login-Access Table in `FINAL_IMPLEMENTATION_REPORT.md` §15.
4. **Full three-portal end-to-end *workflow*** (campaign creation, bidding, acceptance, messaging as these two new accounts) — not yet executed; auth and role-isolation are now verified, but the business-logic workflow itself still needs a dedicated pass.
5. **Resend email delivery** — blocked on the owner configuring `RESEND_API_KEY`/`EMAIL_FROM`.
6. **Backend deploy of commits `9181da9` + `5102c67`** — still blocked as of 2026-10-22, reconfirmed via both Railway's own status page (Major Outage, builds disabled for non-Enterprise tiers) and a direct `railway up` attempt (`"Deploys have been paused due to an upstream issue"`). A direct consequence, also confirmed live: the admin account can currently still log in via the public `/login` (the live backend hasn't picked up the `9181da9` block yet) — expected to close once this deploy lands, not a bug to chase in the meantime. See the deployment checklist in `FINAL_IMPLEMENTATION_REPORT.md` §12.

## 7. Dependency/Build Health

- Frontend: TypeScript check clean, production build clean.
- Backend: TypeScript check clean, production build clean, **21/21** automated tests pass (Node's built-in test runner — no new test-framework dependency introduced).
- `npm audit`: 3 pre-existing high-severity advisories, all in Prisma's own `@prisma/config`/`deepmerge-ts` dependency chain — confirmed unrelated to any dependency added this engagement (checked before/after the `resend` package install).
