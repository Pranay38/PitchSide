export interface WeeklyRoundupItem {
  label: string;
  title: string;
  body: string;
}

export interface WeeklyRoundup {
  enabled: boolean;
  weekLabel: string;
  headline: string;
  intro: string;
  items: WeeklyRoundupItem[];
  updatedAt: string;
}

export const defaultWeeklyRoundup: WeeklyRoundup = {
  enabled: false,
  weekLabel: "This week in football",
  headline: "The week that was",
  intro: "Four moments that shaped the football conversation this week.",
  items: [
    { label: "BIGGEST TRANSFER", title: "The deal that moved the market", body: "Add the signing, the fee, and why it matters." },
    { label: "BEST PERFORMANCE", title: "The player who owned the weekend", body: "Add the match, standout numbers, and defining moment." },
    { label: "TACTICAL TALKING POINT", title: "The pattern worth watching", body: "Explain the adjustment, system, or trend in plain English." },
    { label: "THE HOT TAKE", title: "A call worth arguing about", body: "Finish with a sharp opinion your audience can react to." },
  ],
  updatedAt: "",
};

export function normalizeWeeklyRoundup(input?: Partial<WeeklyRoundup> | null): WeeklyRoundup {
  const defaultItems = defaultWeeklyRoundup.items;
  const items = Array.isArray(input?.items) ? input.items.slice(0, 4).map((item, index) => ({
    label: String(item?.label || defaultItems[index]?.label || "WEEKLY NOTE").trim(),
    title: String(item?.title || "").trim(),
    body: String(item?.body || "").trim(),
  })) : defaultItems;
  while (items.length < 4) items.push(defaultItems[items.length]);
  return {
    enabled: input?.enabled ?? defaultWeeklyRoundup.enabled,
    weekLabel: String(input?.weekLabel || defaultWeeklyRoundup.weekLabel).trim(),
    headline: String(input?.headline || defaultWeeklyRoundup.headline).trim(),
    intro: String(input?.intro || defaultWeeklyRoundup.intro).trim(),
    items,
    updatedAt: String(input?.updatedAt || ""),
  };
}
