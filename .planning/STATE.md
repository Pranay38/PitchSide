# State

## Current Position
- **Phase:** 4
- **Phase Name:** Critical Path Tests
- **Status:** planning
- **Started:** 2026-04-30

## Decisions
- [2026-04-30] `.env.vercel.prod` verified NOT committed — `.gitignore` line 11 excludes it, zero git history
- [2026-04-30] `/api/subscribers` listing endpoint verified PROTECTED — `requireAuth()` check on line 266
- [2026-04-30] Email gate unlock mechanism: keep existing hybrid approach (hashed cookie + server validation)
- [2026-04-30] Hit Rate: hide widget until ≥10 predictions resolved

## Blockers
(none)
