export interface StoryMetric {
  label: string;
  value: string;
  hint?: string;
}

export interface StoryBar {
  label: string;
  value: number;
}

export interface StoryChapterImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface StoryChapterVisual {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryValue: string;
  primaryLabel: string;
  bars: StoryBar[];
}

export interface StoryChapter {
  id: string;
  kicker: string;
  title: string;
  body: string[];
  takeaway?: string;
  pullQuote?: string;
  image?: StoryChapterImage;
  metrics?: StoryMetric[];
  visual?: StoryChapterVisual;
}

export interface StoryFeature {
  id: string;
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  excerpt: string;
  readTime: string;
  date: string;
  coverImage: string;
  themeFrom: string;
  themeTo: string;
  isDraft: boolean;
  publishedAt?: string;
  updatedAt: string;
  highlights?: string[];
  chapters: StoryChapter[];
  reactions?: {
    fire: number;
    mindblown: number;
    thumbsdown: number;
    target: number;
    cold: number;
  };
  audioUrl?: string;
}

export type StoryTemplateId =
  | "timeline"
  | "tactical-breakdown"
  | "transfer-saga"
  | "season-recap";

export interface StoryTemplateDefinition {
  id: StoryTemplateId;
  name: string;
  description: string;
  accent: string;
  story: Omit<StoryFeature, "id" | "slug" | "date" | "updatedAt" | "isDraft">;
}

export const storyFeatures: StoryFeature[] = [
  {
    id: "title-race-pendulum",
    slug: "title-race-pendulum",
    eyebrow: "Scrollytelling",
    title: "The Title Race Pendulum",
    subtitle: "Why control keeps swinging between Arsenal, Liverpool, and Manchester City",
    excerpt:
      "A chapter-by-chapter scroll through the margins, pressure points, and fixture squeezes that are making this Premier League title race feel unstable every three days.",
    readTime: "8 min scroll",
    date: "March 11, 2026",
    coverImage:
      "https://images.unsplash.com/photo-1577223625816-7546f13df25d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400",
    themeFrom: "#0F172A",
    themeTo: "#16A34A",
    isDraft: false,
    updatedAt: "2026-03-11T00:00:00.000Z",
    highlights: ["Fixture pressure", "Bench leverage", "Pressing drop-off", "Final five-game swing"],
    chapters: [
      {
        id: "swing-one",
        kicker: "Chapter 1",
        title: "One weekend changes the mood",
        body: [
          "This race has stopped behaving like a steady accumulation of points. It now turns on single weekends that completely rewrite the emotional table.",
          "A narrow away draw, a late recovery win, or one sloppy concession is enough to hand narrative control to a different club before the numbers have really moved.",
          "That is why the title race feels tighter than the gap alone suggests: the table margin is small, but the mood margin is even smaller.",
        ],
        takeaway: "In this run-in, momentum is a public illusion. The actual gap stays thin even when the mood swings hard.",
        pullQuote: "The table is close. The emotion is even closer.",
        image: {
          src: "https://images.unsplash.com/photo-1508098682722-e99c643e7485?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400",
          alt: "Crowded football stadium before kickoff",
          caption: "One result now changes the emotional temperature of the whole race.",
        },
        metrics: [
          { label: "Gap at the top", value: "2 pts", hint: "small enough for one result to flip the tone" },
          { label: "Contenders", value: "3", hint: "all live, all flawed" },
          { label: "Narrative reset", value: "48 hrs", hint: "how fast the public picture changes" },
        ],
        visual: {
          eyebrow: "Volatility",
          headline: "Every weekend is now a regime change",
          subheadline: "The points gap is narrow enough that one wobble becomes a leadership story.",
          primaryValue: "2 pts",
          primaryLabel: "Current separation",
          bars: [
            { label: "Table gap", value: 28 },
            { label: "Mood swing", value: 84 },
            { label: "Title certainty", value: 36 },
          ],
        },
      },
      {
        id: "fixture-compression",
        kicker: "Chapter 2",
        title: "The schedule is squeezing the truth out",
        body: [
          "The closer the calendar gets, the less recovery each side has between high-consequence matches. Tactical ideals start to bend around physical limits.",
          "When the same core eleven has to defend a lead on short rest, the last twenty minutes stop being about identity and start being about survival.",
          "That matters because the title is not being decided only by who plays best. It is being decided by who looks least compromised under compression.",
        ],
        takeaway: "Fixture pressure is the hidden table. The team carrying less fatigue may look calmer even before kickoff.",
        image: {
          src: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400",
          alt: "Football match under stadium floodlights",
          caption: "Compressed schedules force teams to trade ideal execution for survival.",
        },
        metrics: [
          { label: "Critical window", value: "11 days", hint: "where most of the pressure clusters" },
          { label: "High-stakes games", value: "4", hint: "league rhythm gets distorted here" },
          { label: "Recovery margin", value: "Low", hint: "rotation quality becomes decisive" },
        ],
        visual: {
          eyebrow: "Compression",
          headline: "The race is no longer played weekly",
          subheadline: "It is played in stacked bursts where freshness becomes tactical leverage.",
          primaryValue: "11 days",
          primaryLabel: "Pressure cluster",
          bars: [
            { label: "Freshness edge", value: 41 },
            { label: "Rotation need", value: 78 },
            { label: "Late-game risk", value: 69 },
          ],
        },
      },
      {
        id: "pressing-tax",
        kicker: "Chapter 3",
        title: "The pressing tax arrives late in the season",
        body: [
          "The best versions of these teams rely on suffocating starts, aggressive territory, and fast regains. But over a title run-in, pressing intensity becomes expensive.",
          "Once that edge drops even slightly, the game state changes. Midfields defend larger spaces, full-backs stop arriving as early, and matches become more coin-flip than control.",
          "That does not mean the systems fail. It means they become more fragile at exactly the wrong moment.",
        ],
        takeaway: "A small decline in intensity can produce a much bigger decline in control.",
        metrics: [
          { label: "Pressing drop", value: "Small", hint: "but strategically expensive" },
          { label: "Space to defend", value: "Higher", hint: "once first contacts are late" },
          { label: "Control loss", value: "Sharp", hint: "especially after the hour mark" },
        ],
        visual: {
          eyebrow: "Intensity",
          headline: "The first dip is rarely visible. The second one costs points.",
          subheadline: "Title races expose exactly when a team stops arriving half a second early.",
          primaryValue: "60-75'",
          primaryLabel: "Most fragile phase",
          bars: [
            { label: "Pressing bite", value: 72 },
            { label: "Transition exposure", value: 67 },
            { label: "Game-state volatility", value: 75 },
          ],
        },
      },
      {
        id: "bench-margin",
        kicker: "Chapter 4",
        title: "The bench is now part of the title equation",
        body: [
          "At this stage, the starting eleven only tells half the story. The question is whether a team can change a game after minute sixty without lowering the floor.",
          "The clubs still alive in the race all have match-winners. The difference is whether the bench can protect a lead, lift the press again, or turn a flat spell back into pressure.",
          "That is why depth is not just about injury cover. It is about whether the manager can keep the race moving at the same speed from the sideline.",
        ],
        takeaway: "The strongest bench is not only about stars. It is about preserving structure when the legs go.",
        metrics: [
          { label: "Bench impact", value: "Massive", hint: "final third and final 30 minutes" },
          { label: "Game-state flips", value: "Late", hint: "substitutions now shape outcomes" },
          { label: "Structural cost", value: "Low wins", hint: "best teams keep their shape after changes" },
        ],
        visual: {
          eyebrow: "Depth",
          headline: "This race may be won by the twelfth player",
          subheadline: "The team that stays structurally intact after substitutions buys itself calmer endings.",
          primaryValue: "+30'",
          primaryLabel: "Bench influence zone",
          bars: [
            { label: "Substitute punch", value: 80 },
            { label: "Shape retention", value: 71 },
            { label: "Late leverage", value: 77 },
          ],
        },
      },
      {
        id: "final-turn",
        kicker: "Chapter 5",
        title: "The last five games are less about style than nerve",
        body: [
          "Long before the title is mathematically settled, the final stretch turns into a test of nerve management. The cleanest tactical plan in the league still has to survive scoreboard stress.",
          "That is why calm matters so much. Teams that treat the run-in like a normal sequence of games keep their shape longer, panic later, and usually concede fewer transitional moments.",
          "The winner may still be the best side. But over the final five, the champion is often the team that looks most emotionally ordinary under extraordinary stakes.",
        ],
        takeaway: "The title is likely to go to the team whose pressure looks the most boring from the outside.",
        metrics: [
          { label: "Final sprint", value: "5 games", hint: "where every mistake becomes historic" },
          { label: "Emotional control", value: "Critical", hint: "panic costs more now" },
          { label: "Likely margin", value: "Tiny", hint: "this should stay alive deep into the run-in" },
        ],
        visual: {
          eyebrow: "Endgame",
          headline: "Ordinary composure becomes elite value",
          subheadline: "The final turn rarely rewards the loudest side. It rewards the calmest one.",
          primaryValue: "5",
          primaryLabel: "Games that decide it",
          bars: [
            { label: "Tactical clarity", value: 74 },
            { label: "Emotional control", value: 82 },
            { label: "Margin for error", value: 18 },
          ],
        },
      },
    ],
  },
];

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function formatStoryDate(date = new Date()): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function slugifyStoryValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function createEmptyStoryMetric() {
  return {
    label: "Metric",
    value: "0",
    hint: "",
  };
}

export function createEmptyStoryBar(): StoryBar {
  return {
    label: "Signal",
    value: 50,
  };
}

export function createEmptyStoryImage(): StoryChapterImage {
  return {
    src: "",
    alt: "",
    caption: "",
  };
}

export function createEmptyStoryChapter(): StoryChapter {
  return {
    id: createId("chapter"),
    kicker: "Chapter",
    title: "New Chapter",
    body: ["Write this chapter here."],
    pullQuote: "",
    image: createEmptyStoryImage(),
  };
}

export function createEmptyStoryFeature(): StoryFeature {
  const now = new Date();
  const slug = `story-${Date.now().toString(36)}`;
  return {
    id: createId("story"),
    slug,
    eyebrow: "Scrollytelling",
    title: "New Story",
    subtitle: "Add a sharp subtitle for this longform piece",
    excerpt: "Summarize the story in one paragraph for the landing page and SEO.",
    readTime: "8 min scroll",
    date: formatStoryDate(now),
    coverImage: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200",
    themeFrom: "#0F172A",
    themeTo: "#16A34A",
    isDraft: true,
    updatedAt: now.toISOString(),
    chapters: [createEmptyStoryChapter()],
  };
}

export const storyTemplates: StoryTemplateDefinition[] = [
  {
    id: "timeline",
    name: "Timeline",
    description: "Best for title races, managerial arcs, injury crises, and step-by-step season swings.",
    accent: "#16A34A",
    story: {
      eyebrow: "Timeline Story",
      title: "How The Story Turned",
      subtitle: "A scroll-driven timeline through the key swings that changed the season",
      excerpt: "Track the turning points, pressure spikes, and narrative flips that shaped this football story.",
      readTime: "7 min scroll",
      coverImage: "https://images.unsplash.com/photo-1518604666860-9ed391f76460?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400",
      themeFrom: "#0F172A",
      themeTo: "#16A34A",
      chapters: [
        {
          id: createId("chapter"),
          kicker: "Phase 1",
          title: "The calm before the turn",
          body: [
            "Open with the baseline. Explain what the situation looked like before the story accelerated.",
            "Use this section to frame the expectations, assumptions, and mood at the start of the timeline.",
          ],
          pullQuote: "Every timeline story needs a stable starting point before the drama lands.",
          image: createEmptyStoryImage(),
        },
        {
          id: createId("chapter"),
          kicker: "Phase 2",
          title: "The first visible swing",
          body: [
            "Describe the first event that made the story feel different.",
            "This should be where the narrative stopped being background noise and started moving the public mood.",
          ],
          image: createEmptyStoryImage(),
        },
        {
          id: createId("chapter"),
          kicker: "Phase 3",
          title: "The pressure cluster",
          body: [
            "Show the period where events stacked and the story accelerated.",
            "Explain why this stretch mattered more than the individual moments viewed in isolation.",
          ],
          image: createEmptyStoryImage(),
        },
        {
          id: createId("chapter"),
          kicker: "Phase 4",
          title: "What the final turn now depends on",
          body: [
            "Close the timeline by explaining what determines the next stage.",
            "This should leave the reader with one forward-looking lens rather than a generic conclusion.",
          ],
          image: createEmptyStoryImage(),
        },
      ],
    },
  },
  {
    id: "tactical-breakdown",
    name: "Tactical Breakdown",
    description: "Best for formation shifts, pressing plans, player roles, and matchup explainers.",
    accent: "#0EA5E9",
    story: {
      eyebrow: "Tactical Breakdown",
      title: "Why The Match Tilted",
      subtitle: "A chapter-by-chapter tactical explainer built for scrollytelling",
      excerpt: "Break down the structure, key matchup, pressure point, and decisive tactical adjustment in one longform story.",
      readTime: "8 min scroll",
      coverImage: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400",
      themeFrom: "#082F49",
      themeTo: "#0EA5E9",
      chapters: [
        {
          id: createId("chapter"),
          kicker: "Setup",
          title: "The base structure",
          body: [
            "Explain the starting shapes and why the matchup mattered before kickoff.",
            "Clarify what each side wanted to control and which spaces were under stress immediately.",
          ],
          image: createEmptyStoryImage(),
        },
        {
          id: createId("chapter"),
          kicker: "Pattern",
          title: "Where the first advantage appeared",
          body: [
            "Identify the repeatable pattern that created control: overloads, pressing triggers, or release points.",
            "Keep this section concrete. The reader should be able to picture the repeated action.",
          ],
          image: createEmptyStoryImage(),
        },
        {
          id: createId("chapter"),
          kicker: "Adjustment",
          title: "The response and counter-response",
          body: [
            "Explain how the opponent tried to correct the issue and whether that response solved the real problem.",
            "This is where you show whether the tactical battle genuinely changed or just moved shape.",
          ],
          image: createEmptyStoryImage(),
        },
        {
          id: createId("chapter"),
          kicker: "Decider",
          title: "Why the match finally tilted",
          body: [
            "Close by connecting the tactical pattern to the decisive phase of the game.",
            "Make the final insight feel inevitable based on the chapters before it.",
          ],
          image: createEmptyStoryImage(),
        },
      ],
    },
  },
  {
    id: "transfer-saga",
    name: "Transfer Saga",
    description: "Best for saga timelines, market context, fit analysis, and rumor-to-confirmed stories.",
    accent: "#F59E0B",
    story: {
      eyebrow: "Transfer Saga",
      title: "Inside The Transfer Chase",
      subtitle: "Follow the rumor, fit, leverage, and final turn of a market story",
      excerpt: "Build a transfer longform that moves from first link to final verdict without becoming a rumor dump.",
      readTime: "7 min scroll",
      coverImage: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400",
      themeFrom: "#78350F",
      themeTo: "#F59E0B",
      chapters: [
        {
          id: createId("chapter"),
          kicker: "Opening Link",
          title: "Why this move entered the market",
          body: [
            "Set the transfer scene. Why did this name start circulating, and why did this club need the profile now?",
            "Anchor the rumor in actual squad logic so the story starts with purpose.",
          ],
          image: createEmptyStoryImage(),
        },
        {
          id: createId("chapter"),
          kicker: "Player Fit",
          title: "How the player actually fits",
          body: [
            "Explain role, style, and tactical compatibility rather than generic talent talk.",
            "If the fit is weak, say so directly. The story should earn credibility here.",
          ],
          image: createEmptyStoryImage(),
        },
        {
          id: createId("chapter"),
          kicker: "Negotiation",
          title: "Where the deal gets difficult",
          body: [
            "Map the leverage: price, selling club stance, deadline pressure, or competing interest.",
            "This chapter should explain why a logical move still becomes hard to complete.",
          ],
          image: createEmptyStoryImage(),
        },
        {
          id: createId("chapter"),
          kicker: "Verdict",
          title: "What the move now looks like",
          body: [
            "Close with the most honest state of the move: likely, unlikely, overpriced, or smart if the terms change.",
            "This chapter should leave the reader with a strong final read rather than a vague maybe.",
          ],
          image: createEmptyStoryImage(),
        },
      ],
    },
  },
  {
    id: "season-recap",
    name: "Season Recap",
    description: "Best for club season verdicts, campaign autopsies, and year-in-review stories.",
    accent: "#8B5CF6",
    story: {
      eyebrow: "Season Recap",
      title: "How The Season Really Went",
      subtitle: "A longform review of the highs, breaks, corrections, and lasting lessons",
      excerpt: "Turn a season review into a scroll-driven story built around phases, not a generic month-by-month list.",
      readTime: "9 min scroll",
      coverImage: "https://images.unsplash.com/photo-1508098682722-e99c643e7485?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400",
      themeFrom: "#312E81",
      themeTo: "#8B5CF6",
      chapters: [
        {
          id: createId("chapter"),
          kicker: "Expectation",
          title: "What the season was supposed to be",
          body: [
            "Set expectations and internal targets before you judge the campaign.",
            "This chapter should define the lens through which the season deserves to be viewed.",
          ],
          image: createEmptyStoryImage(),
        },
        {
          id: createId("chapter"),
          kicker: "Peak",
          title: "When it actually looked convincing",
          body: [
            "Identify the phase where the team genuinely looked like its best self.",
            "The point is to preserve what was real, not just list flattering results.",
          ],
          image: createEmptyStoryImage(),
        },
        {
          id: createId("chapter"),
          kicker: "Break",
          title: "Where the campaign started to crack",
          body: [
            "Explain the part of the season where the structure bent: injuries, schedule, bad planning, or tactical ceilings.",
            "This should be the chapter that turns the recap from flattering to honest.",
          ],
          image: createEmptyStoryImage(),
        },
        {
          id: createId("chapter"),
          kicker: "Verdict",
          title: "What the season leaves behind",
          body: [
            "Finish with the lasting lesson: what should carry forward, and what must be reworked before next season.",
            "End with a verdict that combines performance, trajectory, and realism.",
          ],
          image: createEmptyStoryImage(),
        },
      ],
    },
  },
];

export function createStoryFromTemplate(templateId: StoryTemplateId): StoryFeature {
  const template = storyTemplates.find((item) => item.id === templateId);
  if (!template) {
    return createEmptyStoryFeature();
  }

  const now = new Date();
  const slugBase = slugifyStoryValue(template.story.title) || `story-${Date.now().toString(36)}`;

  return {
    ...template.story,
    id: createId("story"),
    slug: `${slugBase}-${Date.now().toString(36).slice(-4)}`,
    isDraft: true,
    date: formatStoryDate(now),
    updatedAt: now.toISOString(),
    chapters: template.story.chapters.map((chapter) => ({
      ...chapter,
      id: createId("chapter"),
      body: [...chapter.body],
      image: chapter.image ? { ...chapter.image } : createEmptyStoryImage(),
    })),
  };
}

export function duplicateStoryFeature(source: StoryFeature): StoryFeature {
  const now = new Date();
  const duplicatedSlugBase = slugifyStoryValue(`${source.slug || source.title}-copy`) || `story-${Date.now().toString(36)}`;

  return {
    ...structuredClone(source),
    publishedAt: undefined,
    id: createId("story"),
    slug: `${duplicatedSlugBase}-${Date.now().toString(36).slice(-4)}`,
    title: `${source.title} (Copy)`,
    date: formatStoryDate(now),
    isDraft: true,
    updatedAt: now.toISOString(),
    chapters: source.chapters.map((chapter) => ({
      ...chapter,
      id: createId("chapter"),
      image: chapter.image ? { ...chapter.image } : createEmptyStoryImage(),
    })),
  };
}

export function getAllStories(): StoryFeature[] {
  return storyFeatures;
}

export function getStoryBySlug(slug: string): StoryFeature | undefined {
  return storyFeatures.find((story) => story.slug === slug);
}
