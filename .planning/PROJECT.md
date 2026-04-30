# The Touchline Dribble

## What This Is

The Touchline Dribble is a 46K-LOC Next.js football editorial platform with live data integrations, a custom CMS, transfer reliability scoring, and an "Instigator" growth strategy. It needs to transition from an impressive side project into a product with verifiable traction for MBA admission.

## Core Value

Weaponized tactical football knowledge that drives viral engagement and converts readers into email subscribers.

## Requirements

### Validated

- [x] Custom CMS for football editorial content
- [x] Transfer reliability scoring
- [x] Live football data integrations
- [x] Newsletter engine (subscribe, welcome email, weekly digest)
- [x] OG image generation API
- [x] Admin panel with tabs
- [x] Transfer dossier pages
- [x] PostHog & Vercel Analytics integration

### Active

- [ ] Ship Instigator Campaign #1 (the Madrid Scapegoat)
- [ ] Gate transfer dossiers behind email capture
- [ ] Build admin metrics dashboard
- [ ] Add 10-15 tests on critical paths
- [ ] Add public Hit Rate tracker

### Out of Scope

- Multi-author support — (solo author focus for now)
- Payment/paywall integration — (sticking to email-gating for MBA timeline)
- Mobile app — (web platform is sufficient)
- Real-time features (WebSockets, live match commentary) — (too complex for current phase)

## Context

- **MBA Trajectory:** Need verifiable traction in the next 3 months (Target: 2,500+ subscribers).
- **Architecture:** Next.js App Router, MongoDB, Clerk Auth, Vercel Edge.
- **Immediate Gaps:** Error handling for newsletter subscribe, cron failure alerting, welcome email delivery confirmation.
- **Security:** Need to verify `.env.vercel.prod` is not committed and `/api/subscribers` requires admin auth.

## Constraints

- **Timeline**: 90 days to ship core growth engine and prove traction.
- **Architecture**: Stick to Next.js + MongoDB.
- **UI/UX**: Needs to match the existing "brutalist" high-authority tactical brand identity.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid Approach | Content drives traffic, platform catches leads | — Pending |
| Email Gating | Necessary for lead capture before implementing paywalls | — Pending |

---
*Last updated: 2026-04-29 after ceo review report*
