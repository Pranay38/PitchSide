# Technical Concerns & Risks

## Security
- **Endpoints without Rate Limiting:** All endpoints lacking `@upstash/ratelimit` inclusion are vulnerable to abuse.
- **Authentication Bypass:** Misconfigurations in Clerk/NextAuth logic within `server/utils/security.ts` could accidentally expose Admin features. Ensure `hasAdminAuth()` is universally applied to CMS actions.

## Architecture
- **God Object / Global Sinks:** The `Error()` handler connects almost every module (as detected via knowledge graphs). While good for centralization, logic inside the error logger must remain trivial to avoid circular crashes.
- **Client vs. Server Leakage:** Accidental import of `mongodb` or `upstash/redis` code paths inside `"use client"` components could bloat bundle sizes or expose backend logic, although Next.js tries to halt this. 

## Performance
- **Heavy Client Bundles:** Bringing in `html2canvas`, `dnd`, `tiptap`, and `recharts` can dramatically increase Initial Load times. Leveraging Next.js dynamic imports (`next/dynamic`) for massive widgets is a priority concern.
- **Third-Party API Rates:** Integrations with Football-Data APIs or Social Scrapers could result in 429 Rate Limits if aggressive caching isn't correctly structured in server endpoints.
