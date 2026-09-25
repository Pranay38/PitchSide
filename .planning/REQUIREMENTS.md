# Requirements — Milestone 3: SEO Growth Engine

## Goal
Scale The Touchline Dribble from ~500 impressions to 200k impressions / 50k clicks through systematic coverage expansion, position improvement, and click capture optimization. Build the engineering infrastructure that turns the SEO growth playbook into an automated, measurable system.

## Growth Model (Three Levers)
1. **Coverage**: More indexed, ranking pages targeting real queries → impressions scale
2. **Position**: Move pages from positions 8-20 into top 5 → clicks explode
3. **Click Capture**: Better titles, meta descriptions, rich results, brand searches → CTR multiplier

## Success Metrics

| Metric | Current | Target | Tracking |
|--------|---------|--------|----------|
| Monthly impressions | ~500 | 200,000 | GSC Performance |
| Monthly clicks | ~20 | 50,000 | GSC Performance |
| Average CTR | ~2% | 5%+ | GSC Performance |
| Indexed pages | ~50 | 500-1000 | GSC Pages report |
| Queries in positions 1-3 | ~5 | 100+ | GSC/Dashboard |
| Queries in positions 4-10 | ~15 | 300+ | GSC/Dashboard |
| Programmatic SEO pages | ~35 (glossary + managers + matchups) | 500+ | Sitemap count |
| Weekly publish cadence | Irregular | 3-5 posts/week | Content calendar |
| Content freshness | No tracking | <6 weeks staleness | Refresh tracker |

## Functional Requirements

### FR-1: Foundation Hardening (Sprint 1)
- **FR-1.1**: Add Bing Webmaster verification meta tag to layout
- **FR-1.2**: Configure Next.js image optimization for WebP/AVIF auto-conversion
- **FR-1.3**: Implement IndexNow endpoint for instant Bing/Yandex indexing on publish/update
- **FR-1.4**: Create centralized schema generators library (HowTo, VideoObject, ItemList, Comparison, Breadcrumb, FAQ)
- **FR-1.5**: Verify and fix RSS feed endpoint

### FR-2: Quick Win Tools (Sprint 2)
- **FR-2.1**: SEO title utilities — click-worthy title generator, validator, meta description generator, improvement suggestions
- **FR-2.2**: GSC API client — dual-mode (API with service account OR CSV import fallback)
- **FR-2.3**: Admin SEO dashboard — KPIs, striking-distance table, CTR opportunities, position distribution
- **FR-2.4**: Title optimizer admin page — batch title analysis and improvement for all published posts
- **FR-2.5**: Content calendar admin page — weekly publishing tracker against 3-5/week target

### FR-3: Programmatic Coverage Expansion (Sprint 3)
- **FR-3.1**: Comparison page template (`/vs/[slug]`) — player-vs-player, team-vs-team, formation-vs-formation with JSON-LD
- **FR-3.2**: Comparison data model and CRUD API
- **FR-3.3**: League hub pages (`/[league]/`) — Premier League, La Liga, Bundesliga, Serie A, Ligue 1 with auto-aggregated content
- **FR-3.4**: Player analysis template pages (`/players/[slug]`) with performance data, related articles, and schema
- **FR-3.5**: Expand manager pressure data from 2 to 20 (top managers across big 5 leagues)
- **FR-3.6**: Batch generation script for seeding programmatic pages
- **FR-3.7**: Add HowTo schema to tactical guide posts, VideoObject schema for embedded YouTube content
- **FR-3.8**: Update sitemap.ts to include all new page types

### FR-4: Compound & Measurement (Sprint 4)
- **FR-4.1**: Add `lastSEORefresh` and `seoNotes` fields to post model
- **FR-4.2**: Content refresh tracker admin page — staleness scoring, position trends, refresh history
- **FR-4.3**: Internal link scorer — authority calculation, orphan detection, link suggestions
- **FR-4.4**: Enhance InternalLinkSuggestion component with scorer data in post editor
- **FR-4.5**: Weekly SEO metrics email — GSC data summary sent via Resend cron
- **FR-4.6**: Add weekly SEO cron to vercel.json

## Non-Functional Requirements

- **NFR-1**: Desktop UI/UX must remain unchanged
- **NFR-2**: All changes must pass `npm run build`
- **NFR-3**: Minimize new npm dependencies (prefer built-in Node APIs)
- **NFR-4**: Existing tests must not break
- **NFR-5**: Brand identity ("brutalist tactical magazine") must be preserved in all admin pages
- **NFR-6**: Programmatic pages must have genuine value (no thin content — minimum data threshold before rendering)
- **NFR-7**: All pages must have canonical URLs and proper OG/Twitter metadata

---
*Generated: 2026-09-25 — Milestone 3 requirements (SEO Growth Engine)*
