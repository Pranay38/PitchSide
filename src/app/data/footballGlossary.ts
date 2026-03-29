/**
 * Football Glossary — tactical terms with short definitions.
 * Used by the GlossaryTooltip component to annotate article content,
 * and by the /glossary page for SEO.
 */

export interface GlossaryEntry {
  term: string;
  definition: string;
  category: GlossaryCategory;
  /** Optional slug override (auto-generated from term if not provided) */
  slug?: string;
}

export type GlossaryCategory =
  | "Tactical Systems"
  | "Player Roles"
  | "Tactical Concepts"
  | "Metrics & Stats"
  | "Set Pieces & Phases"
  | "Formations";

export const GLOSSARY_CATEGORIES: GlossaryCategory[] = [
  "Tactical Systems",
  "Player Roles",
  "Tactical Concepts",
  "Formations",
  "Set Pieces & Phases",
  "Metrics & Stats",
];

export const footballGlossary: GlossaryEntry[] = [
  // ── Tactical Systems ──
  { term: "Gegenpressing", category: "Tactical Systems", definition: "Immediately counter-pressing the opponent right after losing the ball, aiming to win it back within 5 seconds. Popularised by Jürgen Klopp at Borussia Dortmund and Liverpool." },
  { term: "Tiki-Taka", category: "Tactical Systems", definition: "A possession-based style emphasising short passing, movement, and retaining the ball in tight spaces. Defined Pep Guardiola's Barcelona (2008–2012)." },
  { term: "Catenaccio", category: "Tactical Systems", definition: "An Italian defensive system focused on a sweeper (libero) behind the back line and tight man-marking. Dominant in Serie A throughout the 1960s." },
  { term: "Total Football", category: "Tactical Systems", definition: "A fluid system where any outfield player can take over any other's role, requiring all players to be comfortable in all positions. Originated at Ajax under Rinus Michels." },
  { term: "Park the Bus", category: "Tactical Systems", definition: "Dropping all players deep into a defensive block to protect a lead, sacrificing attacking intent. José Mourinho's trademark." },
  { term: "Counter-pressing", category: "Tactical Systems", definition: "Winning the ball back immediately after losing it by pressing the opponent high up the pitch. A core principle of modern high-intensity football." },
  { term: "Low Block", category: "Tactical Systems", definition: "A deep, compact defensive shape where the entire team defends close to their own goal. Effective against possession-dominant sides." },
  { term: "High Press", category: "Tactical Systems", definition: "Pressing the opponent aggressively in their own half to force turnovers near their goal. Requires enormous fitness and coordination." },
  { term: "Juego de Posición", category: "Tactical Systems", definition: "Positional play — a system where players occupy designated zones to ensure optimal spacing and passing triangles. The backbone of Pep Guardiola's philosophy." },

  // ── Player Roles ──
  { term: "False Nine", category: "Player Roles", definition: "A centre-forward who drops deep into midfield, dragging centre-backs out of position and creating space for wingers and midfielders to exploit." },
  { term: "Inverted Fullback", category: "Player Roles", definition: "A fullback who tucks inside into midfield rather than overlapping on the wing. Used by Guardiola to create midfield overloads." },
  { term: "Inverted Winger", category: "Player Roles", definition: "A winger who plays on the opposite side to their dominant foot, allowing them to cut inside and shoot. Think Robben on the right, Salah on the right." },
  { term: "Regista", category: "Player Roles", definition: "A deep-lying playmaker who dictates the tempo of the game from in front of the defence. Andrea Pirlo was the archetype." },
  { term: "Trequartista", category: "Player Roles", definition: "A creative number 10 given total freedom to roam and create chances between the midfield and attack lines. Zidane, Riquelme, Özil." },
  { term: "Sweeper-Keeper", category: "Player Roles", definition: "A goalkeeper who plays high off their line, acting as an extra outfield player to sweep up through balls. Manuel Neuer redefined the role." },
  { term: "Box-to-Box", category: "Player Roles", definition: "A midfielder who covers the full length of the pitch — defending in their own box and attacking in the opponent's. Steven Gerrard, Yaya Touré." },
  { term: "Deep-Lying Playmaker", category: "Player Roles", definition: "A midfielder positioned between the defence and midfield who starts attacks with long-range passing. Xabi Alonso, Toni Kroos." },
  { term: "Number 10", category: "Player Roles", definition: "The classic playmaker role, operating behind the striker to create and score goals. The heartbeat of the attack." },
  { term: "Targetman", category: "Player Roles", definition: "A physically imposing striker used as a focal point in attack, holding the ball up for teammates. Peter Crouch, Olivier Giroud." },
  { term: "Wing-Back", category: "Player Roles", definition: "A wide player in a 3-5-2 or 3-4-3 who covers the full flank — attacking and defending. Requires incredible stamina." },
  { term: "Libero", category: "Player Roles", definition: "A sweeper who has freedom to carry the ball forward from defence into midfield. Franz Beckenbauer invented the modern version." },
  { term: "Mezzala", category: "Player Roles", definition: "A central midfielder who drifts into half-spaces to create or receive passes in dangerous areas. Think Kevin De Bruyne in Guardiola's system." },
  { term: "Raumdeuter", category: "Player Roles", definition: "Literally 'space interpreter' — a wide forward who drifts into pockets of space rather than hugging the touchline. Thomas Müller is the sole practitioner." },
  { term: "Enganche", category: "Player Roles", definition: "The Argentine version of the number 10 — a creative fulcrum who rarely tracks back, given total licence to orchestrate attacks. Riquelme, Maradona." },

  // ── Tactical Concepts ──
  { term: "Half-Space", category: "Tactical Concepts", definition: "The channel between the centre and the wing — a key area for creative players to receive the ball and turn. Often left underpoliced by the defence." },
  { term: "Double Pivot", category: "Tactical Concepts", definition: "Two defensive midfielders sitting in front of the back line, providing both screening and ball distribution." },
  { term: "Pressing Trap", category: "Tactical Concepts", definition: "A coordinated press that deliberately invites the opponent to play into a specific area before swarming it with multiple players." },
  { term: "Overload", category: "Tactical Concepts", definition: "Creating numerical superiority in a specific area of the pitch to dominate possession or break through the defensive line." },
  { term: "Underlap", category: "Tactical Concepts", definition: "A run made by a fullback or midfielder inside the winger, rather than outside. Creates confusion about who tracks the run." },
  { term: "Overlap", category: "Tactical Concepts", definition: "A run made by a fullback outside the winger along the touchline to stretch the defence and deliver crosses." },
  { term: "Transition", category: "Tactical Concepts", definition: "The moment a team switches between attack and defence (or vice versa) after winning or losing the ball." },
  { term: "Positional Play", category: "Tactical Concepts", definition: "A system where players occupy designated zones to ensure optimal spacing and passing triangles across all phases." },
  { term: "Third-Man Run", category: "Tactical Concepts", definition: "A movement where a player makes a run to receive a pass that was played to a teammate first, bypassing the initial press." },
  { term: "Progressive Carry", category: "Tactical Concepts", definition: "Dribbling the ball forward into the opponent's half, advancing play through individual skill under pressure." },
  { term: "Build-Up Play", category: "Tactical Concepts", definition: "The phase of play where a team constructs attacks from the back, usually starting with the goalkeeper or centre-backs." },
  { term: "Defensive Line", category: "Tactical Concepts", definition: "The imaginary line formed by a team's defenders — can be high, mid, or low depending on tactical instructions." },
  { term: "Ball-Side Overload", category: "Tactical Concepts", definition: "Concentrating players on the side of the pitch where the ball is, to create short passing options and dominate that zone." },
  { term: "Verticality", category: "Tactical Concepts", definition: "The tendency to play direct, vertical passes forward rather than circulating possession horizontally. A hallmark of counter-attacking football." },
  { term: "Compactness", category: "Tactical Concepts", definition: "Keeping the defensive shape tight — minimising the distance between the lines so the opponent has less space to operate in." },

  // ── Formations ──
  { term: "4-3-3", category: "Formations", definition: "Four defenders, three midfielders, three forwards. The default formation in modern football, offering width and balance." },
  { term: "4-2-3-1", category: "Formations", definition: "A double pivot protecting the defence with a number 10 behind a lone striker. Offers solidity and creativity." },
  { term: "3-5-2", category: "Formations", definition: "Three centre-backs with two wing-backs providing width. Strong in central areas, relies on wing-backs for width." },
  { term: "3-4-3", category: "Formations", definition: "Antonio Conte's signature — three at the back with width from wing-backs and a front three. Aggressive and attack-minded." },
  { term: "4-4-2", category: "Formations", definition: "The classic formation — two banks of four with a strike partnership. Simple, effective, and hard to break down." },
  { term: "4-1-4-1", category: "Formations", definition: "A single pivot behind a midfield four, offering defensive solidity while allowing the wide players to push forward." },

  // ── Set Pieces & Phases ──
  { term: "Near-Post Flick", category: "Set Pieces & Phases", definition: "A set-piece routine where a player at the near post flicks the ball on towards the back post, wrong-footing the goalkeeper." },
  { term: "Zonal Marking", category: "Set Pieces & Phases", definition: "Defending set pieces by assigning zones rather than marking specific opponents. Requires discipline and spatial awareness." },
  { term: "Man Marking", category: "Set Pieces & Phases", definition: "Assigning each defender a specific opponent to follow at set pieces. Relies on winning individual physical battles." },
  { term: "Short Corner", category: "Set Pieces & Phases", definition: "Playing a corner kick short to a nearby teammate rather than crossing it into the box, used to create a better angle or pull defenders out." },

  // ── Metrics & Stats ──
  { term: "xG", category: "Metrics & Stats", definition: "Expected Goals — a statistical metric that measures the quality of a chance based on distance, angle, assist type, and game state." },
  { term: "xA", category: "Metrics & Stats", definition: "Expected Assists — the likelihood that a given pass will become a goal assist, measuring creative quality." },
  { term: "PPDA", category: "Metrics & Stats", definition: "Passes Per Defensive Action — measures pressing intensity. Fewer passes allowed before a defensive action = more aggressive pressing." },
  { term: "Progressive Passes", category: "Metrics & Stats", definition: "Passes that move the ball significantly closer to the opponent's goal, advancing play forward. A key metric for modern playmakers." },
  { term: "xT", category: "Metrics & Stats", definition: "Expected Threat — measures the increase in scoring probability created by moving the ball to a more dangerous area of the pitch." },
  { term: "Possession-Adjusted Stats", category: "Metrics & Stats", definition: "Stats normalised for a team's share of possession. Allows fair comparison between a team that has 70% possession and one with 30%." },
];

// Build a quick lookup map (lowercased term → entry)
const glossaryMap = new Map<string, GlossaryEntry>();
for (const entry of footballGlossary) {
  glossaryMap.set(entry.term.toLowerCase(), entry);
}

/** Look up a term (case-insensitive) */
export function lookupTerm(term: string): GlossaryEntry | undefined {
  return glossaryMap.get(term.toLowerCase());
}

/** Get all terms as a sorted array (for regex building) */
export function getAllTerms(): string[] {
  return footballGlossary.map((e) => e.term).sort((a, b) => b.length - a.length); // longest first for regex
}

/** Generate a URL-safe slug from a term */
export function termSlug(term: string): string {
  return term.toLowerCase().replace(/[\s/]+/g, "-").replace(/[^a-z0-9-]/g, "");
}
