import { createBrowserRouter, Outlet, ScrollRestoration } from "react-router";
import { HomePage } from "./pages/HomePage";
import { BlogPostPage } from "./pages/BlogPostPage";
import { AdminPage } from "./pages/AdminPage";
import { AboutPage } from "./pages/AboutPage";
import { TacticalBoardPage } from "./pages/TacticalBoardPage";
import { CollectionsPage } from "./pages/CollectionsPage";
import { DebateCornerPage } from "./pages/DebateCornerPage";
import { LeagueClubSeasonPage } from "./pages/LeagueClubSeasonPage";
import { DailyFixPage } from "./pages/DailyFixPage";
import { TopicPage } from "./pages/TopicPage";
import { SavedPage } from "./pages/SavedPage";
import { StoriesPage } from "./pages/StoriesPage";
import { StoryPage } from "./pages/StoryPage";
import { AlertsPage } from "./pages/AlertsPage";
import { TransferReliabilityPage } from "./pages/TransferReliabilityPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <ScrollRestoration />
        < Outlet />
      </>
    ),
    children: [
      {
        index: true,
        Component: HomePage,
      },
      {
        path: "post/:id",
        Component: BlogPostPage,
      },
      {
        path: "about",
        Component: AboutPage,
      },
      {
        path: "daily-fix",
        Component: DailyFixPage,
      },
            {
        path: "topic/:slug",
        Component: TopicPage,
      },
      {
        path: "saved",
        Component: SavedPage,
      },
      {
        path: "alerts",
        Component: AlertsPage,
      },
      {
        path: "transfers",
        Component: TransferReliabilityPage,
      },
      {
        path: "stories",
        Component: StoriesPage,
      },
      {
        path: "stories/:slug",
        Component: StoryPage,
      },
      {
        path: "tactics",
        Component: TacticalBoardPage,
      },
      {
        path: "collections",
        Component: CollectionsPage,
      },
      {
        path: "debates",
        Component: DebateCornerPage,
      },
      {
        path: "pitchside-manage-x7k9",
        Component: AdminPage,
      },
      // Programmatic SEO pages
      {
        path: ":league/:club/:season",
        Component: LeagueClubSeasonPage,
      },
      {
        path: ":league/:club",
        Component: LeagueClubSeasonPage,
      },
      {
        path: ":league",
        Component: LeagueClubSeasonPage,
      },
    ],
  },
]);
