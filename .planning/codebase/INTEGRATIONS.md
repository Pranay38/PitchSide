# Integrations

## Authentication & Identity
- **Clerk / Next Auth:** Used for user authentication, session management, and admin access control.

## Database & Caching
- **MongoDB:** Primary persistence layer for articles, configurations, polls, and settings.
- **Upstash Redis:** Used for caching, rate limiting (via `@upstash/ratelimit`), and potentially session/ephemeral state.

## Communications
- **Resend & Nodemailer:** Email dispatching (possibly for newsletters, digests, and alerts).
- **Web Push:** Push notifications to subscribed clients.

## Analytics & Performance
- **Vercel Analytics & Speed Insights:** Provides traffic analytics, core web vitals, and performance metrics natively.
- **Vercel OG:** Dynamic OpenGraph image generation for social sharing.
