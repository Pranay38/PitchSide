# Content Gate Implementation Plan

## Goal Description
Implement a robust content gating system that locks blog articles at a specific paragraph/point and requires users to subscribe or log in to view the rest of the content. We also need to fix the performance issue that was causing the website to load slowly.

## User Review Required
> [!IMPORTANT]
> **SEO vs Security Trade-off**
> We have implemented **Option B: Soft Gate (CSS Blur)**. The gated content is rendered into the DOM (so Google can read it for SEO), but it is hidden under a gradient fade and a CSS blur effect so users must subscribe to read it.

## Proposed Changes

### 1. Fix Performance Bottleneck (Completed ✅)
- **Problem**: `app/post/[id]/page.tsx` was fetching `allPosts = await getPublishedPostsServer()` on every page load, but the variable was never used. This caused massive delays.
- **Solution**: Removed the unused data fetching.

#### [MODIFY] `app/post/[id]/page.tsx`
Removed the unnecessary `allPosts` fetching and properly passed `gatekeepPoint={post.gatekeepPoint}` to the `ArticleContentRenderer`.

### 2. Implement the Gating Logic (Completed ✅)
- **Problem**: `ArticleContentRenderer` was not checking the user's authentication state via Clerk (`@clerk/nextjs`).
- **Solution**: Imported `useUser` from Clerk and used it to verify if the user is authenticated.

#### [MODIFY] `src/app/components/ArticleContentRenderer.tsx`
Added `useUser` from `@clerk/nextjs` to accurately calculate `effectiveIsSignedIn`. It now properly cuts off the text content at the defined `gatekeepPoint` when the user is not signed in.

## Verification Plan
### Manual Verification
1. Open a blog post in an incognito window (logged out). Verify that the article cuts off at the specified point and shows the "Keep Reading" CTA.
2. Sign in or create a free account.
3. Verify that the full article becomes visible.
4. Verify that the page loads much faster now that the unused data fetching is removed.
