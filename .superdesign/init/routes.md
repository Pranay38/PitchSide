# Routes Map

## Framework Info
- React Router v6+ with data router (`createBrowserRouter`)
- React 18

## Shared Router File
File path: `src/app/routes.tsx`

```tsx
import { createBrowserRouter, Outlet, ScrollRestoration } from "react-router";
import { HomePage } from "./pages/HomePage";
import { BlogPostPage } from "./pages/BlogPostPage";
// ... (other page imports)
import { MobileBottomNav } from "./components/MobileBottomNav";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <ScrollRestoration />
        <div className="pb-16 sm:pb-0">
          <Outlet />
        </div>
        <MobileBottomNav />
      </>
    ),
    children: [
      { index: true, Component: HomePage },
      { path: "post/:id", Component: BlogPostPage },
      { path: "about", Component: AboutPage },
      { path: "daily-fix", Component: DailyFixPage },
      { path: "topic/:slug", Component: TopicPage },
      { path: "club/:slug", Component: ClubHubPage },
      { path: "archive", Component: ArchivePage },
      { path: "saved", Component: SavedPage },
      { path: "alerts", Component: AlertsPage },
      { path: "transfers", Component: TransferReliabilityPage },
      { path: "transfers/:slug", Component: TransferDossierPage },
      { path: "transfer-tracker", Component: TransferTrackerPage },
      { path: "stories", Component: StoriesPage },
      { path: "stories/:slug", Component: StoryPage },
      { path: "tactics", Component: TacticalBoardPage },
      { path: "tactics/embed/:id", Component: TacticalEmbedPage },
      { path: "match-center/embed/:id", Component: MatchCenterEmbedPage },
      { path: "match-center/:id", Component: MatchCenterPage },
      { path: "collections", Component: CollectionsPage },
      { path: "debates", Component: DebateCornerPage },
      { path: "profile", Component: ProfilePage },
      { path: "pitchside-manage-x7k9", Component: AdminPage },
      { path: ":league/:club/:season", Component: LeagueClubSeasonPage },
      { path: ":league/:club", Component: LeagueClubSeasonPage },
      { path: ":league", Component: LeagueClubSeasonPage }
    ],
  },
]);
```

## Key Pages
- **HomePage** (`/`): Shows the main news grid, hero stories, latest analysis, and live transfer ticker.
- **BlogPostPage** (`/post/:id`): The main article page to display longform blog posts. Includes social sharing, read progress, reaction bar.
- **ArchivePage** (`/archive`): Searchable and filterable grid of all past posts.
