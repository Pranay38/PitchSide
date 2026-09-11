# Phase 16: Core Web Vitals Optimization

## Optimizations Made

### 1. Dynamic Imports for Heavy Components
Identified and implemented dynamic imports from `next/dynamic` for heavy components that are below the fold or rendered conditionally in both `HomePage` and `BlogPostPage`. This reduces the initial JS payload and improves hydration time.

**HomePage:**
- `PollOfTheWeekPanel`
- `CommunityContributorCTA`
- `DebateWidget`
- `SupportBanner`
- `OnThisDayWidget`
- `RumorMillWidget`
- `FantasyCornerWidget`
- `InlineNewsletterCard`
- `BlogPostsGrid`
- `QuickTakesSection`
- `ChallengeTheTake`

**BlogPostPage:**
- `CommentSection`
- `PollWidget`
- `SeriesNavigator`
- `ReadingProgressBar`
- `QuickReactBar`
- `SwipeNavigator`
- `ArticleEndCTA`
- `MobileNewsletterCTA`
- `TouchlineAudioPlayer`
- `ArticleContentRenderer`

### 2. LCP Optimization
Ensured that the Largest Contentful Paint images have the `priority={true}` prop to pre-load them early.
- **HomePage:** The main hero `AeroHero` component was already utilizing `next/image` with `priority={true}` correctly.
- **BlogPostPage:** Converted the featured cover image from a native `<img>` tag to a `next/image` `<Image />` component with `priority={true}` and removed `loading="lazy"` (as `priority` negates lazy loading automatically). 

### 3. CLS Reduction
Addressed Cumulative Layout Shift by ensuring `next/image` uses proper dimensions.
- Converted all instances of native `<img>` tags inside `HomePage.tsx` to `next/image` `<Image />` components.
- Retained the `aspect-[...]/relative/overflow-hidden` container approach and added the `fill` prop to `next/image` to instruct it to occupy the constrained wrapper, which prevents layout shifts as images load.

### 4. Type Verification
Ran `tsc --noEmit` and successfully confirmed that dynamic imports and `next/image` usages correctly conform to all TypeScript type checking constraints.
