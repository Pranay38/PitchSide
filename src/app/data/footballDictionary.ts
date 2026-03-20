/**
 * Football Dictionary — correct spellings and common misspellings.
 * Used by the SpellcheckBar to flag errors in the post editor.
 */

export interface DictionaryEntry {
  correct: string;
  misspellings: string[];
}

export const footballDictionary: DictionaryEntry[] = [
  // ── Player Names ──
  { correct: "Ødegaard", misspellings: ["Odegaard", "Odegard", "Odegaad"] },
  { correct: "Mbappé", misspellings: ["Mbappe", "M'bappe", "Mbape"] },
  { correct: "Müller", misspellings: ["Muller", "Mueller"] },
  { correct: "Haaland", misspellings: ["Haland", "Haaland"] },
  { correct: "Salah", misspellings: ["Sala", "Sallah"] },
  { correct: "Griezmann", misspellings: ["Greizmann", "Griezman", "Greizman"] },
  { correct: "Lewandowski", misspellings: ["Lewandowksi", "Lewandowsky"] },
  { correct: "Kylian", misspellings: ["Kylan", "Killian", "Kilian"] },
  { correct: "Vinícius", misspellings: ["Vinicius", "Vinicious", "Vinicus"] },
  { correct: "Jorginho", misspellings: ["Jorgihno", "Jorgino"] },
  { correct: "Pedri", misspellings: ["Pedrii"] },
  { correct: "Gavi", misspellings: ["Gavii"] },
  { correct: "Szczesny", misspellings: ["Sczezny", "Szczezny", "Szchesny"] },
  { correct: "Tchouaméni", misspellings: ["Tchouameni", "Chouameni", "Tchoumeni"] },
  { correct: "Çalhanoğlu", misspellings: ["Calhanoglu", "Calhanogolu", "Chalanoglu"] },
  { correct: "Sané", misspellings: ["Sane"] },
  { correct: "Süle", misspellings: ["Sule"] },
  { correct: "Özil", misspellings: ["Ozil"] },
  { correct: "Mendy", misspellings: ["Menddy"] },
  { correct: "Thiago", misspellings: ["Tiago"] },
  { correct: "João Félix", misspellings: ["Joao Felix", "Joao Félix", "João Felix"] },
  { correct: "Bernardo Silva", misspellings: ["Bernaro Silva", "Bernarno Silva"] },
  { correct: "De Bruyne", misspellings: ["de bruyne", "Debruyne", "De Bruine"] },
  { correct: "Saka", misspellings: ["Sakka"] },
  { correct: "Martinelli", misspellings: ["Martineli", "Martinelly"] },
  { correct: "Zidane", misspellings: ["Zidanne", "Zidan"] },
  { correct: "Ronaldinho", misspellings: ["Ronaldihno", "Ronaldino"] },
  { correct: "Beckenbauer", misspellings: ["Beckenbaur", "Beckenbeur"] },

  // ── Club Names ──
  { correct: "Atlético Madrid", misspellings: ["Atletico Madrid", "Athletico Madrid"] },
  { correct: "Borussia Dortmund", misspellings: ["Borrusia Dortmund", "Borussia Dortmud", "Borusea Dortmund"] },
  { correct: "Borussia Mönchengladbach", misspellings: ["Borussia Monchengladbach", "Monchengladbach"] },
  { correct: "Bayern München", misspellings: ["Bayern Munchen", "Bayer Munich"] },
  { correct: "Olympique Lyonnais", misspellings: ["Olympic Lyonnais", "Olympique Lyon"] },
  { correct: "Olympique de Marseille", misspellings: ["Olympic de Marseille", "Olympique Marseille"] },
  { correct: "São Paulo", misspellings: ["Sao Paulo"] },
  { correct: "Fenerbahçe", misspellings: ["Fenerbahce", "Fenerbache"] },
  { correct: "Beşiktaş", misspellings: ["Besiktas", "Besiktas"] },
  { correct: "Galatasaray", misspellings: ["Galatasary", "Galatasarai"] },
  { correct: "Internazionale", misspellings: ["Internazionale", "Internazzionale"] },
  { correct: "Wolverhampton", misspellings: ["Wolverhamton", "Wolverhamption"] },

  // ── Common Football Terms ──
  { correct: "offside", misspellings: ["off-side", "off side"] },
  { correct: "counterattack", misspellings: ["counter attack", "counter-atack"] },
  { correct: "centre-back", misspellings: ["center-back", "centerback", "centreback"] },
  { correct: "centre-forward", misspellings: ["center-forward", "centerforward"] },
  { correct: "full-back", misspellings: ["fullback", "full back"] },
  { correct: "goalkeeper", misspellings: ["goal-keeper", "goal keeper"] },
  { correct: "Champions League", misspellings: ["Champions league", "Champoins League", "Champion's League"] },
  { correct: "Premier League", misspellings: ["Premier league", "Premiere League"] },
  { correct: "Bundesliga", misspellings: ["Bundesleague", "Bundeslica"] },
  { correct: "Serie A", misspellings: ["Seria A", "Serie a"] },
  { correct: "La Liga", misspellings: ["La liga", "Laliga"] },
  { correct: "Ligue 1", misspellings: ["Ligue1", "League 1"] },
];

// Build a lookup map: lowercased misspelling → correct form
const misspellingMap = new Map<string, string>();
for (const entry of footballDictionary) {
  for (const ms of entry.misspellings) {
    misspellingMap.set(ms.toLowerCase(), entry.correct);
  }
}

export interface SpellIssue {
  found: string;
  suggestion: string;
  index: number;
}

/**
 * Scan text content and return all detected misspellings.
 */
export function findMisspellings(text: string): SpellIssue[] {
  const issues: SpellIssue[] = [];
  const seen = new Set<string>();

  for (const [misspelling, correct] of misspellingMap.entries()) {
    // Skip if the misspelling IS the correct form (case-sensitive check)
    const entry = footballDictionary.find((e) => e.correct === correct);
    if (!entry) continue;

    const regex = new RegExp(`\\b${misspelling.replace(/[.*+?^${}()|[\]\\\\]/g, "\\$&")}\\b`, "gi");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      // Only flag if it's actually wrong (case-sensitive or diacritics differ)
      if (match[0] === correct) continue;
      const key = `${match[0]}→${correct}`;
      if (seen.has(key)) continue;
      seen.add(key);
      issues.push({ found: match[0], suggestion: correct, index: match.index });
    }
  }

  return issues;
}
