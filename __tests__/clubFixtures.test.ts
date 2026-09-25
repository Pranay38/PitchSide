import { describe, expect, it } from "vitest";
import {
  findClubStanding,
  getLeagueCodeForClubLeague,
  getRecentForm,
  type ClubFixture,
  type ClubStanding,
} from "../src/app/lib/clubFixtures";

function fixture(overrides: Partial<ClubFixture> = {}): ClubFixture {
  return {
    id: 1,
    utcDate: "2026-09-20T15:00:00.000Z",
    status: "FINISHED",
    homeTeam: { name: "Arsenal" },
    awayTeam: { name: "Chelsea" },
    score: { home: 2, away: 1 },
    ...overrides,
  };
}

describe("club fixture data", () => {
  it("builds form only from completed matches with final scores", () => {
    const form = getRecentForm([
      fixture(),
      fixture({ id: 2, status: "SCHEDULED", utcDate: "2026-09-23T15:00:00.000Z" }),
      fixture({ id: 3, score: { home: null, away: null }, utcDate: "2026-09-22T15:00:00.000Z" }),
    ], "Arsenal");

    expect(form).toEqual(["W"]);
  });

  it("orders the most recent results first and handles away fixtures", () => {
    const form = getRecentForm([
      fixture({ id: 1, utcDate: "2026-09-10T15:00:00.000Z", score: { home: 1, away: 0 } }),
      fixture({
        id: 2,
        utcDate: "2026-09-20T15:00:00.000Z",
        homeTeam: { name: "Liverpool" },
        awayTeam: { name: "Arsenal" },
        score: { home: 1, away: 3 },
      }),
    ], "Arsenal");

    expect(form).toEqual(["W", "W"]);
  });

  it("matches known club aliases in live standings", () => {
    const standing: ClubStanding = {
      position: 3,
      team: { name: "Paris Saint-Germain" },
      played: 6,
      won: 5,
      draw: 0,
      lost: 1,
      gf: 15,
      ga: 4,
      gd: 11,
      points: 15,
    };

    expect(findClubStanding([standing], "PSG")).toEqual(standing);
  });

  it("does not route national-team pages to a domestic league", () => {
    expect(getLeagueCodeForClubLeague("World Cup 2026")).toBe("WC");
  });
});
