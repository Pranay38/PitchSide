# Phase 0: Critical Gap Fixes

## Objective
Fix P0 infrastructure gaps identified in the CEO review report's Failure Mode Registry.

## Tasks

### 0.1 ✅ Structured Welcome Email Error Logging
**File:** `server/endpoints/subscribers.ts`
- Added `error_logs` MongoDB collection logging when welcome emails fail
- Returns `emailSent` boolean in API response for frontend awareness
- Preserves non-blocking behavior — subscription never fails due to email

### 0.2 ✅ Cron Health Tracking (Pre-existing)
**Files:** `server/endpoints/daily-features.ts`, `server/endpoints/digest.ts`, `server/endpoints/welcome-sequence.ts`
- **ALREADY IMPLEMENTED** — All three crons write to `cron_logs` with jobName, lastRunAt, status, and error on failure
- No code changes needed

### 0.3 ✅ Legacy `_api/` Directory
- **NOT dead code** — actively used by `app/api/[...path]/route.ts` catch-all handler AND re-exported by `server/_db.ts`
- Decision: Leave in place. Would require a major refactor to consolidate, out of scope for Phase 0.

## Verification
- [ ] `npm run build` passes without errors
- [ ] Welcome email failure path logs to `error_logs` collection
- [ ] API response includes `emailSent` field

## Files Changed
- `server/endpoints/subscribers.ts` — structured error logging + emailSent response field
- `.planning/ROADMAP.md` — added Phase 0
- `.planning/STATE.md` — created
