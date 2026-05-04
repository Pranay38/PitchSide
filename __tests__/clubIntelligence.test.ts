import { describe, it, expect } from "vitest";
import {
  normalizeClubIntelligence,
  calculateClubIntelligenceSummary,
  createDefaultClubIntelligence,
  getClubIntelligenceKey,
} from "../src/app/lib/clubIntelligence";

describe("clubIntelligence utilities", () => {
  describe("getClubIntelligenceKey", () => {
    it("slugifies club names", () => {
      expect(getClubIntelligenceKey("Real Madrid")).toBe("real-madrid");
      expect(getClubIntelligenceKey(" Manchester  United ")).toBe("manchester-united");
    });
  });

  describe("createDefaultClubIntelligence", () => {
    it("creates a well-formed default object", () => {
      const obj = createDefaultClubIntelligence("Arsenal");
      expect(obj.club).toBe("Arsenal");
      expect(obj.xGPer90).toBeDefined();
      expect(obj.possessionPct).toBe(50); // Default possession
      expect(obj.updatedAt).toBe("");
    });
  });

  describe("normalizeClubIntelligence", () => {
    it("handles null or undefined input with fallback", () => {
      const result = normalizeClubIntelligence(null, "Chelsea");
      expect(result.club).toBe("Chelsea");
      expect(result.xGPer90).toBe(1.4); // Default value
    });

    it("clamps values within valid ranges", () => {
      const result = normalizeClubIntelligence({
        club: "Spurs",
        xGPer90: 5.5, // max is 3
        possessionPct: 150, // max is 100
        interceptionsPer90: -5, // min is 0
      });

      expect(result.club).toBe("Spurs");
      expect(result.xGPer90).toBe(3);
      expect(result.possessionPct).toBe(100);
      expect(result.interceptionsPer90).toBe(0);
    });

    it("accepts valid input values", () => {
      const result = normalizeClubIntelligence({
        club: "Liverpool",
        xGPer90: 2.2,
        possessionPct: 62,
        interceptionsPer90: 10,
      });

      expect(result.xGPer90).toBe(2.2);
      expect(result.possessionPct).toBe(62);
      expect(result.interceptionsPer90).toBe(10);
    });
  });

  describe("calculateClubIntelligenceSummary", () => {
    it("calculates summary metrics and labels correctly for average team", () => {
      const data = createDefaultClubIntelligence("Average FC");
      const summary = calculateClubIntelligenceSummary(data);

      expect(summary.styleBars).toHaveLength(6);
      expect(summary.styleTags).toHaveLength(3);
      expect(summary.attackIndex).toBeGreaterThanOrEqual(0);
      expect(summary.attackIndex).toBeLessThanOrEqual(100);
      expect(summary.overallLabel).toBeDefined();
    });

    it("gives an elite attacking team high scores", () => {
      const elite = normalizeClubIntelligence({
        club: "Man City",
        xGPer90: 2.5, // > max threshold
        shotsOnTargetPer90: 7.0, // > max threshold
        keyPassesPer90: 18,
        progressivePassesPer90: 60,
        possessionPct: 65,
      });

      const summary = calculateClubIntelligenceSummary(elite);
      
      const goalThreat = summary.styleBars.find(b => b.label === "Goal Threat");
      expect(goalThreat?.value).toBe(100); // Because values exceed the 100% threshold
      
      expect(summary.attackIndex).toBeGreaterThan(80);
      expect(summary.overallLabel).toBe("Strong");
    });

    it("gives a poor defensive team low scores", () => {
      const poor = normalizeClubIntelligence({
        club: "Poor Defending FC",
        xGAPer90: 2.5, // High expected goals against
        tacklesWonPer90: 4, // Low tackles
        interceptionsPer90: 3, // Low interceptions
      });

      const summary = calculateClubIntelligenceSummary(poor);
      
      const defensiveShield = summary.styleBars.find(b => b.label === "Defensive Shield");
      expect(defensiveShield?.value).toBeLessThan(50); // High xGA hurts defensive shield
    });
  });
});
