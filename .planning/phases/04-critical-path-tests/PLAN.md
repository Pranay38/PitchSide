# Phase 4: Critical Path Tests

## Status: 🔄 In Progress

## Objective
Add 10-15 Vitest unit tests covering the platform's critical paths: subscriber funnel, analytics dashboard, newsletter cron jobs, and admin auth gates. These tests validate the core growth engine and prevent regressions during rapid iteration.

## Context
- **Existing tests:** 5 test files (721 LOC) covering subscribers, analytics, club intelligence, transfer reliability, transfer watch
- **Test runner:** Vitest (configured in `vitest.config.ts`) — tests live in `__tests__/`
- **Pattern:** Mock `connectToDatabase`, `security` utils, and `_mailer` — test handler logic in isolation
- **Target:** 10-15 NEW tests across 3-4 critical test files

## Implementation Plan

### Wave 1: Newsletter Cron Tests (3 test files)
Test the three cron endpoints that power the growth engine:

1. **`__tests__/dailyFeatures.test.ts`** — `server/endpoints/daily-features.ts`
   - Verifies cron job calls `cron_logs` collection to track health
   - Verifies email send is attempted for subscribers
   - Verifies error logging on send failure

2. **`__tests__/digest.test.ts`** — `server/endpoints/digest.ts`
   - Verifies weekly digest batch email flow
   - Verifies cron_logs health tracking
   - Verifies graceful failure when no subscribers exist

3. **`__tests__/welcomeSequence.test.ts`** — `server/endpoints/welcome-sequence.ts`
   - Verifies Day 1 and Day 3 welcome email logic
   - Verifies subscribers are filtered by `subscribedAt` date
   - Verifies cron_logs health tracking

### Wave 2: Auth Gate Tests (1 test file)
4. **`__tests__/authGates.test.ts`** — Cross-cutting security
   - Verifies `requireAuth` rejects unauthenticated requests on admin endpoints (analytics, subscribers GET)
   - Verifies `checkRateLimit` returns 429 when rate exceeded
   - Verifies OPTIONS requests return 200 (CORS preflight)

### Wave 3: Email Gate + Transfer Dossier Tests (1 test file)
5. **`__tests__/emailGate.test.ts`** — Lead capture funnel
   - Verifies gated content returns partial data for non-subscribers
   - Verifies full content returned for subscribers
   - Verifies edge case: empty/malformed email

## Verification
- [ ] All new tests pass via `npm run test`
- [ ] No existing tests broken
- [ ] Coverage of all 3 cron jobs (daily-features, digest, welcome-sequence)
- [ ] Auth gate tested for admin endpoints
- [ ] Email gate tested for transfer dossier funnel

## Files to Create
- `__tests__/dailyFeatures.test.ts`
- `__tests__/digest.test.ts`
- `__tests__/welcomeSequence.test.ts`
- `__tests__/authGates.test.ts`
- `__tests__/emailGate.test.ts`
