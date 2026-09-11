# Phase 9: Critical Path Tests

## Goal
Add tests to verify the critical paths of The Touchline Dribble Platform MVP, ensuring features like RSS feed, sitemap generation, search, site settings, OG image generation, and post slug redirects work correctly.

## Tests Created
1. **Slug Redirect (`__tests__/slugRedirect.test.ts`)**: 
   - Mocked Next.js middleware using `@clerk/nextjs/server` `clerkMiddleware`.
   - Verified that accessing `/post/12345` securely redirects to `/post/some-slug`.
   - Ensured no redirect happens for valid slugs or non-existent IDs.

2. **Sitemap (`__tests__/sitemap.test.ts`)**:
   - Mocked data-fetching functions like `getPublishedPostsServer`.
   - Verified correct construction of `MetadataRoute.Sitemap` arrays.
   - Tested inclusion of static, post, story, and tag routes.

3. **RSS Feed (`__tests__/rss.test.ts`)**:
   - Mocked `connectToDatabase` from `_api/_db.ts`.
   - Verified `GET` returns a correct `application/rss+xml` structure.
   - Asserted parsing and deduplication of tags/categories into `<category>` elements.

4. **Search Endpoint (`__tests__/search.test.ts`)**:
   - Tested 400 responses on empty or short queries.
   - Asserted that `$search` (Atlas search) pipeline is called when valid.
   - Verified fallback logic running regex query upon Atlas search failure.

5. **OG Image Generator (`__tests__/ogImage.test.ts`)**:
   - Mocked `@vercel/og` `ImageResponse`.
   - Injected global `React` environment for JSX handling in `vitest`.
   - Asserted graceful handling of both missing and valid query parameters (title, club, subtitle).

6. **Site Settings (`__tests__/settings.test.ts`)**:
   - Verified behavior of `GET` endpoint responding with appropriate defaults.
   - Asserted that updating settings via `PUT` requires authentication.
   - Ensured normalized payload is correctly merged and persisted into the database.

## Results
All 67 tests across 15 test suites passed successfully (`vitest run`).
