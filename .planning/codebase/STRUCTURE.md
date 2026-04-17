# Structure

## Root Level
- `package.json` / `tsconfig.json`: Project configuration.
- `src/`: Main frontend and Next.js app router setup.
- `server/`: Backend scripts, db connection helpers, mailers, and API endpoint implementations.
- `scripts/`: Project scripts (e.g., Playwright requirements).

## `/src` Directory
- `app/`: Next.js 15 application router directory (pages, layouts, error boundaries).
  - `components/`: UI components (widgets, CMS components, generic UI).
    - `admin/`: Specifically meant for the administrative portal.
    - `extensions/`: Tiptap or similar extensions.
  - `lib/`: Shared utilities, types, site settings storage, constants.
  - `pages/`: Individual pages (e.g., `AdminPage.tsx`, `TacticalBoardPage.tsx`, `LeaderboardPage.tsx`).
  - `styles/`: Global stylesheets (Tailwind imports).

## `/server` Directory
- `data/`: Seed data or data models.
- `endpoints/`: RESTful or internal API endpoint logic (e.g., `settings.ts`, `polls.ts`, `transfers.ts`).
- `lib/`: Backend-specific utilities (rate limiting, generic helpers).
- `utils/`: DB, auth, security tooling.
- `scripts/`: Task-running scripts for backend jobs.
