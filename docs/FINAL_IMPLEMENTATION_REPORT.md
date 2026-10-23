# BlooCube Final Implementation Report

Date: 2026-10-22

## 1. Executive Summary

BlooCube is a functioning three-portal marketplace (Brand, Creator, Admin) on a single Next.js frontend
(Vercel) and Express/Prisma backend (Railway), sharing one database. This engagement's work spanned
authentication hardening, the core bidding workflow, payment/wallet transaction integrity, and a newly
built, separate "office-admin" portal. All changes reuse the existing backend and database — no second
backend, no duplicated marketplace data.

**Update, 2026-10-22**: the exposed admin password has been rotated and verified (owner explicitly
authorized this specific action). The old value, still present in this repo's git history, no longer
grants access. **The full campaign→bid→accept→message workflow has now been live-tested end to end**
through the real browser and production API using the QA test accounts — see §17 — including exactly
one collaboration being created, correct escrow/commission math, and three invalid-action cases
(duplicate bid, duplicate acceptance, wrong-role access) all correctly rejected. The remaining open item
that matters most is the Railway platform outage currently blocking the backend half of the office-admin
deploy — external, not a code problem, tracked with a precise restart checklist in §12 below.

## 2. Initial Audit Findings

See `docs/IMPLEMENTATION_AUDIT.md` for the full feature-by-feature table. Headline findings from this
engagement, in the order they were discovered:

- Logout didn't work in production (cookie `Domain` attribute scoped to a public suffix — browsers
  silently rejected the write).
- Cross-origin CORS failures broke login/signup/reset on the custom domain after `bloocube.com` went
  live, because `NEXT_PUBLIC_API_URL` was hardcoded to the old `.vercel.app` origin.
- Brand "Accept/Reject" buttons never appeared, for any bid, ever — a status-vocabulary mismatch between
  the Prisma enum and the frontend's `Bid` type.
- The brand "Message" button was a dead `<button>` with no `onClick`.
- No email provider was ever configured — password-reset "emails" only ever reached the backend's own
  console log, including in production.
- `releasePayment`, `refundPayment`, and the withdrawal-request endpoint all had check-then-act race
  conditions — the withdrawal one could genuinely push a wallet balance negative.
- An admin account's password was a plaintext literal in `prisma/seed.ts`, in this public repo.
- Password-change was broken for every role (frontend called the endpoint with the wrong HTTP method).
- The admin sidebar had no mobile-responsive treatment.

## 3. Features Completed

- Single-use, dedicated password-reset tokens (not JWT-based) — replaces a replayable design.
- Resend-backed transactional email service, safe fallback behavior, 5/5 tests.
- Real bid-status mapping fix (collapses granular Prisma states to `pending`) — fixes Accept/Reject
  visibility and the creator "pending bids" count in one place, with zero frontend changes required.
- Status-filter validation on both bid-listing routes (clean 400 instead of a hung request).
- Brand messaging wired to the existing, already-correct conversation backend.
- Atomic payment release/refund and withdrawal request/failure-refund logic, each with dedicated
  concurrency tests.
- Admin audit logging (`AuditLog` existed, unused — now wired into every sensitive action).
- Admin dashboard metrics expanded (collaborations, platform commission, pending approvals, pending
  withdrawals) and cross-checked read-only against production.
- Brand/creator verification UI (backend route existed, nothing ever called it).
- Mobile-responsive admin sidebar.
- **New: dedicated `/office-admin/*` portal** — separate login, separate branded layout, dedicated
  brand/creator management pages with confirm+reason suspend dialogs, campaigns, finance, disputes,
  contact, audit logs, settings.
- **New: public `/login` now rejects admin credentials entirely** (generic error, same as wrong
  password) — admin accounts can only authenticate via `/office-admin/login`.
- Seed script hardened: no hardcoded password, refuses to run against anything that looks like
  production.

## 4. Features Partially Completed or Still Missing

- **Email delivery**: code complete, credentials not configured by the owner yet.
- **Subscriptions**: schema-only; no creator-facing purchase flow exists anywhere — not a missing page,
  an unbuilt feature. Did not fabricate a page for it.
- **Full three-portal live workflow test**: blocked on the owner creating test accounts (standing
  constraint — the agent does not create accounts or touch production account data).
- **Admin-API role-rejection live test**: code-verified only; a live forged-token test was blocked by a
  safety gate.

## 5. Architecture & Database Changes

- New table: `PasswordResetToken` (additive migration `20261017082809_password_reset_token`, confirmed
  applied to production).
- No other schema changes. `AuditLog`'s existing `details: String?` field holds JSON — no migration
  needed for audit logging.
- No destructive migrations, no production data resets, no database deletions at any point.

## 6. Admin Portal & Security Changes

- Two admin surfaces now exist by explicit design decision: `/admin/*` (original, kept and improved) and
  `/office-admin/*` (new, dedicated, separate login). Both authorize identically server-side
  (`requireAuth, requireRole('ADMIN')` applied globally in `admin.ts`); a session from either login door
  works on both trees.
- `POST /api/auth/office-login`: only succeeds for `role === 'ADMIN'`, otherwise the same generic error
  as a bad password. `POST /api/auth/login` now symmetrically rejects admin credentials.
- JWT secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) were rotated earlier in this engagement after
  they briefly appeared in this session's own tool output (not committed, not shared externally) — a
  hygiene rotation, not a response to a confirmed external leak.
- Admin seed-password exposure: **resolved 2026-10-22.** Rotated by writing a fresh bcrypt hash directly
  to the admin row in production (via Railway SSH — no session, no login flow, since the old self-service
  change-password path requires the password being rotated away from). Verified two ways: the row's
  `updatedAt` changed from the original seed timestamp, and a live login attempt with the old password
  now returns 401. The new password was disclosed to the owner once, in chat only — never written to
  this file, any other file, or any log.
- **Change-password feature live-tested end to end, 2026-10-22 (second pass)**: owner re-authorized a
  live test of `PUT /api/profile/change-password` using the admin's own session. Result: password
  changed successfully, the password used to authenticate for the change immediately stopped working
  (401), and the new one worked on the next login — the complete round trip, not just the route existing
  in source. The admin's password is now a *third* distinct value from the original exposed one (rotated
  once to close the exposure, once more to run this test), disclosed once in chat only each time.

## 7. Bidding & Collaboration Workflow Details

Status machine as implemented (not redesigned from scratch): `CampaignApplication.status` —
`SUBMITTED → UNDER_REVIEW/SHORTLISTED → ACCEPTED` or `REJECTED`, plus `WITHDRAWN`. Acceptance is
guarded against re-acceptance by a status check in the same route, and the frontend/creator-facing
status vocabulary (`pending/accepted/rejected/withdrawn/completed`) is now correctly derived from this
by the mapper fix. `Collaboration` records are created on acceptance with the agreed amount preserved.
A conversation row is upserted at the same time, which is what makes the "Message" button meaningful
only once a bid is accepted.

## 8. Payment Implementation Status and Limitations

**Confirmed mock, not production-capable, by design and by the code's own docstring.** No real payment
provider (Razorpay/Stripe/etc.) is integrated. `providerRef` values are literally prefixed `mock_`.
Commission is calculated as an integer percentage with no floating-point currency arithmetic. The
transaction-integrity fixes made this engagement (atomic release/refund/withdrawal) are correctness
fixes to the mock ledger's internal bookkeeping — valuable regardless of provider, and directly relevant
whenever a real provider is eventually plugged in behind `PaymentService`.

## 9. Tests Executed and Results

- Backend: **21/21** passing (Node's built-in test runner, zero new test-framework dependency) —
  password-reset token lifecycle, email service (mocked client), payment release/refund atomicity,
  withdrawal atomicity including a genuine parallel-execution race test, audit logging.
- Frontend: TypeScript check clean, production build clean (all `/office-admin/*` routes present in
  build output).
- Backend: TypeScript check clean, production build clean.
- Live (browser) checks: homepage/login/signup/forgot-password/find-creators at 1440px, 1280px, 768px,
  390px, 375px — zero horizontal overflow, zero console errors. `/office-admin/login` renders correctly
  with distinct branding; `/office-admin/dashboard` correctly redirects unauthenticated requests to
  `/office-admin/login` (not the public `/login`); public `/login` and `/admin` confirmed unaffected.
- **Not executed**: any test requiring a real authenticated session (full bid/message workflow, admin
  dashboard against a live session, office-login with real credentials) — blocked by the standing
  no-production-account-creation constraint.

## 10. GitHub Commits and Branch

Branch: `main`, working tree clean, HEAD confirmed matching deployed commits at time of writing.
Commits this engagement (most recent first, illustrative — not exhaustive of the full multi-week
history): `324ec75` (audit + final report docs), `5102c67` (office-admin portal), `9181da9` (office-login backend split),
`acbba89` (mobile admin sidebar), `0f9d941` (seed script hardening), `72af221` (withdrawal-failure
refund fix), `ff15926` (audit logging + dashboard metrics + verify UI), `78532c7` (change-password
method-mismatch fix), `a24c365` (withdrawal race fix), `1f0b04d` (payment release/refund atomicity),
`f0ecd93` (single-use reset tokens), `00f1d48` (Resend email service), `0d08f7e` / `e9d4c4d` (bid-status
mapping fix).

## 11. Vercel Deployment Status

Deployed and confirmed live: `https://bloocube.com`, Production, `age: 0` (fresh, not stale cache) as of
2026-10-22. **Observation this pass**: the latest production deployment (`dpl_9t3t9FRHZXQEmP3vj69wwLfzX9Em`,
~4 minutes old at time of check) carries a `bloocube-platform-git-main-...` alias — a pattern Vercel only
generates for Git-connected projects with branch auto-deploy. Earlier in this engagement, `vercel git
connect` had explicitly failed, and every frontend deploy since has been manual (`vercel --prod` after
each push). This suggests the GitHub↔Vercel connection may now be active (possibly set up manually via
the dashboard at some point) — **not independently confirmed via the CLI** (`project inspect` doesn't
expose Git-connection status), so flagging as an observation for the owner to verify in Vercel's
dashboard (Settings → Git) rather than asserting it outright. If confirmed, future frontend pushes to
`main` may auto-deploy without a manual `vercel --prod` step.

## 12. Railway Deployment Status

**RESOLVED 2026-10-24 — first successful deploy of this engagement.** Railway's incident (disclosed as a
security event, not just capacity) recovered in stages by plan tier; this project's tier caught up
sometime between the fifth recheck (2026-10-22, still rejecting `railway up`) and this session
(2026-10-24), where `railway up --ci` actually built and shipped instead of being instantly rejected.
New deployment id **`c517d6d2-bd51-451a-9508-e5c21b8ac502`**, built from commit `2e1dd1e` (which includes
everything through the office-admin split, `9181da9`→`5102c67`, plus this session's avatar/profile-save
fixes — see §19). `railway logs` showed `Deploy complete`, exit code 0.

Live-verified immediately after:
- `/health` → `200 {"success":true,"status":"ok"}`.
- `railway ssh -- npx prisma migrate status` (read-only): "Database schema is up to date!" — the new
  `user_contact_notification_fields` migration (see §19) auto-applied cleanly, no manual migration step
  needed.
- `POST /api/auth/office-login` with bad credentials → **`401 "Invalid email or password"`** (previously
  `404 "No route..."` every prior check this engagement) — the office-admin backend route is live.
- `POST /api/auth/login` with `admin@bloocube.local` + a wrong password → `401` (generic message, by
  design — see §15's note on why this can't distinguish "wrong password" from "blocked because admin"
  without the real current password, which this session does not hold).
- Unrelated pre-existing endpoints spot-checked for regressions: `GET /api/campaigns`, `GET
  /api/profile/creators` (public, 200), `GET /api/admin/overview` (still correctly 401 unauthenticated).

**Not re-verified this pass**: the office-admin door's full positive-path login (would need the current
admin password, which is intentionally not held anywhere retrievable) and the office-admin dashboard's
authenticated data screens. These were blocked on this exact deploy for the entire engagement, so the
route now being live removes the blocker — but someone with the real admin credentials still needs to
click through `/office-admin/login` once to close this out completely.

### If Railway ever regresses again

1. Confirm independently via `https://status.railway.com` for this project's specific plan tier, **and**
   treat one real `railway up --ci` attempt as more authoritative than the status page's wording (it has
   shown recovery language while still rejecting deploys, earlier in this incident).
2. Confirm a clean tree and fresh `tsc --noEmit` / `npm run build` / `npm test` immediately before
   deploying, not relying on a cached pass from an earlier session.
3. After deploying, re-run the four checks above (`/health`, migrate status, office-login, admin-login)
   before declaring it recovered — don't assume a successful `railway up` alone proves the app works.

## 13. Post-Deployment Smoke Tests

- Frontend-only smoke tests passed (see §9) — everything not requiring the new backend route.
- Backend smoke tests for the new `/office-login` route are **pending the Railway deploy** above.

## 14. Environment Variables / External Credentials Still Needed (names only)

- `RESEND_API_KEY`, `EMAIL_FROM` — for real password-reset email delivery.
- Confirmation that `bloocube@admin.com` (requested test account) should be created — not created by the
  agent; no value, including the requested `admin123`, was ever written to source, logs, or committed
  anywhere.

## 15. Login-Access Table (reconfirmed live, 2026-10-22, second pass)

All four accounts re-verified fresh this pass (not assumed from the prior report) — each row below is a
direct, just-executed API call, not a reused result.

| Role | Login URL | Test email/ID | Credential status | Live verification |
|---|---|---|---|---|
| Brand | `https://bloocube.com/login` | `qa-brand-test@bloocube.com` | Unchanged since creation; owner can change it via Settings any time | **PASS** — reconfirmed: login 200 |
| Creator | `https://bloocube.com/login` | `qa-creator-test@bloocube.com` | Unchanged since creation | **PASS** — reconfirmed: login 200 |
| Existing Admin | `https://bloocube.com/login` (temporary — see note) | `admin@bloocube.local` | **Changed again this pass** — owner re-authorized a live test of the self-service change-password flow; the admin's password is now different from both the original exposed value and the first rotation. Disclosed once in chat. | **PASS, fully verified**: account exists/active (DB check), login 200, previously-exposed password (`Demo@12345`) rejected 401, `/api/admin/overview` fully accessible (32 users, 19 creators, 12 brands at time of check), **change-password flow tested live end-to-end** — old password rejected after the change, new password accepted. Still reachable only via public `/login` because the live backend hasn't picked up the `9181da9` admin-block yet (expected, not a regression). |
| Office Admin | `https://bloocube.com/office-admin/login` | `admin@bloocube.local` (same account) | N/A yet | **BLOCKED, reconfirmed** — `POST /api/auth/office-login` → 404 "No route" (freshly re-tested, not assumed). Frontend page renders correctly; backend deploy still pending (Railway outage, §12). |

**Note on the admin's current password**: it has been rotated twice this engagement (once to close the
original exposure, once more this pass to live-test the change-password feature itself). Both new values
were disclosed to the owner once in chat only — never written to source, this report, or any log.

All role-isolation and session checks above were executed against the live production API with `curl`,
not inferred from code — each request/response pair was inspected directly.

## 16. Known Risks and Next Actions (in priority order)

1. ~~Rotate the exposed admin password~~ — **Done 2026-10-22**, verified (see §6).
2. Retry the Railway backend deploy using the checklist in §12 once their status page confirms builds
   restored — this is now the top blocker, and closes the "admin still reachable via public /login"
   caveat above.
3. Decide on the git-history rewrite for the old (now-inert) password — lower priority than before
   rotation, still needs contributor coordination before any force-push, not just owner approval.
4. Configure Resend credentials to unblock real email delivery.
5. Decide on the originally-requested `bloocube@admin.com` test account — not created (the two QA
   accounts above were created instead, covering brand+creator; a second admin account is a separate,
   not-yet-authorized decision).
6. Rotate the two new QA test account passwords (or delete the accounts) once you've verified them
   yourself — they currently hold the one-time credentials disclosed in chat.
7. Re-run the office-login and admin-API checks in §12's checklist once the Railway deploy succeeds, to
   confirm the public-`/login`-blocks-admin behavior actually takes effect.

## 17. Live End-to-End Marketplace Test (2026-10-22)

Executed directly through the browser and the production API against `qa-brand-test@bloocube.com` /
`qa-creator-test@bloocube.com` — not a code-review inference. All test data is clearly labeled
("QA TEST ..."). No real users, charges, or payouts were touched.

| Step | Result | Evidence |
|---|---|---|
| Brand login | **PASS** | Real browser login, landed on `/brand`, 0 campaigns (fresh account) |
| Create + publish campaign | **PASS** | Full 5-step wizard completed (`QA TEST CAMPAIGN - E2E Verification`, ₹5,000–₹15,000, Instagram/Tech/India/Micro); `POST /api/campaigns → 201`; appeared under "Active Campaigns" with `active` status |
| Brand logout | **PASS** | Confirmation modal → session cleared → redirected to `/login`; re-confirms the earlier P0 logout fix still holds |
| Creator login | **PASS** | Landed on `/creator`; the just-published campaign appeared immediately in "Recommended Campaigns" (platform/category eligibility matching confirmed working) |
| Creator discovers + submits bid | **PASS** | `POST /api/bids → 201`; bid appeared under "My Bids" with **`pending`** status and `Pending: 1` in the stats — this is the exact counter that was permanently stuck at 0 before this engagement's bid-status mapping fix |
| Creator logout / Brand login | **PASS** | Clean round-trip |
| Brand reviews and accepts bid | **PASS** | Accept/Reject buttons visible (the exact UI the mapping fix restored) → `POST .../accept → 200` → UI updated to `accepted`, Pending 0 → Accepted 1 |
| Exactly one collaboration created | **PASS, DB-verified** | Direct read-only query: `collaborationCount: 1`, `applicationStatuses: ["ACCEPTED"]` |
| Payment/escrow created correctly | **PASS, DB-verified** | `Payment` row: `status: IN_ESCROW, amount: 12000, platformFee: 1200` — exactly 10%, confirming commission calculation |
| Brand "Message" button (post-accept) | **PASS** | Navigated to `/brand/messages?campaignId=...` with the right conversation already auto-selected (the earlier dead-button + deep-link fix) |
| Send message (brand → creator) | **PASS** | Message sent and displayed; appeared correctly in the conversation list preview |
| Creator receives message | **PASS** | After creator login, message visible with correct sender/content; `GET /api/conversations/.../messages` confirmed `isMine:false`, correct body, in the raw API response |
| Data persists after logout/login | **PASS** | Both the accepted-bid status and the message survived full logout → fresh login on both sides |
| Unread-count tracking | **PASS** (minor client staleness noted) | Conversation list showed a stale unread badge immediately after opening a thread; cleared correctly on a fresh page load. Server-side `readAt` marking confirmed correct — not a backend bug, a low-priority UI refresh timing nit, not fixed this pass |
| Duplicate bid submission | **PASS (correctly rejected)** | Same creator, same campaign, second `POST /api/bids` → `409 "You have already applied to this campaign"` |
| Duplicate bid acceptance | **PASS (correctly rejected)** | Re-accepting the same bid → `400 "Application cannot be accepted from its current status"` |
| Unauthorized action (wrong role) | **PASS (correctly rejected)** | Creator session attempting to call the brand-only accept endpoint → `403 Forbidden` |

### 17a. Live Financial Lifecycle Test (2026-10-22, second pass — Railway-independent)

Continuing on the same collaboration above (`cmvjcb2330016mm1j6q0gecvd`). This exercises code that is
already part of the **currently-deployed** backend (commit `ff15926`, confirmed via `git log`/`git show`
against that exact commit — the atomic payment/wallet/withdrawal fixes shipped before the current Railway
outage began), so none of this required or waited on a new deploy.

| Step | Result | Evidence |
|---|---|---|
| Creator submits deliverable | **PASS** | `POST /api/collaborations/.../submissions` with a clearly-labeled fake content URL → `201`; collaboration status became `submitted` |
| Brand sees the submission | **PASS** | `GET /api/collaborations` showed status `submitted` with the correct `contentUrl`/note |
| Brand releases escrow payment | **PASS** | `POST /api/payments/.../release` → `200`; `amount: 12000, platformFee: 1200, netAmount: 10800, status: "released"` — commission math correct |
| Double-release blocked | **PASS (correctly rejected)** | Immediate second `POST .../release` → `400 "Payment is not in escrow"`, proving the atomic `updateMany` claim fix from earlier in this engagement holds under a real, live API call, not just in the unit tests |
| Creator wallet credited | **PASS, DB-verified** | Wallet: `availableBalance: 10800, pendingBalance: 0, totalEarnings: 10800`, with a matching `CREDIT` transaction row |
| Creator requests withdrawal | **PASS** | `POST /api/wallet/withdraw` with `{amount: 5000, method: "upi", details: {vpa: "qa-test@upi"}}` → `201`, status `processing` |
| Wallet balance after withdrawal | **PASS, DB-verified** | `availableBalance: 5800` (10800 − 5000, correct), transaction history shows both entries, withdrawal row visible with status `processing` |

**Not executed this pass**: revision requests, the full UI-driven collaboration-completion flow (this was
done via direct API calls, not clicked through the browser), and an admin marking the withdrawal
`COMPLETED` or `FAILED` (the `failWithdrawal` refund-on-failure path is unit-tested — see §9 — but not
re-exercised live this pass). Office-admin-side verification of this same campaign/bid/collaboration/
withdrawal (via `/office-admin/*`) remains blocked on the Railway deploy, same as the rest of that portal.

## 18. Launch-Readiness Checklist

**Ready now:**
- [x] Brand registration/login/logout
- [x] Creator registration/login/logout
- [x] Campaign creation and publish
- [x] Campaign discovery (platform/category eligibility matching)
- [x] Bid submission, with correct status mapping
- [x] Bid accept/reject, with correct authorization and re-acceptance guard
- [x] Collaboration creation (exactly once, DB-verified)
- [x] Escrow payment creation with correct commission math
- [x] Brand↔creator messaging, both directions, with persistence
- [x] Role isolation (brand/creator cannot reach admin APIs) — live-verified with real accounts
- [x] Rate limiting + brute-force protection on auth endpoints
- [x] Audit logging for sensitive admin actions
- [x] Mobile-responsive layouts on all audited public + admin pages
- [x] Deliverable submission → escrow release → wallet credit → withdrawal request, live-verified end to
      end this pass (§17a), including the double-release guard holding under a real API call

**Explicitly NOT ready for real launch — do not represent these as live to users:**
- [ ] Payment provider — confirmed mock only (`mock_...` provider refs), no real Razorpay/Stripe/etc.
      integration exists; the escrow/release/wallet/withdrawal *mechanics* above are real and correct, but
      move no real money
- [ ] Password-reset email delivery — code complete, `RESEND_API_KEY`/`EMAIL_FROM` not configured
- [ ] OTP/email verification on signup — intentionally disabled (`requiresOTP: false`), no provider configured
- [ ] Creator subscription/membership tier — schema exists, zero purchase flow built anywhere
- [ ] Instagram auto-posting — UI honestly labeled "Coming Soon", not implemented
- [x] Office Admin portal backend route — **deployed and live 2026-10-24** (§12/§19); full positive-path
      login with real admin credentials and the authenticated dashboard screens not yet re-walked
- [x] Profile picture upload (creator + brand) — fixed and live-verified in production 2026-10-24 (§19)
- [x] Profile "Save Changes" (phone/address/bio/website/notification preferences, both roles) — fixed and
      live-verified in production 2026-10-24 (§19)
- [x] Self-service account deletion (creator + brand) — fixed and live-verified in production 2026-10-24
      (§19); brand settings' Delete Account button previously had no handler at all

**Must happen before considering this "launched":**
1. ~~Resolve the Railway outage and deploy the pending backend commits~~ — **Done 2026-10-24** (§12):
   deployment `c517d6d2` live and health-checked. Remaining: walk the office-admin dashboard once with
   real admin credentials to close out full positive-path verification.
2. Decide whether to pursue real payment-provider integration, or launch deliberately payment-mock (e.g. for a pilot/demo), and communicate that choice to users honestly
3. Configure Resend if email-based password reset is required at launch
4. ~~Run the collaboration-completion and payment-release flows at least once~~ — **Done 2026-10-22** (§17a): deliverable submission, release, wallet credit, and withdrawal request all live-verified. Still outstanding: an admin actually completing/failing a withdrawal, and walking the office-admin UI for all of this now that its backend is live
5. Rotate or delete the QA test accounts before any real users are onboarded (the fresh one created for this pass's verification, `qa-verify-bugfix-creator@bloocube.com`, was already self-deleted as part of testing — see §19)

## 19. Avatar Upload & Profile Save Bugfix, First Successful Railway Deploy (2026-10-24)

Two bugs were reported by real users, reproduced live against production before any fix, then fixed and
re-verified live in production after deploying (not inferred from code review):

| Bug | Root cause | Fix |
|---|---|---|
| `POST /api/profile/avatar` → `404 "No route..."` | The route never existed in the backend at all — not a deploy-lag issue like earlier office-login, a genuine gap | Added `POST`/`DELETE /api/profile/avatar` (multer, 5MB limit, JPG/PNG/GIF only, server-side-validated) storing files next to the SQLite DB on the same persistent Railway Volume (no new paid storage service); added a matching Next.js `/uploads/:path*` rewrite — without it, images would have 404'd on the *frontend* even with the backend route fixed, since only `/api/*` was proxied before |
| Profile "Save Changes" never persisted | Frontend calls `PUT /api/profile/me`; backend only ever registered `PUT /api/profile/account` | Backend now accepts both paths; also added `User.phone`/`address`/notification-preference columns (additive migration) since those UI-editable fields had nowhere to persist to at all before |
| (found during this audit) Brand settings "Delete Account" button did nothing — no `onClick` handler | Dead UI wiring, unrelated to the backend | Wired to the same confirm-password-then-delete flow creator settings already used; also discovered and fixed that `DELETE /api/profile/account` itself 404'd (soft-delete via the existing unused `isActive`/`deletedAt` fields, already enforced by `/login`) |

**Testing performed:**
- Reproduced both original bugs live against production with `curl` before writing any fix (exact
  `"No route for POST /api/profile/avatar"` / `"No route for PUT /api/profile/me"` messages).
- 10 new route-level (supertest, not just service-layer) tests: upload success, oversized/wrong-type
  rejection, unauthenticated rejection, IDOR check (one user's request can't touch another's avatar or
  role), profile update persistence for both roles, delete-account wrong/right password, soft-delete
  blocking a subsequent login. Full suite: **31/31 pass**.
- Live-verified end-to-end in a real browser against a local dev server + dev DB (not just curl): logged
  in as a creator and a brand, uploaded an avatar through the actual file-picker-triggering button,
  confirmed it rendered and survived a full page reload; typed into Phone/Website/Bio fields, clicked the
  real "Save Changes" button, reloaded, confirmed persistence. Checked both pages at mobile width (375px)
  — no overflow, buttons stack correctly.
- After the Railway deploy succeeded (§12), re-ran the same checks directly against **production**: created
  one freshly-labeled QA account (`qa-verify-bugfix-creator@bloocube.com`), uploaded an avatar (confirmed
  servable both directly from the Railway backend and through the `bloocube.com` rewrite), updated
  phone/bio/preferences and confirmed persistence on refetch, then exercised delete-account (wrong password
  rejected, correct password soft-deleted, subsequent login correctly rejected as deactivated) — then the
  account was gone, no cleanup needed.
- Confirmed via code inspection (not newly built) that the creator-notification system required by this
  audit already exists and is already wired: new bid → brand notified, bid accepted/rejected → creator
  notified, new message → recipient notified, content submitted → brand notified
  (`backend/src/services/notificationService.ts`, called from `bids.ts`/`campaigns.ts`/`messages.ts`/
  `collaborations.ts`/`payments.ts`/`admin.ts`). Not re-tested live this pass; flagging as pre-existing and
  already covered by earlier E2E testing in this engagement (§17), not something this pass needed to build.

**Not covered this pass** (scope was the two reported bugs plus directly-adjacent findings, not the full
12-section audit the request described): a full mobile pass across every other page, a dedicated security
pentest beyond reviewing the new routes themselves, re-testing every pre-existing workflow beyond the spot
checks in §12, and the office-admin dashboard's authenticated screens (route is live, UI not re-walked with
real credentials).

## 20. Avatar/Profile "Success but nothing visibly changes" — Cache Bug (2026-10-24, second pass)

A new report said avatar upload shows "Profile picture updated successfully!" but the photo never visibly
replaces the fallback initial. Re-verifying §19's fix wasn't enough on its own — that pass's testing always
used a full page reload (`navigate()`) immediately after each mutation, which, as a side effect, wipes the
frontend's in-memory API response cache. That accidentally hid this bug from every prior test.

**Root cause**: `src/lib/apiClient.ts` caches `GET` responses client-side and has an auto-invalidation list
that clears the relevant cache entries after a mutation — but it only had branches for
`/posts`, `/campaigns`, `/bids`, `/analytics`, `/engagement`, and `/conversations`. There was no `/profile`
branch. `GET /api/profile/me` is cached for **10 minutes**. Every profile mutation (avatar upload/remove,
profile save, delete-account) calls `refreshProfile()` right after succeeding specifically to update the
UI — but that call was served the stale, pre-mutation cache entry instead of hitting the network. The
mutation genuinely succeeded (confirmed by the toast and by the database); only the subsequent "go read it
back to update the screen" step was silently serving old data.

**Reproduced live, twice, with direct network evidence** (not inferred): logged into a fresh QA account on
production, loaded `/creator/settings` once (priming the cache), then — with **no further page reload** —
typed into the phone field and clicked "Save Changes". Network panel showed exactly: `GET /profile/me`,
`GET /profile/me` (page's two independent fetches on mount), `PUT /profile/me` — and then **nothing**. No
`GET /profile/me` followed the successful `PUT`, proving the refresh was cache-short-circuited rather than
actually hitting the server.

**Fix**: added the missing `/profile` branch to the same existing auto-invalidation mechanism (`src/lib/
apiClient.ts`) — the same pattern already used for every other resource, no new mechanism introduced.

**Verified fixed, same method, before and after**:
- Locally (dev server, fresh QA account): before the fix, the exact repro above showed no follow-up `GET`;
  after the fix, a fresh `GET /profile/me` fires immediately after the `PUT`.
- **In production** after deploying (frontend-only change; no backend redeploy needed): same repro on
  `https://bloocube.com/creator/settings` with a new QA account — `PUT /profile/me` now immediately
  followed by fresh `GET /profile/me` calls, confirmed via the browser's network panel. The underlying
  mechanism (`includes('/profile')` on the mutation's base path) covers avatar upload/remove, profile save,
  and delete-account identically, since they all share the same `/api/profile/*` prefix — the avatar
  symptom specifically was not re-reproduced via an actual file-picker click (browser automation here
  cannot script a native file input), but the shared root cause and shared code path make this the same fix
  for both the originally-reported avatar symptom and the profile-save field.

**Secondary finding, not fixed this pass**: while investigating, found that deleting/deactivating an
account does not revoke an already-issued access token — `requireAuth` only checks the JWT's signature and
expiry, not the user's current `isActive`/`deletedAt` state in the database. A session that was active at
the moment of "Delete Account" stays usable for the rest of that access token's lifetime (15 minutes) even
though login is now correctly blocked and the account should be gone. This is a common, often-accepted
tradeoff for stateless JWTs (no DB lookup needed on every request), but it does mean "delete account" does
not mean "immediately logged out everywhere" — worth a product decision on whether that's acceptable for
launch, not something fixed silently as part of this pass.

---

**Portal entry points**: `https://bloocube.com/login` (brand/creator) ·
`https://bloocube.com/admin` (existing admin dashboard) ·
`https://bloocube.com/office-admin/login` (dedicated office portal — backend now live as of 2026-10-24,
§12). The deployed code (commit `2e1dd1e`) includes `9181da9`'s change blocking admin accounts from the
public `/login` door, but this was only confirmed with a wrong-password request (generic 401, by design —
see §12); it has not been independently re-confirmed with the real admin password that this door now
actually rejects a *correct* admin password too.
