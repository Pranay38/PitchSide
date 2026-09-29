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
- [x] Transfer dossier pages (email-gated)
- [x] PostHog & Vercel Analytics integration
- [x] Admin metrics dashboard (subscriber growth & views)
- [x] Voting gateway modal (email capture on debates/predictions)
- [x] Magazine-style editorial email templates
- [x] Edge rate limiting on subscriber endpoint
- [x] Zero-CLS font loading (next/font/google)
- [x] Email preferences & A/B subject testing

### Active (Milestone 4 — Premium Redesign)

- [ ] Brand kit generation (visual identity lock)
- [ ] Typography refresh (Inter → Geist, weight hierarchy, text-wrap)
- [ ] Color palette cleanup (single accent, kill neon lime, unify grays)
- [ ] Interactive states (hover, active, focus rings, transitions)
- [ ] Layout & spacing overhaul (Art Gallery density, section diversity)
- [ ] Component modernization (Lucide → Phosphor, glassmorphism refinement, shadcn audit)
- [ ] Loading, empty, and error states
- [ ] Typography scale polish (type scale system, data typography)
- [ ] Motion refinement (remove Lenis, simplify scroll reveals)
- [ ] Content & copy audit (em-dash ban, AI cliché scan)
- [ ] Accessibility & production hardening

### Completed (Milestone 3 — SEO Growth Engine)

- [x] GSC API integration + striking-distance dashboard
- [x] IndexNow instant indexing on publish/update
- [x] SEO title/meta optimization engine + admin tools
- [x] Content calendar with publishing cadence tracker
- [x] Programmatic SEO expansion: comparisons, league hubs, player analysis
- [x] Schema expansion: HowTo, VideoObject, ItemList
- [x] Content refresh tracker for 4-6 week refresh cycles
- [x] Internal link scorer + automated suggestions
- [x] Weekly SEO metrics email via cron
- [x] Bing Webmaster integration + image optimization (WebP/AVIF)

### Completed (Milestone 2)

- [x] Fix 29 TypeScript errors and re-enable type checking
- [x] Optimize mobile reading experience (mobile-only, desktop untouched)
- [x] Break monolithic CMS files (AdminPage, StoryEditor, RichTextEditor)
- [x] SEO quick wins (FAQ schema, sitemap expansion, llms.txt)
- [x] Core Web Vitals optimization

### Out of Scope

- Multi-author support — (solo author focus for now)
- Payment/paywall integration — (sticking to email-gating for MBA timeline)
- Mobile app — (web platform is sufficient)
- Real-time features (WebSockets, live match commentary) — (too complex for current phase)
- Google AdSense — (rejected to preserve editorial prestige)
- Lead magnet funnel — (user rejected; using distribution-first growth instead)

## Context

- **MBA Trajectory:** Need verifiable traction in the next 3 months (Target: 2,500+ subscribers).
- **Architecture:** Next.js 15 App Router, MongoDB Atlas, Clerk Auth, Vercel Edge, Upstash Redis.
- **Email Pipeline:** Resend Batch API with A/B testing and preference management.
- **Growth Strategy:** Distribution-first (viral social content + syndication) with existing VotingGatewayModal for conversion.
- **Redesign Skills:** Using `redesign-existing-projects`, `design-taste-frontend` (v2), and `brandkit` skills for anti-slop premium frontend overhaul.
- **Redesign Mode:** Preserve — modernize without brand disruption. Retain IA, content, SEO, matchday-minute metaphor.

## Constraints

- **Timeline**: Ship redesign within 1-2 weeks.
- **Architecture**: Stick to Next.js + MongoDB. No framework migration.
- **UI/UX**: Full desktop + mobile redesign. Upgrade from "brutalist" to "tactical noir editorial" with anti-slop premium standards.
- **SEO Preservation**: Do NOT alter URL routes, slugs, anchor IDs, or primary nav labels.
- **Functionality**: Do NOT break existing features, CMS, auth, or analytics.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid Approach | Content drives traffic, platform catches leads | ✅ Active |
| Email Gating | Necessary for lead capture before implementing paywalls | ✅ Active |
| No AdSense | Preserve editorial prestige and high-end brand feel | ✅ Decided (M1) |
| No Lead Magnet Funnel | User preference — distribution-first growth over gated content | ✅ Decided (M2) |
| Mobile-Only UX Changes | Desktop layout untouched — optimize only mobile reading experience | ✅ Superseded (M4) |
| Full Redesign (Desktop + Mobile) | Premium anti-slop overhaul using taste-skill v2, redesign-skill, brandkit | ✅ Decided (M4) |
| Inter → Geist | Kill #1 AI-default font for distinctive modern sans | ✅ Decided (M4) |
| Lucide → Phosphor | Kill AI-default icon library for differentiation | ✅ Decided (M4) |
| Single Accent (Pitch Green) | Lock to #16A34A, kill neon lime #39FF14 and multi-accent chaos | ✅ Decided (M4) |
| Remove Lenis Smooth Scroll | Editorial sites should use native browser scrolling | ✅ Decided (M4) |

---
*Last updated: 2026-09-29 — Milestone 4 kickoff (Premium Redesign)*
