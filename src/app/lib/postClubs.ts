import { getAllClubs } from "../data/clubs";
import { canonicalClubName } from "./clubFixtures";

type ClubLabels = { club?: string; tags?: string[] };

/** Resolve explicit club labels only; article text and general topics are not club tags. */
export function getPostClubs(post: ClubLabels): string[] {
  const clubs = getAllClubs();
  const labels = [post.club || "", ...(post.tags || [])];
  return [...new Set(labels.flatMap((label) => {
    if (!label.trim()) return [];
    const club = clubs.find((entry) => canonicalClubName(entry.name) === canonicalClubName(label));
    return club ? [club.name] : [];
  }))];
}

export function postMatchesClub(post: ClubLabels, club: string): boolean {
  return getPostClubs(post).some((label) => canonicalClubName(label) === canonicalClubName(club));
}
