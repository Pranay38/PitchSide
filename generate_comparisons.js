const fs = require('fs');

const comparisons = [
  {
    "slug": "messi-vs-ronaldo",
    "type": "player",
    "entityA": { "name": "Lionel Messi", "team": "Inter Miami", "position": "Forward", "age": 39, "nationality": "Argentina" },
    "entityB": { "name": "Cristiano Ronaldo", "team": "Al Nassr", "position": "Forward", "age": 41, "nationality": "Portugal" },
    "stats": {
      "entityA": { "goals": 830, "assists": 350, "appearances": 1050, "minutesPerGoal": 105 },
      "entityB": { "goals": 885, "assists": 250, "appearances": 1200, "minutesPerGoal": 112 }
    },
    "keyAspects": ["Playmaking", "Goal Scoring", "Dribbling", "Longevity"],
    "tacticalAnalysis": "Messi orchestrates the attack and drops deep to create play, while Ronaldo transformed into the ultimate penalty-box predator, relying on intelligent movement and elite finishing.",
    "verdict": "Messi for overall attacking influence, Ronaldo for pure goalscoring and physical dominance.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "mbappe-vs-haaland",
    "type": "player",
    "entityA": { "name": "Kylian Mbappé", "team": "Real Madrid", "position": "Forward", "age": 27, "nationality": "France" },
    "entityB": { "name": "Erling Haaland", "team": "Manchester City", "position": "Forward", "age": 26, "nationality": "Norway" },
    "stats": {
      "entityA": { "goals": 18, "assists": 7, "appearances": 25, "minutesPerGoal": 89 },
      "entityB": { "goals": 24, "assists": 5, "appearances": 27, "minutesPerGoal": 72 }
    },
    "keyAspects": ["Pace & Dribbling", "Goal Scoring", "Big Game Performance", "Link-up Play"],
    "tacticalAnalysis": "While Haaland is the pure number 9 who thrives on service, Mbappé brings versatility and can attack off the left wing with devastating pace.",
    "verdict": "Haaland for volume, Mbappé for moments of genius.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "salah-vs-son",
    "type": "player",
    "entityA": { "name": "Mohamed Salah", "team": "Liverpool", "position": "Forward", "age": 34, "nationality": "Egypt" },
    "entityB": { "name": "Son Heung-min", "team": "Tottenham Hotspur", "position": "Forward", "age": 34, "nationality": "South Korea" },
    "stats": {
      "entityA": { "goals": 210, "assists": 89, "appearances": 350, "minutesPerGoal": 135 },
      "entityB": { "goals": 160, "assists": 80, "appearances": 390, "minutesPerGoal": 180 }
    },
    "keyAspects": ["Finishing", "Playmaking", "Work Rate", "Consistency"],
    "tacticalAnalysis": "Salah operates on the right half-space, cutting in to unleash left-footed strikes. Son is an elite ambidextrous finisher who drives into space from the left.",
    "verdict": "Salah edges it on peak output, but Son's two-footedness makes him equally lethal.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "vinicius-vs-saka",
    "type": "player",
    "entityA": { "name": "Vinícius Júnior", "team": "Real Madrid", "position": "Winger", "age": 26, "nationality": "Brazil" },
    "entityB": { "name": "Bukayo Saka", "team": "Arsenal", "position": "Winger", "age": 25, "nationality": "England" },
    "stats": {
      "entityA": { "goals": 15, "assists": 12, "appearances": 30, "minutesPerGoal": 165 },
      "entityB": { "goals": 16, "assists": 10, "appearances": 32, "minutesPerGoal": 172 }
    },
    "keyAspects": ["1v1 Dribbling", "Decision Making", "Defensive Work", "Crossing"],
    "tacticalAnalysis": "Vinicius is an explosive chaos creator on the left wing. Saka offers controlled progression, exceptional tactical discipline, and creativity from the right.",
    "verdict": "Vinicius for pure 1v1 disruption; Saka for overall team structure.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "bellingham-vs-pedri",
    "type": "player",
    "entityA": { "name": "Jude Bellingham", "team": "Real Madrid", "position": "Midfielder", "age": 23, "nationality": "England" },
    "entityB": { "name": "Pedri", "team": "Barcelona", "position": "Midfielder", "age": 23, "nationality": "Spain" },
    "stats": {
      "entityA": { "goals": 20, "assists": 10, "appearances": 35, "minutesPerGoal": 150 },
      "entityB": { "goals": 5, "assists": 8, "appearances": 28, "minutesPerGoal": 450 }
    },
    "keyAspects": ["Box-to-Box Dominance", "Tempo Control", "Goal Threat", "Passing Vision"],
    "tacticalAnalysis": "Bellingham is an aggressive, goal-scoring attacking midfielder who crashes the box. Pedri is the classic deep-lying playmaker, manipulating space and retaining possession.",
    "verdict": "Bellingham for direct impact and goals; Pedri for midfield control.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "de-bruyne-vs-modric",
    "type": "player",
    "entityA": { "name": "Kevin De Bruyne", "team": "Manchester City", "position": "Midfielder", "age": 35, "nationality": "Belgium" },
    "entityB": { "name": "Luka Modrić", "team": "Real Madrid", "position": "Midfielder", "age": 41, "nationality": "Croatia" },
    "stats": {
      "entityA": { "goals": 100, "assists": 250, "appearances": 500, "minutesPerGoal": 400 },
      "entityB": { "goals": 80, "assists": 130, "appearances": 700, "minutesPerGoal": 700 }
    },
    "keyAspects": ["Crossing", "Ball Progression", "Vision", "Longevity"],
    "tacticalAnalysis": "De Bruyne defines the modern advanced playmaker with brutal crosses and direct assists. Modric dictates the tempo from deeper areas, evading pressure with elite agility.",
    "verdict": "De Bruyne for raw final-third production; Modric for overall game orchestration.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "rodri-vs-rice",
    "type": "player",
    "entityA": { "name": "Rodri", "team": "Manchester City", "position": "Defensive Midfielder", "age": 30, "nationality": "Spain" },
    "entityB": { "name": "Declan Rice", "team": "Arsenal", "position": "Defensive Midfielder", "age": 27, "nationality": "England" },
    "stats": {
      "entityA": { "goals": 8, "assists": 10, "appearances": 40, "minutesPerGoal": 450 },
      "entityB": { "goals": 6, "assists": 8, "appearances": 42, "minutesPerGoal": 600 }
    },
    "keyAspects": ["Passing Accuracy", "Ball Recovery", "Press Resistance", "Long Shots"],
    "tacticalAnalysis": "Rodri is the tempo setter of Guardiola's machine, rarely losing the ball. Rice covers immense ground, excelling in transitions and ball-carrying out of deep areas.",
    "verdict": "Rodri is superior in possession; Rice is superior in athletic ball recovery.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "saliba-vs-dias",
    "type": "player",
    "entityA": { "name": "William Saliba", "team": "Arsenal", "position": "Defender", "age": 25, "nationality": "France" },
    "entityB": { "name": "Rúben Dias", "team": "Manchester City", "position": "Defender", "age": 29, "nationality": "Portugal" },
    "stats": {
      "entityA": { "goals": 2, "assists": 1, "appearances": 38, "minutesPerGoal": 1700 },
      "entityB": { "goals": 1, "assists": 0, "appearances": 35, "minutesPerGoal": 3150 }
    },
    "keyAspects": ["1v1 Defending", "Aerial Duels", "Distribution", "Leadership"],
    "tacticalAnalysis": "Saliba uses supreme pace and anticipation to cover large spaces behind a high line. Dias brings aggression, box-defending dominance, and vocal leadership.",
    "verdict": "Saliba for recovery pace and composure; Dias for traditional penalty-box defending.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "alisson-vs-ederson",
    "type": "player",
    "entityA": { "name": "Alisson Becker", "team": "Liverpool", "position": "Goalkeeper", "age": 34, "nationality": "Brazil" },
    "entityB": { "name": "Ederson", "team": "Manchester City", "position": "Goalkeeper", "age": 33, "nationality": "Brazil" },
    "stats": {
      "entityA": { "goals": 1, "assists": 3, "appearances": 250, "minutesPerGoal": 22500 },
      "entityB": { "goals": 0, "assists": 4, "appearances": 280, "minutesPerGoal": 99999 }
    },
    "keyAspects": ["Shot Stopping", "Distribution", "Sweeping", "Command of Area"],
    "tacticalAnalysis": "Alisson is elite at 1v1 shot-stopping, saving Liverpool points single-handedly. Ederson acts as an 11th outfield player with unparalleled passing range.",
    "verdict": "Alisson is the better traditional goalkeeper; Ederson is the superior playmaker.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "trent-vs-james",
    "type": "player",
    "entityA": { "name": "Trent Alexander-Arnold", "team": "Liverpool", "position": "Defender", "age": 28, "nationality": "England" },
    "entityB": { "name": "Reece James", "team": "Chelsea", "position": "Defender", "age": 27, "nationality": "England" },
    "stats": {
      "entityA": { "goals": 15, "assists": 85, "appearances": 320, "minutesPerGoal": 1800 },
      "entityB": { "goals": 12, "assists": 25, "appearances": 180, "minutesPerGoal": 1200 }
    },
    "keyAspects": ["Playmaking", "Defending", "Athleticism", "Set Pieces"],
    "tacticalAnalysis": "Trent is a deep-lying playmaker stationed at right-back, dictating play with cross-field passes. James is physically dominant, strong defensively, and a powerful runner.",
    "verdict": "Trent for unmatched creativity; James for complete two-way full-back play.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "arsenal-vs-manchester-city",
    "type": "team",
    "entityA": { "name": "Arsenal", "team": "Arsenal", "position": "Club", "age": 139, "nationality": "England" },
    "entityB": { "name": "Manchester City", "team": "Manchester City", "position": "Club", "age": 146, "nationality": "England" },
    "stats": {
      "entityA": { "goals": 88, "assists": 62, "appearances": 38, "minutesPerGoal": 38 },
      "entityB": { "goals": 96, "assists": 70, "appearances": 38, "minutesPerGoal": 35 }
    },
    "keyAspects": ["Pressing Intensity", "Possession Control", "Set-Piece Dominance", "Squad Depth"],
    "tacticalAnalysis": "Arteta's Arsenal relies on structural rigidity, set-piece excellence, and intense wide overloads. Guardiola's City uses fluid central permutations and inverted full-backs to suffocate opponents.",
    "verdict": "City edges it on depth and late-season experience, but Arsenal matches them defensively.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "real-madrid-vs-barcelona",
    "type": "team",
    "entityA": { "name": "Real Madrid", "team": "Real Madrid", "position": "Club", "age": 124, "nationality": "Spain" },
    "entityB": { "name": "Barcelona", "team": "Barcelona", "position": "Club", "age": 127, "nationality": "Spain" },
    "stats": {
      "entityA": { "goals": 85, "assists": 60, "appearances": 38, "minutesPerGoal": 40 },
      "entityB": { "goals": 75, "assists": 55, "appearances": 38, "minutesPerGoal": 45 }
    },
    "keyAspects": ["Transition Speed", "Positional Play", "Individual Brilliance", "Youth Integration"],
    "tacticalAnalysis": "Real Madrid excels in transition, utilizing the blistering pace of their wingers and midfield athleticism. Barcelona remains true to positional play, emphasizing control through La Masia products.",
    "verdict": "Madrid is built for Champions League chaos; Barcelona prioritizes structured league dominance.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "bayern-vs-dortmund",
    "type": "team",
    "entityA": { "name": "Bayern Munich", "team": "Bayern Munich", "position": "Club", "age": 126, "nationality": "Germany" },
    "entityB": { "name": "Borussia Dortmund", "team": "Borussia Dortmund", "position": "Club", "age": 117, "nationality": "Germany" },
    "stats": {
      "entityA": { "goals": 92, "assists": 65, "appearances": 34, "minutesPerGoal": 33 },
      "entityB": { "goals": 70, "assists": 50, "appearances": 34, "minutesPerGoal": 43 }
    },
    "keyAspects": ["Wing Play", "Counter-Pressing", "Squad Power", "Home Advantage"],
    "tacticalAnalysis": "Bayern overwhelms with relentless attacking width and dominance in the half-spaces. Dortmund thrives in chaotic transitions, fueled by the Yellow Wall.",
    "verdict": "Bayern has the sheer quality and resources, while Dortmund relies on passion and transitional speed.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "inter-vs-ac-milan",
    "type": "team",
    "entityA": { "name": "Inter Milan", "team": "Inter Milan", "position": "Club", "age": 118, "nationality": "Italy" },
    "entityB": { "name": "AC Milan", "team": "AC Milan", "position": "Club", "age": 127, "nationality": "Italy" },
    "stats": {
      "entityA": { "goals": 78, "assists": 55, "appearances": 38, "minutesPerGoal": 43 },
      "entityB": { "goals": 65, "assists": 45, "appearances": 38, "minutesPerGoal": 52 }
    },
    "keyAspects": ["3-5-2 Mastery", "Wing-Play", "Midfield Rotations", "Counter-Attacking"],
    "tacticalAnalysis": "Inter's fluid 3-5-2 dominates the midfield with dynamic rotations. Milan prefers a 4-2-3-1, relying heavily on explosive left-wing combinations.",
    "verdict": "Inter's system provides more consistency; Milan relies more on individual inspiration.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "psg-vs-marseille",
    "type": "team",
    "entityA": { "name": "Paris Saint-Germain", "team": "Paris Saint-Germain", "position": "Club", "age": 56, "nationality": "France" },
    "entityB": { "name": "Marseille", "team": "Marseille", "position": "Club", "age": 127, "nationality": "France" },
    "stats": {
      "entityA": { "goals": 85, "assists": 60, "appearances": 34, "minutesPerGoal": 36 },
      "entityB": { "goals": 60, "assists": 40, "appearances": 34, "minutesPerGoal": 51 }
    },
    "keyAspects": ["Possession", "Intensity", "Individual Quality", "Atmosphere"],
    "tacticalAnalysis": "PSG controls the ball and leverages superstar forwards in a 4-3-3. Marseille brings aggression, high pressing, and a raucous home crowd to bridge the gap in quality.",
    "verdict": "PSG dictates the play, but Marseille can disrupt them with high-octane pressing.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "4-3-3-vs-4-2-3-1",
    "type": "formation",
    "entityA": { "name": "4-3-3", "team": "Tactic", "position": "Formation", "age": 0, "nationality": "Global" },
    "entityB": { "name": "4-2-3-1", "team": "Tactic", "position": "Formation", "age": 0, "nationality": "Global" },
    "stats": {
      "entityA": { "goals": 0, "assists": 0, "appearances": 0, "minutesPerGoal": 0 },
      "entityB": { "goals": 0, "assists": 0, "appearances": 0, "minutesPerGoal": 0 }
    },
    "keyAspects": ["Midfield Triangle", "Double Pivot", "Wing Play", "Pressing Structure"],
    "tacticalAnalysis": "The 4-3-3 offers natural triangles and a single pivot for fluid possession. The 4-2-3-1 provides a solid double pivot base, unlocking a dedicated #10 in the hole.",
    "verdict": "4-3-3 is better for dominating possession; 4-2-3-1 offers more defensive stability and transition threat.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "3-5-2-vs-4-4-2",
    "type": "formation",
    "entityA": { "name": "3-5-2", "team": "Tactic", "position": "Formation", "age": 0, "nationality": "Global" },
    "entityB": { "name": "4-4-2", "team": "Tactic", "position": "Formation", "age": 0, "nationality": "Global" },
    "stats": {
      "entityA": { "goals": 0, "assists": 0, "appearances": 0, "minutesPerGoal": 0 },
      "entityB": { "goals": 0, "assists": 0, "appearances": 0, "minutesPerGoal": 0 }
    },
    "keyAspects": ["Wing-Backs", "Two Strikers", "Central Overload", "Defensive Block"],
    "tacticalAnalysis": "3-5-2 crowds the midfield and relies on wing-backs for width. The classic 4-4-2 defends in two rigid banks of four, striking quickly down the flanks.",
    "verdict": "3-5-2 dominates centrally; 4-4-2 is unmatched for defensive solidity and simplicity.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "4-1-4-1-vs-4-3-3",
    "type": "formation",
    "entityA": { "name": "4-1-4-1", "team": "Tactic", "position": "Formation", "age": 0, "nationality": "Global" },
    "entityB": { "name": "4-3-3", "team": "Tactic", "position": "Formation", "age": 0, "nationality": "Global" },
    "stats": {
      "entityA": { "goals": 0, "assists": 0, "appearances": 0, "minutesPerGoal": 0 },
      "entityB": { "goals": 0, "assists": 0, "appearances": 0, "minutesPerGoal": 0 }
    },
    "keyAspects": ["Deep Lying Playmaker", "Midfield Band", "Attacking Width", "Pressing Triggers"],
    "tacticalAnalysis": "4-1-4-1 places an emphasis on a flat midfield four shielding a lone pivot, ideal for defensive blocks. 4-3-3 pushes the wingers higher to engage center-backs immediately.",
    "verdict": "4-1-4-1 is more conservative; 4-3-3 is more expansive and press-oriented.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "foden-vs-palmer",
    "type": "player",
    "entityA": { "name": "Phil Foden", "team": "Manchester City", "position": "Midfielder", "age": 26, "nationality": "England" },
    "entityB": { "name": "Cole Palmer", "team": "Chelsea", "position": "Midfielder", "age": 24, "nationality": "England" },
    "stats": {
      "entityA": { "goals": 18, "assists": 9, "appearances": 35, "minutesPerGoal": 160 },
      "entityB": { "goals": 22, "assists": 11, "appearances": 33, "minutesPerGoal": 125 }
    },
    "keyAspects": ["Half-space Creation", "Penalty Taking", "Dribbling in Tight Spaces", "Long Range Shooting"],
    "tacticalAnalysis": "Foden excels at receiving on the half-turn in Pep's system. Palmer is the ultimate chaotic focal point for Chelsea, thriving with immense freedom.",
    "verdict": "Foden for systemic perfection; Palmer for talismanic individual brilliance.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "odegaard-vs-bruno",
    "type": "player",
    "entityA": { "name": "Martin Ødegaard", "team": "Arsenal", "position": "Midfielder", "age": 27, "nationality": "Norway" },
    "entityB": { "name": "Bruno Fernandes", "team": "Manchester United", "position": "Midfielder", "age": 31, "nationality": "Portugal" },
    "stats": {
      "entityA": { "goals": 10, "assists": 12, "appearances": 37, "minutesPerGoal": 300 },
      "entityB": { "goals": 12, "assists": 14, "appearances": 36, "minutesPerGoal": 250 }
    },
    "keyAspects": ["Pressing Leadership", "Through Balls", "Work Rate", "Chance Creation"],
    "tacticalAnalysis": "Odegaard dictates the right-side combinations and initiates the press. Bruno plays with high risk and high reward, constantly looking for the killer pass.",
    "verdict": "Odegaard for control and pressing; Bruno for sheer volume of chances created.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "klopp-4-3-3-vs-pep-4-3-3",
    "type": "formation",
    "entityA": { "name": "Klopp 4-3-3", "team": "Tactic", "position": "Formation", "age": 0, "nationality": "Global" },
    "entityB": { "name": "Pep 4-3-3", "team": "Tactic", "position": "Formation", "age": 0, "nationality": "Global" },
    "stats": {
      "entityA": { "goals": 0, "assists": 0, "appearances": 0, "minutesPerGoal": 0 },
      "entityB": { "goals": 0, "assists": 0, "appearances": 0, "minutesPerGoal": 0 }
    },
    "keyAspects": ["Gegenpressing", "Positional Play", "Full-back Width", "False Nine"],
    "tacticalAnalysis": "Klopp's 4-3-3 uses a hard-working midfield to unleash attacking full-backs and inverted wingers. Pep's 4-3-3 focuses on positional superiority, inverted full-backs, and control.",
    "verdict": "Klopp's version thrives on heavy metal chaos; Pep's version seeks complete control.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "van-dijk-vs-ramos",
    "type": "player",
    "entityA": { "name": "Virgil van Dijk", "team": "Liverpool", "position": "Defender", "age": 35, "nationality": "Netherlands" },
    "entityB": { "name": "Sergio Ramos", "team": "Sevilla", "position": "Defender", "age": 40, "nationality": "Spain" },
    "stats": {
      "entityA": { "goals": 20, "assists": 5, "appearances": 400, "minutesPerGoal": 1800 },
      "entityB": { "goals": 110, "assists": 30, "appearances": 800, "minutesPerGoal": 600 }
    },
    "keyAspects": ["Aura", "Aggression", "Aerial Dominance", "Goalscoring"],
    "tacticalAnalysis": "Van Dijk relies on flawless positioning and physical dominance, rarely making a tackle. Ramos was proactive, aggressive, and an incredible goalscoring threat.",
    "verdict": "Van Dijk for passive perfection; Ramos for ultimate big-game aggression.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "liverpool-vs-everton",
    "type": "team",
    "entityA": { "name": "Liverpool", "team": "Liverpool", "position": "Club", "age": 134, "nationality": "England" },
    "entityB": { "name": "Everton", "team": "Everton", "position": "Club", "age": 148, "nationality": "England" },
    "stats": {
      "entityA": { "goals": 80, "assists": 55, "appearances": 38, "minutesPerGoal": 42 },
      "entityB": { "goals": 40, "assists": 25, "appearances": 38, "minutesPerGoal": 85 }
    },
    "keyAspects": ["Derby Intensity", "Set Pieces", "Counter-Attacks", "High Press"],
    "tacticalAnalysis": "Liverpool aims to dominate possession and press high. Everton often sits deep in a low block, looking to exploit set-pieces and physical transitions.",
    "verdict": "Liverpool has the clear tactical edge, but derby day emotion levels the playing field.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "3-4-2-1-vs-4-2-3-1",
    "type": "formation",
    "entityA": { "name": "3-4-2-1", "team": "Tactic", "position": "Formation", "age": 0, "nationality": "Global" },
    "entityB": { "name": "4-2-3-1", "team": "Tactic", "position": "Formation", "age": 0, "nationality": "Global" },
    "stats": {
      "entityA": { "goals": 0, "assists": 0, "appearances": 0, "minutesPerGoal": 0 },
      "entityB": { "goals": 0, "assists": 0, "appearances": 0, "minutesPerGoal": 0 }
    },
    "keyAspects": ["Box Midfield", "Wing-Backs", "Double Pivot", "Number 10"],
    "tacticalAnalysis": "3-4-2-1 uses dual #10s to control the half-spaces and wing-backs for width. 4-2-3-1 uses a traditional back four with wingers and a single #10.",
    "verdict": "3-4-2-1 provides better central overload; 4-2-3-1 offers more direct wide play.",
    "lastUpdated": "2026-09-25"
  },
  {
    "slug": "yamal-vs-guler",
    "type": "player",
    "entityA": { "name": "Lamine Yamal", "team": "Barcelona", "position": "Winger", "age": 19, "nationality": "Spain" },
    "entityB": { "name": "Arda Güler", "team": "Real Madrid", "position": "Midfielder", "age": 21, "nationality": "Turkey" },
    "stats": {
      "entityA": { "goals": 8, "assists": 12, "appearances": 30, "minutesPerGoal": 250 },
      "entityB": { "goals": 10, "assists": 5, "appearances": 20, "minutesPerGoal": 120 }
    },
    "keyAspects": ["1v1 Ability", "Vision", "Ball Striking", "Youth Potential"],
    "tacticalAnalysis": "Yamal isolates defenders out wide and uses unmatched agility to cut inside. Güler operates in the right half-space, utilizing elite vision and ball-striking.",
    "verdict": "Yamal is a pure touchline winger; Güler is a modern inside playmaker.",
    "lastUpdated": "2026-09-25"
  }
];

fs.writeFileSync('./data/comparisons.json', JSON.stringify(comparisons, null, 2));
