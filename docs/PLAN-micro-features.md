# Frontend Micro-Features Plan

## Context
The user requested 20 specific frontend micro-features to be built *if they are not present*. An audit of the current platform revealed that 12 of the 20 features are **already present** in the codebase. This plan outlines the implementation of the remaining 8 missing features.

## Audit Results

### ✅ ALREADY PRESENT (Skipping)
1. **Dark mode toggle:** `ThemeToggle.tsx`
2. **Simple cookie banner:** `CookieBanner.tsx`
3. **Site search:** `SearchModal.tsx`
4. **Back to top button:** `BackToTopButton.tsx`
5. **Mobile menu:** `MobileBottomNav.tsx`
6. **Scroll progress bar:** `ReadingProgressBar.tsx`
7. **Copy button:** Included in `ShareBar.tsx`
8. **Sticky headers:** Included in `Header.tsx` (using `sticky top-0`)
9. **Skip to content:** Hidden anchor link in `app/layout.tsx`
10. **UTM tracking:** Automatically handled by PostHog (`PostHogProvider.tsx`)
11. **Password visibility toggle:** Authentication forms are handled natively via Clerk.
12. **Hover states:** Implemented globally via Tailwind CSS (`hover:` variants).

### ❌ MISSING (To Be Built)
The following features will be built:

1. **Loading animations (Global)**
2. **Print stylesheet**
3. **Form success state (UI)**
4. **Form error state (UI)**
5. **Confirmation modals**
6. **Last updated date (UI)**
7. **Expandable FAQ (Standalone Component)**
8. **Floating contact button**

---

## Task Breakdown (Phase 1: Setup & Missing UI)

### 1. Global Loading Animations
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-enhancer`
- **Action:** Add a Next.js global loading progress bar (e.g., `nextjs-toploader`) to `layout.tsx` to give visual feedback during route changes.

### 2. Print Stylesheet
- **Agent:** `frontend-specialist`
- **Action:** Append an `@media print` block to `src/styles/theme.css` to hide headers, footers, interactive elements, and format the text for clean reading on paper.

### 3. Form Success & Error States
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-enhancer`
- **Action:** Integrate `sonner` (already in package.json) into `app/layout.tsx` via `<Toaster />`. Provide a standardized wrapper or demonstrate its use in a component for clean success/error visual states.

### 4. Generic Confirmation Modal
- **Agent:** `frontend-specialist`
- **Action:** Create `src/app/components/ConfirmationModal.tsx` using the brutalist dark theme. It should accept `title`, `description`, `onConfirm`, and `onCancel` props.

### 5. Expandable FAQ (Standalone UI Component)
- **Agent:** `frontend-specialist`
- **Skill:** `frontend-enhancer`
- **Action:** Create `src/app/components/ExpandableFAQ.tsx` (an Accordion component) for generic use outside of the editorial post blocks.

### 6. Floating Contact Button
- **Agent:** `frontend-specialist`
- **Action:** Create `src/app/components/FloatingContact.tsx` that stays pinned to the bottom-right (above the mobile menu) and opens a mailto link or contact form.

### 7. Last Updated Date Display
- **Agent:** `frontend-specialist`
- **Action:** Modify `app/post/[id]/page.tsx` and/or `src/app/components/PostCard.tsx` to display `lastSEORefresh` or `updatedAt` alongside the publication date (e.g., "Updated on [Date]").

---

## Verification
- Test printing a page to ensure only content is rendered.
- Ensure the floating contact button doesn't overlap the Back to Top or Mobile Bottom Nav.
- Ensure Sonner toasts render properly with the dark brutalist aesthetic.
