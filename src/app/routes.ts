import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { BlogPostPage } from "./pages/BlogPostPage";
import { AdminPage } from "./pages/AdminPage";

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
    path: "/pitchside-manage-x7k9",
    Component: AdminPage,
  },
]);
