# Plan: Brand Updates

## Phase -1: Context Check
**Goal**: Implement the high and medium priority actions from the Brand Audit.
**Scope**: 
- Formalize logo rules and SVG generation.
- Refactor `theme.css` to use reusable CSS variables for gradients.
- Formalize Social Media / OG image templates in `server/endpoints/og.ts`.

## Phase 0: Socratic Gate (Questions for User)
Before we execute this plan, I need clarification on a few things:
1. **Logo SVG**: I am an AI and cannot perfectly trace your `logo.png` into a high-fidelity SVG. Do you already have an SVG version I can add to the project, or should I write a script that generates a clean text-based SVG logo (using Space Grotesk) as a placeholder?
2. **OG Image Templates**: I see you have `server/endpoints/og.ts`. I plan to update this to strictly use **Space Grotesk** for titles, **Pitch Green** (`#16A34A`) for accents, and a dark glassmorphism background. Does this sound good, or do you have a different layout in mind for Twitter/X previews?
3. **Gradient Refactoring**: I will extract the hardcoded `radial-gradient` and `linear-gradient` values in `theme.css` into variables like `--gradient-atmosphere-dark`. Should I apply these globally to the body, or keep them as utility classes?

## Phase 1: Planning & Architecture

### 1. CSS Refactoring (`src/styles/theme.css`)
- Extract `linear-gradient` and `radial-gradient` values from `.page-atmosphere`, `.editorial-hero`, etc.
- Define `--gradient-atmosphere`, `--gradient-hero`, `--gradient-surface` in both `:root` and `.dark`.
- Update the utility classes to use these variables.

### 2. OG Image Formalization (`server/endpoints/og.ts`)
- Update the HTML/CSS template inside the ImageResponse to match the Brand Guidelines.
- Ensure the primary font (Space Grotesk) is loaded and used.
- Add the formal Pitch Green accent line.

### 3. Logo Documentation
- Add a specific section to the codebase (or update the Brand Guidelines) strictly outlining clear space (25%), minimum size (32px), and allowed colors for the logo.

## Phase 2: Execution Tasks
- [ ] Modify `src/styles/theme.css`
- [ ] Modify `server/endpoints/og.ts`
- [ ] Update logo documentation / Add SVG

## Phase 3: Verification
- [ ] Run `tsc` and `vitest` to ensure no build breaks.
- [ ] Manually check a blog post URL to ensure the OG image endpoint generates the new design correctly.
