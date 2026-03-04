import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { BlogPostPage } from "./pages/BlogPostPage";
import { AdminPage } from "./pages/AdminPage";
import { AboutPage } from "./pages/AboutPage";
import { MatchPage } from "./pages/MatchPage";
import { TacticalBoardPage } from "./pages/TacticalBoardPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/post/:id",
    Component: BlogPostPage,
  },
  {
    path: "/about",
    Component: AboutPage,
  },
  {
    path: "/match",
    Component: MatchPage,
  },
  {
    path: "/tactics",
    Component: TacticalBoardPage,
  },
  {
    path: "/pitchside-manage-x7k9",
    Component: AdminPage,
  },
]);
