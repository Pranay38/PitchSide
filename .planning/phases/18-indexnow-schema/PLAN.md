# Phase 18: IndexNow + Schema Generators

## Status: ✅ DONE

## Objective
Enable instant indexing via IndexNow and create centralized schema generators for rich results.

## Tasks
- [x] Create `lib/indexnow.ts` — helper function `notifyIndexNow(urls: string[])`
- [x] Create `app/api/indexnow/route.ts` — POST handler for URL submission, GET for key verification
- [x] Create `lib/schema-generators.ts` — 6 schema generators: HowTo, VideoObject, ItemList, Comparison, Breadcrumb, FAQ
- [x] Create `app/api/rss/route.ts` — App Router RSS 2.0 feed (replacing legacy `server/endpoints/rss.ts`)
- [x] Update `.env.example` with `INDEXNOW_API_KEY`

## Files Created
- `lib/indexnow.ts`
- `app/api/indexnow/route.ts`
- `lib/schema-generators.ts`
- `app/api/rss/route.ts`

## Verification
- [ ] POST to `/api/indexnow` with URLs returns 200
- [ ] GET `/api/indexnow` returns the key
- [ ] GET `/api/rss` returns valid RSS XML
- [ ] Schema generators produce valid JSON-LD (test with Google Rich Results Test)
