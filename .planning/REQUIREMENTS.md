# Requirements — Milestone 2: Platform Hardening & Distribution Engine

## Goal
Transform The Touchline Dribble from a feature-rich MVP into a production-grade, distribution-optimized editorial platform. Fix the engineering foundation, build automated social content tools, optimize the mobile experience, and expand programmatic SEO — all toward the 2,500-subscriber target.

## Success Metrics

| Metric | Current | Target | Tracking |
|--------|---------|--------|----------|
| TypeScript errors | 29 | 0 | `npx tsc --noEmit` |
| Build safety | `ignoreBuildErrors: true` | Removed | `npm run build` |
| Test coverage (critical paths) | ~9 tests | 22+ tests | `npm run test` |
| Root directory clutter | 72 files | <30 files | Manual count |
| CI pipeline | None | Lint+TS+Test on PR | GitHub Actions |
| Social content generation | Manual | Automated (quote cards, threads, carousels) | Admin panel |
| Content syndication | None | Reddit + Substack + Medium | API endpoint |
| Mobile reading score | Unaudited | Lighthouse Mobile 90+ | Lighthouse |
| Largest component file | 43KB (StoryEditor) | <15KB per module | File size check |
| Programmatic SEO pages | Managers + Matchups | + Player vs Player + Formations | Sitemap count |

## Functional Requirements

### FR-1: Engineering Foundation (Sprint 1)
- **FR-1.1**: Fix all 29 TypeScript errors in ts_errors.txt
- **FR-1.2**: Remove `ignoreBuildErrors: true` from next.config.mjs
- **FR-1.3**: Add proper types to BlogPost, Story, and server data prop interfaces
- **FR-1.4**: Add 10-15 critical path tests (subscriber funnel, auth gates, cron jobs, homepage, sitemap)
- **FR-1.5**: Create CI pipeline (.github/workflows/ci.yml): lint → type check → test → build

### FR-2: Infrastructure Cleanup (Sprint 1)
- **FR-2.1**: Move 30+ loose files from root to appropriate subdirectories
- **FR-2.2**: Delete AdminPage.tsx.bak (132KB dead code)
- **FR-2.3**: Consolidate 5 env files to 3 max
- **FR-2.4**: Remove duplicate security headers from vercel.json (keep next.config.mjs as source of truth)

### FR-3: SEO Quick Wins (Sprint 1)
- **FR-3.1**: Add FAQ schema (JSON-LD FAQPage) to article pages from H2/H3 headings
- **FR-3.2**: Expand sitemap with glossary terms, weekly roundup, for-you, leaderboard
- **FR-3.3**: Enhance llms.txt with article index and create llms-full.txt
- **FR-3.4**: Verify breadcrumb JSON-LD schema on all article/story pages

### FR-4: Viral Social Engine (Sprint 2)
- **FR-4.1**: Auto-generate branded shareable quote card images from article content
- **FR-4.2**: Generate Twitter thread (5-7 tweets) from any article via admin panel
- **FR-4.3**: Generate Instagram carousel (5 slides) from article via admin panel
- **FR-4.4**: Enhanced ShareBar with pre-populated platform-specific content
- **FR-4.5**: Consolidate existing carousel scripts into admin tool

### FR-5: Content Syndication (Sprint 2)
- **FR-5.1**: Auto-generate Reddit-formatted post (markdown + backlink) per article
- **FR-5.2**: Auto-generate truncated Substack/Medium cross-post (first 40% + canonical link)
- **FR-5.3**: Admin toggle per article: "Syndicate this post" checkbox
- **FR-5.4**: Enhance RSS feed with content:encoded and media:content

### FR-6: Mobile Reading Optimization (Sprint 2)
- **FR-6.1**: Increase mobile body font to 18px, line-height 1.75 (mobile-only CSS)
- **FR-6.2**: Sticky reading progress bar with "X min left" (mobile only)
- **FR-6.3**: Persistent newsletter CTA bar after 50% scroll (mobile only, dismissible)
- **FR-6.4**: Swipe navigation between articles in same category (mobile only)
- **FR-6.5**: Optimized image sizes and lazy loading for mobile viewports
- **FR-6.6**: NO changes to desktop layout or styling

### FR-7: CMS Modularization (Sprint 3)
- **FR-7.1**: Split AdminPage.tsx (42KB) into 5 focused modules
- **FR-7.2**: Split StoryEditor.tsx (43KB) into 4 focused modules
- **FR-7.3**: Split RichTextEditor.tsx (36KB) into 3 focused modules

### FR-8: Programmatic SEO (Sprint 3)
- **FR-8.1**: Player vs Player comparison pages (/vs/[player1]-vs-[player2])
- **FR-8.2**: Formation hub pages (/tactics/[formation])
- **FR-8.3**: Thin content safeguards (≥3 data points threshold, noindex fallback)
- **FR-8.4**: Add programmatic pages to dynamic sitemap

### FR-9: AI Content Assistant (Sprint 4)
- **FR-9.1**: Admin sidebar: "Generate Outline" from topic prompt
- **FR-9.2**: Auto-suggest internal links based on entity matching
- **FR-9.3**: "Draft Social Copy" from article content

### FR-10: Core Web Vitals (Sprint 4)
- **FR-10.1**: Lazy-load below-fold homepage widgets
- **FR-10.2**: Dynamic imports for heavy client components
- **FR-10.3**: Split HomePage.tsx into server/client portions
- **FR-10.4**: Hero image fetchPriority="high", all others loading="lazy"

## Non-Functional Requirements

- **NFR-1**: Desktop UI/UX must remain completely unchanged
- **NFR-2**: All changes must pass `npm run build` without `ignoreBuildErrors`
- **NFR-3**: No new npm dependencies unless strictly necessary
- **NFR-4**: Existing tests must not break
- **NFR-5**: Brand identity ("brutalist tactical magazine") must be preserved

---
*Generated: 2026-09-11 — Milestone 2 requirements*
