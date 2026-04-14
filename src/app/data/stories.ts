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
  takeaway: string;
  pullQuote?: string;
  image?: StoryChapterImage;
  metrics: StoryMetric[];
  visual: StoryChapterVisual;
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
  updatedAt: string;
  highlights: string[];
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
    takeaway: "Add the key takeaway from this section.",
    pullQuote: "",
    image: createEmptyStoryImage(),
    metrics: [createEmptyStoryMetric()],
    visual: {
      eyebrow: "Visual",
      headline: "Sticky visual headline",
      subheadline: "Support the chapter with one sharp sentence.",
      primaryValue: "00",
      primaryLabel: "Primary label",
      bars: [createEmptyStoryBar(), { label: "Pressure", value: 65 }, { label: "Control", value: 40 }],
    },
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
    highlights: ["Hook", "Tension", "Insight"],
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
      highlights: ["Turning points", "Narrative swings", "Momentum shifts"],
      chapters: [
        {
          id: createId("chapter"),
          kicker: "Phase 1",
          title: "The calm before the turn",
          body: [
            "Open with the baseline. Explain what the situation looked like before the story accelerated.",
            "Use this section to frame the expectations, assumptions, and mood at the start of the timeline.",
          ],
          takeaway: "Set the baseline before the swing.",
          pullQuote: "Every timeline story needs a stable starting point before the drama lands.",
          image: createEmptyStoryImage(),
          metrics: [
            { label: "Starting point", value: "Stable", hint: "How the situation felt at the beginning" },
            { label: "Pressure", value: "Low", hint: "Public urgency before the turn" },
          ],
          visual: {
            eyebrow: "Timeline Start",
            headline: "The story looked calm on the surface",
            subheadline: "This is where the reader understands what changed and why the rest matters.",
            primaryValue: "T0",
            primaryLabel: "Starting phase",
            bars: [
              { label: "Control", value: 72 },
              { label: "Pressure", value: 28 },
              { label: "Volatility", value: 34 },
            ],
          },
        },
        {
          id: createId("chapter"),
          kicker: "Phase 2",
          title: "The first visible swing",
          body: [
            "Describe the first event that made the story feel different.",
            "This should be where the narrative stopped being background noise and started moving the public mood.",
          ],
          takeaway: "Show the first moment the story became real.",
          image: createEmptyStoryImage(),
          metrics: [
            { label: "Catalyst", value: "1 result", hint: "The event that changed perception" },
            { label: "Mood change", value: "Sharp", hint: "How fast sentiment moved" },
          ],
          visual: {
            eyebrow: "First Turn",
            headline: "The first shift changed the conversation",
            subheadline: "Small table movement can create a much bigger emotional swing.",
            primaryValue: "+1",
            primaryLabel: "Catalyst moment",
            bars: [
              { label: "Narrative impact", value: 78 },
              { label: "Table impact", value: 42 },
              { label: "Emotional shift", value: 83 },
            ],
          },
        },
        {
          id: createId("chapter"),
          kicker: "Phase 3",
          title: "The pressure cluster",
          body: [
            "Show the period where events stacked and the story accelerated.",
            "Explain why this stretch mattered more than the individual moments viewed in isolation.",
          ],
          takeaway: "Compression is often the real story engine.",
          image: createEmptyStoryImage(),
          metrics: [
            { label: "Critical window", value: "7 days", hint: "Where the pressure clusters" },
            { label: "Key events", value: "3", hint: "Moments that stacked together" },
          ],
          visual: {
            eyebrow: "Compression",
            headline: "The story moved in a tight burst",
            subheadline: "This is where the reader feels why the sequence mattered more than any single beat.",
            primaryValue: "7 days",
            primaryLabel: "Pressure cluster",
            bars: [
              { label: "Intensity", value: 81 },
              { label: "Clarity", value: 64 },
              { label: "Risk", value: 76 },
            ],
          },
        },
        {
          id: createId("chapter"),
          kicker: "Phase 4",
          title: "What the final turn now depends on",
          body: [
            "Close the timeline by explaining what determines the next stage.",
            "This should leave the reader with one forward-looking lens rather than a generic conclusion.",
          ],
          takeaway: "A good timeline closes by clarifying the next hinge point.",
          image: createEmptyStoryImage(),
          metrics: [
            { label: "Next hinge", value: "Defined", hint: "What now matters most" },
            { label: "Margin for error", value: "Thin", hint: "Why the story remains live" },
          ],
          visual: {
            eyebrow: "Endgame",
            headline: "The final turn is now easy to define",
            subheadline: "Leave the reader with the exact variable that decides what happens next.",
            primaryValue: "Next",
            primaryLabel: "Hinge variable",
            bars: [
              { label: "Clarity", value: 74 },
              { label: "Tension", value: 79 },
              { label: "Closure", value: 52 },
            ],
          },
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
      highlights: ["Shape", "Key matchup", "Adjustment", "Decisive phase"],
      chapters: [
        {
          id: createId("chapter"),
          kicker: "Setup",
          title: "The base structure",
          body: [
            "Explain the starting shapes and why the matchup mattered before kickoff.",
            "Clarify what each side wanted to control and which spaces were under stress immediately.",
          ],
          takeaway: "Every tactical story starts with the map of the match.",
          image: createEmptyStoryImage(),
          metrics: [
            { label: "Shape", value: "4-3-3", hint: "Starting reference point" },
            { label: "Target zone", value: "Half-space", hint: "Primary area of attack" },
          ],
          visual: {
            eyebrow: "Structure",
            headline: "The opening shape defined the first problem",
            subheadline: "Set the board before explaining why one side started to gain leverage.",
            primaryValue: "Base",
            primaryLabel: "Starting map",
            bars: [
              { label: "Width", value: 62 },
              { label: "Compactness", value: 66 },
              { label: "Risk", value: 38 },
            ],
          },
        },
        {
          id: createId("chapter"),
          kicker: "Pattern",
          title: "Where the first advantage appeared",
          body: [
            "Identify the repeatable pattern that created control: overloads, pressing triggers, or release points.",
            "Keep this section concrete. The reader should be able to picture the repeated action.",
          ],
          takeaway: "The story turns when the same pattern starts succeeding again and again.",
          image: createEmptyStoryImage(),
          metrics: [
            { label: "Trigger", value: "Repeatable", hint: "The pattern that kept working" },
            { label: "Pressure", value: "High", hint: "Why the opponent started bending" },
          ],
          visual: {
            eyebrow: "Pattern",
            headline: "One repeatable action kept opening the game",
            subheadline: "The strongest tactical stories explain patterns, not isolated moments.",
            primaryValue: "3x",
            primaryLabel: "Repeated success",
            bars: [
              { label: "Control", value: 78 },
              { label: "Access", value: 73 },
              { label: "Opponent stress", value: 69 },
            ],
          },
        },
        {
          id: createId("chapter"),
          kicker: "Adjustment",
          title: "The response and counter-response",
          body: [
            "Explain how the opponent tried to correct the issue and whether that response solved the real problem.",
            "This is where you show whether the tactical battle genuinely changed or just moved shape.",
          ],
          takeaway: "The most revealing moment is usually the answer to the first problem.",
          image: createEmptyStoryImage(),
          metrics: [
            { label: "Adjustment", value: "Visible", hint: "The tactical response" },
            { label: "Effect", value: "Partial", hint: "Whether it actually fixed the issue" },
          ],
          visual: {
            eyebrow: "Adjustment",
            headline: "The counter changed the picture, not the root problem",
            subheadline: "Use this chapter to separate cosmetic changes from real tactical correction.",
            primaryValue: "2nd half",
            primaryLabel: "Response phase",
            bars: [
              { label: "Adaptation", value: 67 },
              { label: "Stability", value: 54 },
              { label: "Control regained", value: 49 },
            ],
          },
        },
        {
          id: createId("chapter"),
          kicker: "Decider",
          title: "Why the match finally tilted",
          body: [
            "Close by connecting the tactical pattern to the decisive phase of the game.",
            "Make the final insight feel inevitable based on the chapters before it.",
          ],
          takeaway: "The tactical conclusion should feel earned, not decorative.",
          image: createEmptyStoryImage(),
          metrics: [
            { label: "Decisive phase", value: "Late", hint: "Where the tilt became irreversible" },
            { label: "Tactical edge", value: "Clear", hint: "Why the winner deserved the flow" },
          ],
          visual: {
            eyebrow: "Tilt",
            headline: "By the end, the tactical edge was obvious",
            subheadline: "This chapter should crystallize the mechanism that actually won the game.",
            primaryValue: "Tilted",
            primaryLabel: "Final state",
            bars: [
              { label: "Control", value: 81 },
              { label: "Execution", value: 76 },
              { label: "Stress on opponent", value: 84 },
            ],
          },
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
      highlights: ["Why now", "Tactical fit", "Negotiation leverage", "Final outcome"],
      chapters: [
        {
          id: createId("chapter"),
          kicker: "Opening Link",
          title: "Why this move entered the market",
          body: [
            "Set the transfer scene. Why did this name start circulating, and why did this club need the profile now?",
            "Anchor the rumor in actual squad logic so the story starts with purpose.",
          ],
          takeaway: "A transfer story gets sharper when the need is defined first.",
          image: createEmptyStoryImage(),
          metrics: [
            { label: "Need level", value: "High", hint: "How urgent the profile is" },
            { label: "Market timing", value: "Now", hint: "Why the link surfaced" },
          ],
          visual: {
            eyebrow: "Need",
            headline: "The move made sense before the noise arrived",
            subheadline: "The first chapter should prove the link is structurally plausible.",
            primaryValue: "Fit",
            primaryLabel: "Reason it started",
            bars: [
              { label: "Squad need", value: 82 },
              { label: "Timing", value: 70 },
              { label: "Noise", value: 36 },
            ],
          },
        },
        {
          id: createId("chapter"),
          kicker: "Player Fit",
          title: "How the player actually fits",
          body: [
            "Explain role, style, and tactical compatibility rather than generic talent talk.",
            "If the fit is weak, say so directly. The story should earn credibility here.",
          ],
          takeaway: "Transfer stories become useful when they separate talent from fit.",
          image: createEmptyStoryImage(),
          metrics: [
            { label: "Role fit", value: "Strong", hint: "How naturally the player slots in" },
            { label: "Style fit", value: "Debatable", hint: "Where the tension lives" },
          ],
          visual: {
            eyebrow: "Fit",
            headline: "The player suits some needs more than others",
            subheadline: "Clarify what the signing would solve and what it would not.",
            primaryValue: "Role",
            primaryLabel: "Primary fit",
            bars: [
              { label: "Tactical fit", value: 74 },
              { label: "Squad overlap", value: 41 },
              { label: "Upgrade level", value: 68 },
            ],
          },
        },
        {
          id: createId("chapter"),
          kicker: "Negotiation",
          title: "Where the deal gets difficult",
          body: [
            "Map the leverage: price, selling club stance, deadline pressure, or competing interest.",
            "This chapter should explain why a logical move still becomes hard to complete.",
          ],
          takeaway: "Good transfer stories explain friction, not just desire.",
          image: createEmptyStoryImage(),
          metrics: [
            { label: "Leverage", value: "Seller", hint: "Who controls the pace" },
            { label: "Fee stress", value: "Real", hint: "Main obstacle to completion" },
          ],
          visual: {
            eyebrow: "Leverage",
            headline: "The hard part was never the fit. It was the terms.",
            subheadline: "Move from squad logic into market realism here.",
            primaryValue: "$",
            primaryLabel: "Deal pressure",
            bars: [
              { label: "Negotiation ease", value: 33 },
              { label: "Competition", value: 58 },
              { label: "Completion risk", value: 72 },
            ],
          },
        },
        {
          id: createId("chapter"),
          kicker: "Verdict",
          title: "What the move now looks like",
          body: [
            "Close with the most honest state of the move: likely, unlikely, overpriced, or smart if the terms change.",
            "This chapter should leave the reader with a strong final read rather than a vague maybe.",
          ],
          takeaway: "A transfer saga should end with a verdict, not a shrug.",
          image: createEmptyStoryImage(),
          metrics: [
            { label: "Current read", value: "Live", hint: "Where the move stands now" },
            { label: "Best outcome", value: "Conditional", hint: "What would make it worthwhile" },
          ],
          visual: {
            eyebrow: "Verdict",
            headline: "The move is live, but only on the right terms",
            subheadline: "Finish by separating feasibility from desirability.",
            primaryValue: "Live",
            primaryLabel: "State of play",
            bars: [
              { label: "Reliability", value: 57 },
              { label: "Fit", value: 72 },
              { label: "Value", value: 48 },
            ],
          },
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
      highlights: ["Expectation", "Peak", "Break", "What remains"],
      chapters: [
        {
          id: createId("chapter"),
          kicker: "Expectation",
          title: "What the season was supposed to be",
          body: [
            "Set expectations and internal targets before you judge the campaign.",
            "This chapter should define the lens through which the season deserves to be viewed.",
          ],
          takeaway: "You cannot evaluate a season without defining the target first.",
          image: createEmptyStoryImage(),
          metrics: [
            { label: "Expectation", value: "Top four", hint: "The original goal" },
            { label: "Context", value: "Transitional", hint: "The starting conditions" },
          ],
          visual: {
            eyebrow: "Baseline",
            headline: "The campaign started with a clear brief",
            subheadline: "Establish the expectations before the story starts judging outcomes.",
            primaryValue: "Start",
            primaryLabel: "Season brief",
            bars: [
              { label: "Expectation", value: 76 },
              { label: "Stability", value: 54 },
              { label: "Margin for error", value: 43 },
            ],
          },
        },
        {
          id: createId("chapter"),
          kicker: "Peak",
          title: "When it actually looked convincing",
          body: [
            "Identify the phase where the team genuinely looked like its best self.",
            "The point is to preserve what was real, not just list flattering results.",
          ],
          takeaway: "Every season recap needs the phase where belief felt earned.",
          image: createEmptyStoryImage(),
          metrics: [
            { label: "Peak phase", value: "8 games", hint: "Most convincing stretch" },
            { label: "Control", value: "Real", hint: "Why the optimism was justified" },
          ],
          visual: {
            eyebrow: "Peak",
            headline: "For a while, the plan really worked",
            subheadline: "Capture the best version of the side before the season changed shape.",
            primaryValue: "Peak",
            primaryLabel: "Best stretch",
            bars: [
              { label: "Control", value: 82 },
              { label: "Belief", value: 79 },
              { label: "Sustainability", value: 58 },
            ],
          },
        },
        {
          id: createId("chapter"),
          kicker: "Break",
          title: "Where the campaign started to crack",
          body: [
            "Explain the part of the season where the structure bent: injuries, schedule, bad planning, or tactical ceilings.",
            "This should be the chapter that turns the recap from flattering to honest.",
          ],
          takeaway: "The real recap begins at the moment the season stopped cooperating.",
          image: createEmptyStoryImage(),
          metrics: [
            { label: "Stress point", value: "Visible", hint: "Where the campaign changed" },
            { label: "Recovery", value: "Incomplete", hint: "Why the fix never fully landed" },
          ],
          visual: {
            eyebrow: "Crack",
            headline: "The season stopped absorbing pressure",
            subheadline: "This is where the campaign reveals what it was actually built to survive.",
            primaryValue: "Break",
            primaryLabel: "Turning phase",
            bars: [
              { label: "Resilience", value: 39 },
              { label: "Fatigue", value: 76 },
              { label: "Control loss", value: 72 },
            ],
          },
        },
        {
          id: createId("chapter"),
          kicker: "Verdict",
          title: "What the season leaves behind",
          body: [
            "Finish with the lasting lesson: what should carry forward, and what must be reworked before next season.",
            "End with a verdict that combines performance, trajectory, and realism.",
          ],
          takeaway: "A recap is strongest when it turns the season into a forward lens.",
          image: createEmptyStoryImage(),
          metrics: [
            { label: "Final read", value: "Mixed", hint: "How the campaign should be remembered" },
            { label: "Next priority", value: "Defined", hint: "What the club must do next" },
          ],
          visual: {
            eyebrow: "Aftermath",
            headline: "The season leaves one clear instruction behind",
            subheadline: "Close with the lesson that should shape the next campaign.",
            primaryValue: "Next",
            primaryLabel: "Required move",
            bars: [
              { label: "Lessons learned", value: 84 },
              { label: "Carry-over value", value: 66 },
              { label: "Need for change", value: 71 },
            ],
          },
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
    highlights: [...template.story.highlights],
    chapters: template.story.chapters.map((chapter) => ({
      ...chapter,
      id: createId("chapter"),
      body: [...chapter.body],
      image: chapter.image ? { ...chapter.image } : createEmptyStoryImage(),
      metrics: chapter.metrics.map((metric) => ({ ...metric })),
      visual: {
        ...chapter.visual,
        bars: chapter.visual.bars.map((bar) => ({ ...bar })),
      },
    })),
  };
}

export function duplicateStoryFeature(source: StoryFeature): StoryFeature {
  const now = new Date();
  const duplicatedSlugBase = slugifyStoryValue(`${source.slug || source.title}-copy`) || `story-${Date.now().toString(36)}`;

  return {
    ...source,
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
      metrics: chapter.metrics.map((metric) => ({ ...metric })),
      visual: {
        ...chapter.visual,
        bars: chapter.visual.bars.map((bar) => ({ ...bar })),
      },
    })),
    highlights: [...source.highlights],
  };
}

export function getAllStories(): StoryFeature[] {
  return storyFeatures;
}

export function getStoryBySlug(slug: string): StoryFeature | undefined {
  return storyFeatures.find((story) => story.slug === slug);
}
