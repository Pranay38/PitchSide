# Phase 12: Mobile Reading UX Optimization

## Summary of Changes

1. **Mobile Typography & Readability**: Added mobile-specific typography overrides (font size 18px, increased line height and paragraph spacing) via media queries in `theme.css`. Implemented text wrapping to prevent horizontal overflow on smaller screens.
2. **Sticky Reading Progress Bar**: Enhanced the existing `ReadingProgressBar` with mobile-specific behaviors. It now displays a thin progress bar at the very top of the screen with a subtle "X min left" indicator on mobile. Implemented a scroll-direction hook to hide the header on scroll down and reveal it on scroll up.
3. **Persistent Newsletter CTA**: Created a new `MobileNewsletterCTA` component for mobile only that appears conditionally after scrolling past 50% of the page. Respects dismissal rules for 7 days via `localStorage` and integrates directly with the existing `/api/subscribers` endpoint. Inserted at the global/blog post level.
4. **Swipe Navigation**: Implemented `SwipeNavigator` to handle horizontal touch swipes on mobile devices. Left-swiping navigates to the next article within the same category, and right-swiping navigates to the previous one, showing a visual indicator during the swipe.
5. **Mobile Image Optimization**: Added `loading="lazy"` and `sizes` attributes (`(max-width: 768px) 100vw, 800px`) to raw HTML blocks within the `ArticleContentRenderer`. Capped the featured cover image height to `60vh` via Tailwind classes, using `object-fit: cover` to maintain aspect ratio on smaller screens.

All changes are strictly scoped to mobile viewports, leaving the desktop layout fully intact.
