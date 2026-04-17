# Architecture

## High-Level Architecture
- **Web App / Client-Server Hybrid:** The platform relies on Next.js 15, utilizing server endpoints and React components.
- **Server Routes:** Found in `server/endpoints/` and potentially `src/app/api`, utilizing a RESTful or Server Action pattern for backend-to-frontend communication.
- **State Management:** TanStack React Query handles caching and server-state synchronization on the frontend. React context is likely minimal and reserved for UI themes.

## Key Patterns
- **Centralized Error Handling:** Global error logging and UI boundaries wrap operations preventing total crashes and routing failures to single capture nodes (e.g., `Error()`).
- **CMS/Admin Portal:** Dedicated pages and tabs (`/src/app/components/admin/`) provide an internal CMS to manage widgets, transfers, title races, and general site settings.
- **Dynamic Extensibility:** Features like Tiptap extensions handle social embeds and rich text parsing natively.

## Data Flow
- Users interact with Next.js client components -> TanStack queries/mutations reach out to server endpoints -> Server checks permissions via auth tokens (NextAuth/Clerk) -> Performs logic and hits Upstash (RateLimiting/Cache) or MongoDB (Persistence) -> Responds to client.
