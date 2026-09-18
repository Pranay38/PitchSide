# Project Plan: Smooth Scrolling

## Overview
Implement a premium, magazine-like smooth scrolling experience across the website to elevate the editorial feel and match the new UI/UX design system.

## Project Type
WEB

## Success Criteria
- Smooth, momentum-based scrolling across all pages.
- No interference with native scroll accessibility.
- Optimized performance with minimal bundle impact.
- Next.js App Router compatibility.

## Tech Stack
- **Lenis (Studio Freight)**: Chosen because it's the modern standard for React/Next.js, extremely lightweight (unlike Locomotive Scroll), and maintains native scrollbar functionality.

## File Structure
- `src/app/components/SmoothScroll.tsx` (New Client Component wrapper)
- `src/app/layout.tsx` (Update to include wrapper)
- `package.json` (Add `@studio-freight/lenis`)

## Task Breakdown

### 1. Install Dependencies
- **Agent**: `frontend-specialist`
- **Skill**: `html-tailwind`
- **INPUT**: `npm i @studio-freight/lenis`
- **OUTPUT**: Updated `package.json` and `package-lock.json`
- **VERIFY**: Dependency resolves without conflict.

### 2. Create SmoothScroll Wrapper
- **Agent**: `frontend-specialist`
- **Skill**: `react`
- **INPUT**: Create client component that initializes Lenis.
- **OUTPUT**: `src/app/components/SmoothScroll.tsx`
- **VERIFY**: Component renders children and initializes `requestAnimationFrame` loop.

### 3. Integrate into Root Layout
- **Agent**: `frontend-specialist`
- **Skill**: `nextjs`
- **INPUT**: Wrap the main application layout.
- **OUTPUT**: Modified `src/app/layout.tsx`
- **VERIFY**: Application runs locally without hydration mismatch.

### 4. Fine-Tune Configuration
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **INPUT**: Set multiplier, lerp, and infinite scroll limits.
- **OUTPUT**: Adjusted parameters in wrapper.
- **VERIFY**: Scrolling feels natural ("magazine-like") and not overly floaty.

## Phase X: Verification
- [ ] Build: `npm run build`
- [ ] UX Audit: Smooth scrolling behaves correctly on touch devices (Lenis handles touch natively by disabling smooth scroll to preserve native swipe behavior).
- [ ] Performance: Verify no continuous re-renders in React Profiler.
