# Code Conventions

## Languages & Types
- **Language:** TypeScript is strictly used.
- **Types:** Interfaces or Zod schemas are used heavily to guarantee type safety at boundary layers (API endpoints, props).
- **Naming:** CamelCase for functions and variables. PascalCase for generic types, components, and classes. UPPER_SNAKE_CASE for global constants or `.env` variables.

## File Organization Requirements
- React Components must end in `.tsx`, while shared logic or hooks should end in `.ts`.
- Server logic (`server/endpoints`) must be entirely disconnected from Next.js server actions if explicitly defining RESTful responses, or must follow Next.js route handler conventions if mapped within `/app/api`.

## Styling
- **Tailwind CSS classes** dictate UI layouts.
- Component-level styling variances are encapsulated using `class-variance-authority` and `clsx`/`tailwind-merge` preventing class collisions.

## Component Structure
- Presentational logic should be isolated from data fetching wherever possible.
- Client directives (`"use client"`) must only be present when React hooks (state/effects) or browser-only APIs are strictly required.
