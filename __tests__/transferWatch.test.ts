import { describe, it, expect } from "vitest";
import {
  buildTransferWatchId,
  buildTransferDossierSlug,
  matchesTransferDossierSlug,
  getTransferTierLabel,
  normalizeTransferWatchEntry,
  formatTransferWatchAmount,
  matchesTransferClub,
} from "../src/app/lib/transferWatch";

describe("transferWatch utilities", () => {
  describe("buildTransferWatchId", () => {
    it("creates a consistent ID from player, club, and date", () => {
      const id = buildTransferWatchId("Jude Bellingham", "Real Madrid", "2023-06-01T12:00:00Z");
      expect(id).toBe("jude-bellingham-real-madrid-20230601120000");
    });

    it("handles special characters in names", () => {
      const id = buildTransferWatchId("Kylian Mbappé", "Paris SG!", "2024-01-01T00:00:00Z");
      expect(id).toBe("kylian-mbapp-paris-sg-20240101000000");
    });
  });

  describe("buildTransferDossierSlug", () => {
    it("creates a slug for a dossier", () => {
      const slug = buildTransferDossierSlug({ player: "Jude Bellingham", club: "Real Madrid" });
      expect(slug).toBe("jude-bellingham-to-real-madrid");
    });
  });

  describe("matchesTransferDossierSlug", () => {
    it("matches entry against a correct slug", () => {
      const entry = { player: "Declan Rice", club: "Arsenal" };
      expect(matchesTransferDossierSlug(entry, "declan-rice-to-arsenal")).toBe(true);
      expect(matchesTransferDossierSlug(entry, "declan-rice-to-chelsea")).toBe(false);
    });
  });

  describe("getTransferTierLabel", () => {
    it("returns 'Confirmed' for confirmed status regardless of tier", () => {
      expect(getTransferTierLabel(1, "confirmed")).toBe("Confirmed");
      expect(getTransferTierLabel(null, "confirmed")).toBe("Confirmed");
    });

    it("returns 'Tier X' for numbered tiers", () => {
      expect(getTransferTierLabel(1)).toBe("Tier 1");
      expect(getTransferTierLabel(3)).toBe("Tier 3");
    });

    it("returns 'Tiered rumor' if tier is null and status is not confirmed", () => {
      expect(getTransferTierLabel(null)).toBe("Tiered rumor");
    });
  });

  describe("normalizeTransferWatchEntry", () => {
    it("returns null if input is missing or empty", () => {
      expect(normalizeTransferWatchEntry(null)).toBeNull();
      expect(normalizeTransferWatchEntry({})).toBeNull();
      expect(normalizeTransferWatchEntry({ player: "Messi" })).toBeNull();
    });

    it("normalizes a partial entry to a full entry", () => {
      const entry = normalizeTransferWatchEntry({
        player: "Lionel Messi",
        club: "Inter Miami",
        status: "confirmed",
        feeMode: "free",
      });

      expect(entry).not.toBeNull();
      expect(entry?.player).toBe("Lionel Messi");
      expect(entry?.club).toBe("Inter Miami");
      expect(entry?.status).toBe("confirmed");
      expect(entry?.feeMode).toBe("free");
      expect(entry?.feeMillions).toBe(0);
      expect(entry?.tier).toBeNull(); // Because status is confirmed
    });

    it("normalizes a rumor entry", () => {
      const entry = normalizeTransferWatchEntry({
        player: "Neymar",
        club: "Al Hilal",
        status: "rumor",
        tier: 2,
        feeMode: "million-eur",
        feeMillions: 90.56,
      });

      expect(entry?.tier).toBe(2);
      expect(entry?.feeMillions).toBe(90.6); // Clamped to 1 decimal
    });
  });

  describe("matchesTransferClub", () => {
    it("matches clubs ignoring case and whitespace", () => {
      const entry = { club: " Real Madrid " };
      expect(matchesTransferClub(entry as any, "real madrid")).toBe(true);
      expect(matchesTransferClub(entry as any, "Real  Madrid")).toBe(true);
      expect(matchesTransferClub(entry as any, "Barcelona")).toBe(false);
    });
  });

  describe("formatTransferWatchAmount", () => {
    it("formats free transfers", () => {
      expect(formatTransferWatchAmount({ feeMode: "free", feeMillions: 0 })).toBe("Free Transfer");
    });

    it("formats undisclosed fees", () => {
      expect(formatTransferWatchAmount({ feeMode: "not-disclosed", feeMillions: 0 })).toBe("Not disclosed");
    });

    it("formats EUR", () => {
      expect(formatTransferWatchAmount({ feeMode: "million-eur", feeMillions: 100 })).toBe("€100m");
    });

    it("formats GBP", () => {
      expect(formatTransferWatchAmount({ feeMode: "million-gbp", feeMillions: 105.5 })).toBe("£105.5m");
    });

    it("formats USD by default", () => {
      expect(formatTransferWatchAmount({ feeMode: "million-usd", feeMillions: 50 })).toBe("$50m");
    });
  });
});
