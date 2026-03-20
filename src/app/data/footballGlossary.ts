/**
 * Football Glossary — tactical terms with short definitions.
 * Used by the GlossaryTooltip component to annotate article content.
 */

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export const footballGlossary: GlossaryEntry[] = [
  // Tactical Systems
  { term: "gegenpressing", definition: "Immediately counter-pressing the opponent right after losing the ball, aiming to win it back within 5 seconds." },
  { term: "tiki-taka", definition: "A possession-based style emphasizing short passing, movement, and retaining the ball in tight spaces." },
  { term: "catenaccio", definition: "An Italian defensive system focused on a sweeper behind the back line and tight man-marking." },
  { term: "total football", definition: "A fluid system where any outfield player can take over any other's role, requiring all players to be comfortable in all positions." },
  { term: "park the bus", definition: "Dropping all players deep into a defensive block to protect a lead, sacrificing attacking intent." },
  { term: "counter-pressing", definition: "Winning the ball back immediately after losing it by pressing the opponent high up the pitch." },
  { term: "low block", definition: "A deep, compact defensive shape where the entire team defends close to their own goal." },
  { term: "high press", definition: "Pressing the opponent aggressively in their own half to force turnovers near their goal." },

  // Player Roles
  { term: "false nine", definition: "A centre-forward who drops deep into midfield, creating space for wingers and midfielders to exploit." },
  { term: "inverted fullback", definition: "A fullback who tucks inside into midfield rather than overlapping on the wing." },
  { term: "inverted winger", definition: "A winger who plays on the opposite side to their dominant foot, allowing them to cut inside and shoot." },
  { term: "regista", definition: "A deep-lying playmaker who dictates the tempo of the game from in front of the defence." },
  { term: "trequartista", definition: "A creative number 10 given freedom to roam and create chances between the midfield and attack lines." },
  { term: "sweeper-keeper", definition: "A goalkeeper who plays high off their line, acting as an extra outfield player to sweep up through balls." },
  { term: "box-to-box", definition: "A midfielder who covers the full length of the pitch — defending in their own box and attacking in the opponent's." },
  { term: "deep-lying playmaker", definition: "A midfielder positioned between the defence and midfield who starts attacks with long-range passing." },
  { term: "number 10", definition: "The classic playmaker role, operating behind the striker to create and score goals." },
  { term: "targetman", definition: "A physically imposing striker used as a focal point in attack, holding the ball up for teammates." },
  { term: "wing-back", definition: "A wide player in a 3-5-2 or 3-4-3 who covers the full flank — attacking and defending." },
  { term: "libero", definition: "A sweeper who has freedom to carry the ball forward from defence into midfield." },
  { term: "mezzala", definition: "A central midfielder who drifts into half-spaces to create or receive passes in dangerous areas." },

  // Tactical Concepts
  { term: "half-space", definition: "The channel between the centre and the wing — a key area for creative players to receive the ball and turn." },
  { term: "double pivot", definition: "Two defensive midfielders sitting in front of the back line, providing screening and ball distribution." },
  { term: "pressing trap", definition: "A coordinated press that deliberately invites the opponent to play into a specific area before swarming it." },
  { term: "overload", definition: "Creating numerical superiority in a specific area of the pitch to dominate possession or break through." },
  { term: "underlap", definition: "A run made by a fullback or midfielder inside the winger, rather than outside." },
  { term: "overlap", definition: "A run made by a fullback outside the winger along the touchline to stretch the defence." },
  { term: "transition", definition: "The moment a team switches between attack and defence (or vice versa) after winning or losing the ball." },
  { term: "positional play", definition: "A system where players occupy designated zones to ensure optimal spacing and passing triangles." },
  { term: "third-man run", definition: "A movement where a player makes a run to receive a pass that was played to a teammate first, bypassing the initial press." },
  { term: "progressive carry", definition: "Dribbling the ball forward into the opponent's half, advancing play through individual skill." },
  { term: "build-up play", definition: "The phase of play where a team constructs attacks from the back, usually starting with the goalkeeper or centre-backs." },
  { term: "defensive line", definition: "The imaginary line formed by a team's defenders — can be high, mid, or low depending on tactics." },

  // Metrics & Stats
  { term: "xG", definition: "Expected Goals — a statistical metric that measures the quality of a chance based on several factors like distance, angle, and assist type." },
  { term: "xA", definition: "Expected Assists — the likelihood that a given pass will become a goal assist." },
  { term: "PPDA", definition: "Passes Per Defensive Action — measures pressing intensity; fewer passes allowed = more aggressive pressing." },
  { term: "progressive passes", definition: "Passes that move the ball significantly closer to the opponent's goal, advancing play forward." },
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
