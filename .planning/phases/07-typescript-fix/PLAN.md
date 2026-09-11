# Phase 7: TypeScript Error Fix

## Objective
Fix all TypeScript compilation errors and re-enable strict type checking during the build process.

## Tasks Completed
- **Next.js 15 Async Params:** Updated app/managers/[slug]/page.tsx, app/matchups/[slug]/page.tsx, and app/glossary/[slug]/page.tsx to handle async route parameters required in Next.js 15. The params object is now awaited and correctly typed as a Promise. Also fixed the params.slug usage in JSON-LD blocks within these files.
- **MatchRating Type Adjustments:** Updated BlogPost interface in src/app/data/posts.ts to type matchRating as { home: number; away: number } | null.
- **PostEditor & MetaSettings:** Plumbed matchRating and setMatchRating through MetaSettingsProps in src/app/components/editor/MetaSettings.tsx and the PostEditor component. Updated the UI in MetaSettings to render two separate number inputs for home and away ratings instead of a single overall rating input.
- **PostCard Rating Display:** Adapted src/app/components/PostCard.tsx to safely access and average the structured matchRating (e.g. displaying ((home + away) / 2)) instead of expecting a primitive number.
- **Removed Type Ignore:** Removed the typescript: { ignoreBuildErrors: true } block from next.config.mjs.
- **Other Type Issues:** Removed duplicate `useUser` import in src/app/pages/BlogPostPage.tsx which was causing build failures.

## Verification
- tsc --noEmit completes with 0 errors.
- Build process now strictly checks types successfully.
