import type { BlogPost } from "../data/posts";
import { getClubByName } from "../data/clubs";
import {
  getLiveFixturesForClub,
  getUpcomingFixturesForClub,
} from "./clubFixtures";


export interface SiteAlert {
  id: string;
  type: "club" | "player";
  kind: "article" | "fixture-live" | "fixture-upcoming";
  title: string;
  summary: string;
  href: string;
  entity: string;
  date: string;
  priority: 1 | 2 | 3;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function matchesClubPost(post: BlogPost, club: string): boolean {
  const normalizedClub = normalize(club);
  return normalize(post.club) === normalizedClub
    || post.tags.some((tag) => normalize(tag) === normalizedClub)
    || normalize(post.title).includes(normalizedClub);
}

function matchesPlayerPost(post: BlogPost, player: string): boolean {
  const normalizedPlayer = normalize(player);
  return normalize(post.playerName || "") === normalizedPlayer
    || normalize(post.title).includes(normalizedPlayer)
    || normalize(post.excerpt).includes(normalizedPlayer)
    || post.tags.some((tag) => normalize(tag) === normalizedPlayer);
}

function sortAlerts(alerts: SiteAlert[]): SiteAlert[] {
  return [...alerts].sort((left, right) => {
    if (left.priority !== right.priority) return left.priority - right.priority;
    return new Date(right.date).getTime() - new Date(left.date).getTime();
  });
}

export async function buildSiteAlerts(input: {
  followedClubs: string[];
  followedPlayers: string[];
  posts: BlogPost[];
}): Promise<SiteAlert[]> {
  const alerts = new Map<string, SiteAlert>();

  for (const club of input.followedClubs) {
    const clubData = getClubByName(club);
    if (clubData?.league) {
      try {
        const [liveFixtures, upcomingFixtures] = await Promise.all([
          getLiveFixturesForClub(club, clubData.league),
          getUpcomingFixturesForClub(club, clubData.league),
        ]);

        for (const fixture of liveFixtures.slice(0, 2)) {
          alerts.set(`fixture-live-${fixture.id}`, {
            id: `fixture-live-${fixture.id}`,
            type: "club",
            kind: "fixture-live",
            entity: club,
            title: `${club} is live right now`,
            summary: `${fixture.homeTeam.name} vs ${fixture.awayTeam.name} is currently ${fixture.status.replace(/_/g, " ").toLowerCase()}.`,
            href: "/",
            date: fixture.utcDate,
            priority: 1,
          });
        }

        for (const fixture of upcomingFixtures.slice(0, 2)) {
          const hoursUntil = Math.round((new Date(fixture.utcDate).getTime() - Date.now()) / (1000 * 60 * 60));
          if (hoursUntil > 96) continue;

          alerts.set(`fixture-upcoming-${fixture.id}`, {
            id: `fixture-upcoming-${fixture.id}`,
            type: "club",
            kind: "fixture-upcoming",
            entity: club,
            title: `${club} fixture coming up`,
            summary: `${fixture.homeTeam.name} vs ${fixture.awayTeam.name} kicks off in about ${Math.max(1, hoursUntil)} hour${Math.abs(hoursUntil) === 1 ? "" : "s"}.`,
            href: "/",
            date: fixture.utcDate,
            priority: 2,
          });
        }
      } catch {
        // Fixture alerts are best-effort only.
      }
    }

    for (const post of input.posts.filter((item) => matchesClubPost(item, club)).slice(0, 2)) {
      alerts.set(`club-post-${club}-${post.id}`, {
        id: `club-post-${club}-${post.id}`,
        type: "club",
        kind: "article",
        entity: club,
        title: `New ${club} read`,
        summary: post.title,
        href: `/post/${post.slug || post.id}`,
        date: post.date,
        priority: 3,
      });
    }
  }

  for (const player of input.followedPlayers) {
    for (const post of input.posts.filter((item) => matchesPlayerPost(item, player)).slice(0, 2)) {
      alerts.set(`player-post-${player}-${post.id}`, {
        id: `player-post-${player}-${post.id}`,
        type: "player",
        kind: "article",
        entity: player,
        title: `New ${player} story`,
        summary: post.title,
        href: `/post/${post.slug || post.id}`,
        date: post.date,
        priority: 3,
      });
    }
  }

  return sortAlerts(Array.from(alerts.values())).slice(0, 18);
}
