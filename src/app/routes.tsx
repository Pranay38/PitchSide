import { createBrowserRouter, Outlet, ScrollRestoration } from "react-router";
import { HomePage } from "./pages/HomePage";
import { BlogPostPage } from "./pages/BlogPostPage";
import { AdminPage } from "./pages/AdminPage";
import { AboutPage } from "./pages/AboutPage";
import { TacticalBoardPage } from "./pages/TacticalBoardPage";
import { CollectionsPage } from "./pages/CollectionsPage";
import { DebateCornerPage } from "./pages/DebateCornerPage";
import { LeagueClubSeasonPage } from "./pages/LeagueClubSeasonPage";

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
