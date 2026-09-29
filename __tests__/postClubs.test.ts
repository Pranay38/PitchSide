import { describe, expect, it } from "vitest";
import { getPostClubs, postMatchesClub } from "../src/app/lib/postClubs";

describe("article club labels", () => {
  it("includes every tagged club without a two-club limit", () => {
    const post = { club: "Arsenal", tags: ["Chelsea", "Liverpool", "Tactics"] };
    expect(getPostClubs(post)).toEqual(["Arsenal", "Chelsea", "Liverpool"]);
    for (const club of ["Arsenal", "Chelsea", "Liverpool"]) {
      expect(postMatchesClub(post, club)).toBe(true);
    }
    expect(postMatchesClub(post, "Barcelona")).toBe(false);
  });

  it("canonicalizes aliases and deduplicates club labels", () => {
    expect(getPostClubs({ club: "Man City", tags: ["Manchester City", "man-city", "SPURS"] }))
      .toEqual(["Manchester City", "Tottenham Hotspur"]);
    expect(postMatchesClub({ club: "Arsenal", tags: ["Man Utd"] }, "manchester-united")).toBe(true);
  });

  it("does not interpret topics or partial names as club labels", () => {
    expect(getPostClubs({ club: "General", tags: ["Tactics", "Manchester", "Arsenal analysis"] })).toEqual([]);
    expect(getPostClubs({})).toEqual([]);
  });
});
