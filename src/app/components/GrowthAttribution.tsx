"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureCampaign } from "../lib/campaignAttribution";
import { beginGrowthVisit } from "../hooks/useNewsletterTracking";

export function GrowthAttribution() {
  const path = usePathname() || "/";
  const search = useSearchParams();
  useEffect(() => { beginGrowthVisit(path); captureCampaign(); }, [path, search]);
  return null;
}
