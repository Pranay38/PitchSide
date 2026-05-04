import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scoreTransferReliability, buildTransferReliabilityBoard } from "../src/app/lib/transferReliability";
import type { TransferWatchEntry } from "../src/app/lib/transferWatch";

describe("transferReliability", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseEntry: TransferWatchEntry = {
    id: "test",
    player: "Test Player",
    club: "Test Club",
    status: "rumor",
    tier: 3,
    feeMode: "million-eur",
    feeMillions: 50,
    updatedAt: "2024-01-01T10:00:00Z", // 2 hours ago
  };

  describe("scoreTransferReliability", () => {
    it("gives confirmed transfers a high score (Locked)", () => {
      const entry = { ...baseEntry, status: "confirmed" as const, tier: null };
      const result = scoreTransferReliability(entry);
      
      expect(result.reliabilityLabel).toBe("Locked");
      expect(result.boardLabel).toBe("Official move");
      expect(result.reliabilityScore).toBeGreaterThanOrEqual(90);
    });

    it("gives Tier 1 rumors a Locked score", () => {
      const entry = { ...baseEntry, tier: 1 as const };
      const result = scoreTransferReliability(entry);
      
      expect(result.reliabilityLabel).toBe("Locked");
      expect(result.boardLabel).toBe("Tier 1 rumor");
      expect(result.reliabilityScore).toBeGreaterThanOrEqual(80);
    });

    it("adds points for disclosed fees", () => {
      const withFee = scoreTransferReliability({ ...baseEntry, feeMode: "million-eur" });
      const withoutFee = scoreTransferReliability({ ...baseEntry, feeMode: "not-disclosed" });
      
      expect(withFee.reliabilityScore).toBeGreaterThan(withoutFee.reliabilityScore);
    });

    it("deducts points for old rumors", () => {
      const recent = scoreTransferReliability({ ...baseEntry, updatedAt: "2024-01-01T10:00:00Z" }); // 2h ago
      const old = scoreTransferReliability({ ...baseEntry, updatedAt: "2023-12-01T10:00:00Z" }); // 1 month ago
      
      expect(recent.reliabilityScore).toBeGreaterThan(old.reliabilityScore);
    });

    it("generates correct rationale", () => {
      const result = scoreTransferReliability(baseEntry);
      
      expect(result.rationale).toHaveLength(3);
      expect(result.rationale[0]).toContain("Tier 3 rumor");
      expect(result.rationale[1]).toContain("Fee is already mentioned");
      expect(result.rationale[2]).toContain("Updated recently");
    });
  });

  describe("buildTransferReliabilityBoard", () => {
    it("sorts entries by reliability score descending", () => {
      const entries: TransferWatchEntry[] = [
        { ...baseEntry, id: "1", tier: 4 }, // Lower score
        { ...baseEntry, id: "2", status: "confirmed", tier: null }, // Highest score
        { ...baseEntry, id: "3", tier: 1 }, // High score
      ];

      const board = buildTransferReliabilityBoard(entries);

      expect(board).toHaveLength(3);
      expect(board[0].id).toBe("2");
      expect(board[1].id).toBe("3");
      expect(board[2].id).toBe("1");
    });
  });
});
