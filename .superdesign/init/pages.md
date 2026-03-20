# Dependency Trees

## /post/:id (Blog Post Page)
Entry: `src/app/pages/BlogPostPage.tsx`
Dependencies:
- `src/app/components/SEO.tsx`
- `src/app/components/Breadcrumbs.tsx`
- `src/app/components/Header.tsx`
  - `src/app/components/ThemeToggle.tsx`
  - `src/app/components/NotificationBell.tsx`
  - `src/app/components/DesktopCommandPalette.tsx`
  - `src/app/components/SearchModal.tsx`
- `src/app/components/Footer.tsx`
- `src/app/components/PostCard.tsx`
- `src/app/components/ReadingProgress.tsx`
- `src/app/components/CommentSection.tsx`
- `src/app/components/PollWidget.tsx`
- `src/app/components/ReactionUI.tsx`
- `src/app/components/InlineNewsletterCard.tsx`
- `src/app/components/PageState.tsx`
- `src/app/components/ArticleAudioPlayer.tsx`
- `src/app/components/ArticleContentRenderer.tsx`
- `src/app/lib/postStorage.ts`
- `src/app/lib/libraryStorage.ts`
- `src/app/lib/contentPaths.ts`
- `src/app/lib/embedHydration.ts`
