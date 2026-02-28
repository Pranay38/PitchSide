import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { BlogPostPage } from "./pages/BlogPostPage";
import { AdminPage } from "./pages/AdminPage";
import { ComparePage } from "./pages/ComparePage";

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
    path: "/compare",
    Component: ComparePage,
  },
  {
    path: "/pitchside-manage-x7k9",
    Component: AdminPage,
  },
]);
