import { createBrowserRouter, Outlet, ScrollRestoration } from "react-router";
import { trackPageView } from "./lib/analytics";
import { lazy, Suspense } from "react";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { MobileBottomNav } from "./components/MobileBottomNav";

// Lazy-loaded below-fold pages (code-splitting)
const BlogPostPage = lazy(() => import("./pages/BlogPostPage").then(m => ({ default: m.BlogPostPage })));
const AdminPage = lazy(() => import("./pages/AdminPage").then(m => ({ default: m.AdminPage })));
const AdminGuard = lazy(() => import("./components/AdminGuard").then(m => ({ default: m.AdminGuard })));
const AboutPage = lazy(() => import("./pages/AboutPage").then(m => ({ default: m.AboutPage })));
const TacticalBoardPage = lazy(() => import("./pages/TacticalBoardPage").then(m => ({ default: m.TacticalBoardPage })));
const TacticalEmbedPage = lazy(() => import("./pages/TacticalEmbedPage").then(m => ({ default: m.TacticalEmbedPage })));
const MatchCenterEmbedPage = lazy(() => import("./pages/MatchCenterEmbedPage").then(m => ({ default: m.MatchCenterEmbedPage })));
const MatchCenterPage = lazy(() => import("./pages/MatchCenterPage").then(m => ({ default: m.MatchCenterPage })));
const CollectionsPage = lazy(() => import("./pages/CollectionsPage").then(m => ({ default: m.CollectionsPage })));
const DebateCornerPage = lazy(() => import("./pages/DebateCornerPage").then(m => ({ default: m.DebateCornerPage })));
const LeagueClubSeasonPage = lazy(() => import("./pages/LeagueClubSeasonPage").then(m => ({ default: m.LeagueClubSeasonPage })));
const DailyFixPage = lazy(() => import("./pages/DailyFixPage").then(m => ({ default: m.DailyFixPage })));
const TopicPage = lazy(() => import("./pages/TopicPage").then(m => ({ default: m.TopicPage })));
const ClubHubPage = lazy(() => import("./pages/ClubHubPage").then(m => ({ default: m.ClubHubPage })));
const ArchivePage = lazy(() => import("./pages/ArchivePage").then(m => ({ default: m.ArchivePage })));
const SavedPage = lazy(() => import("./pages/SavedPage").then(m => ({ default: m.SavedPage })));
const StoriesPage = lazy(() => import("./pages/StoriesPage").then(m => ({ default: m.StoriesPage })));
const StoryPage = lazy(() => import("./pages/StoryPage").then(m => ({ default: m.StoryPage })));
const AlertsPage = lazy(() => import("./pages/AlertsPage").then(m => ({ default: m.AlertsPage })));
const TransferReliabilityPage = lazy(() => import("./pages/TransferReliabilityPage").then(m => ({ default: m.TransferReliabilityPage })));
const TransferDossierPage = lazy(() => import("./pages/TransferDossierPage").then(m => ({ default: m.TransferDossierPage })));
const TransferTrackerPage = lazy(() => import("./pages/TransferTrackerPage").then(m => ({ default: m.TransferTrackerPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage").then(m => ({ default: m.LeaderboardPage })));
const POTSPage = lazy(() => import("./pages/POTSPage").then(m => ({ default: m.POTSPage })));
const GlossaryPage = lazy(() => import("./pages/GlossaryPage").then(m => ({ default: m.GlossaryPage })));
const SignInPage = lazy(() => import("./components/ui/login-1").then(m => ({ default: m.default })));
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";

export const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <RouteErrorBoundary />,
    element: (
      <>
        <ScrollRestoration />
        <div className="pb-16 sm:pb-0">
          <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#16A34A] border-t-transparent" /></div>}>
            <Outlet />
          </Suspense>
        </div>
        <MobileBottomNav />
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
        path: "club/:slug",
        Component: ClubHubPage,
      },
      {
        path: "archive",
        Component: ArchivePage,
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
        path: "transfers/:slug",
        Component: TransferDossierPage,
      },
      {
        path: "transfer-tracker",
        Component: TransferTrackerPage,
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
        path: "tactics/embed/:id",
        Component: TacticalEmbedPage,
      },
      {
        path: "match-center/embed/:id",
        Component: MatchCenterEmbedPage,
      },
      {
        path: "match-center/:id",
        Component: MatchCenterPage,
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
        path: "glossary",
        Component: GlossaryPage,
      },
      {
        path: "pots",
        Component: POTSPage,
      },
      {
        path: "profile",
        Component: ProfilePage,
      },
      {
        path: "pitchside-manage-x7k9",
        Component: AdminGuard,
      },
      {
        path: "sign-in/*",
        Component: SignInPage,
      },
      {
        path: "sign-up/*",
        Component: SignInPage,
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
      {
        path: "*",
        Component: NotFoundPage,
      },
    ],
  },
]);

// Track SPA page views in GA4 on every route change
router.subscribe((state) => {
  if (state.navigation.state === "idle") {
    trackPageView(state.location.pathname + state.location.search);
  }
});
