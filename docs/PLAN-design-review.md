# Design Review Plan

## Overview
Perform a comprehensive design review of the Football Blog Platform MVP. The goal is to ensure the entire UI strictly adheres to the "Tactical Elegance" brutalist aesthetic that supports the new aggressive, "Weaponized Ball Knowledge" content strategy.

## Project Type
WEB

## Success Criteria
- All generic or "template-like" UI components are identified and replaced.
- Typography and color schemes reflect the premium, intense editorial brand.
- Mobile layout is optimized for reading long-form tactical breakdowns.
- The email capture funnel is visually integrated and prominent without breaking layout flow.

## Tech Stack
- Next.js (React)
- Tailwind CSS v4
- Lucide React (Icons)

## File Structure
- `src/app/layout.tsx` (Global styles and providers)
- `src/app/pages/HomePage.tsx` (Main feed design)
- `src/app/components/` (UI Elements: InlineNewsletterCard, InnerCircleModal, etc.)

## Task Breakdown

### Task 1: Typography & Color Audit
- **task_id**: 1
- **name**: Audit Global Aesthetics
- **agent**: `frontend-specialist`
- **skills**: `frontend-design`, `tailwind-patterns`
- **priority**: P0
- **dependencies**: None
- **INPUT**: Current Tailwind configuration and global CSS.
- **OUTPUT**: A list of required changes to enforce the brutalist/premium editorial theme.
- **VERIFY**: No default/generic colors (e.g., standard Tailwind blue/red) remain; typography feels authoritative.

### Task 2: Component Consistency Review
- **task_id**: 2
- **name**: Refine Core UI Components
- **agent**: `frontend-specialist`
- **skills**: `frontend-design`
- **priority**: P1
- **dependencies**: Task 1
- **INPUT**: Existing blog cards, headers, and footer components.
- **OUTPUT**: Updated component files with consistent spacing, borders, and hover states.
- **VERIFY**: The site must not look like a standard template. It must look like an elite tactical magazine.

### Task 3: Mobile Experience Optimization
- **task_id**: 3
- **name**: Mobile Reading Experience
- **agent**: `frontend-specialist`
- **skills**: `frontend-design`
- **priority**: P1
- **dependencies**: Task 2
- **INPUT**: `HomePage.tsx` and article reading views on mobile viewports.
- **OUTPUT**: Adjusted padding, font sizes, and sticky elements for mobile devices.
- **VERIFY**: The layout must be highly readable on 9:16 screens, with the email capture visible.

## Phase X: Verification
- [ ] Run `ux_audit.py` (if available) to verify UX laws (Fitts, Hick).
- [ ] Manual visual inspection: Ensure no "purple/violet" colors are used (Purple Ban).
- [ ] Lighthouse Audit: Ensure design changes do not negatively impact performance or accessibility scores.
