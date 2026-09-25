const fs = require('fs');
const path = require('path');

const managersData = [
  {
    "slug": "erik-ten-hag",
    "name": "Erik ten Hag",
    "team": "Manchester United",
    "league": "Premier League",
    "pressureScore": 92,
    "status": "Critical",
    "trend": "up",
    "sackingOdds": "1/2",
    "recentResults": ["L", "D", "L", "W", "L"],
    "nextMatch": "vs Arsenal (A)",
    "sentiment": "Fans have turned completely, board considering options.",
    "topGrievances": ["No clear tactical identity", "Poor recruitment", "Dressing room leaks"]
  },
  {
    "slug": "mikel-arteta",
    "name": "Mikel Arteta",
    "team": "Arsenal",
    "league": "Premier League",
    "pressureScore": 35,
    "status": "Stable",
    "trend": "down",
    "sackingOdds": "25/1",
    "recentResults": ["W", "W", "D", "W", "W"],
    "nextMatch": "vs Manchester United (H)",
    "sentiment": "Strong backing despite recent draw.",
    "topGrievances": ["Occasional over-rotation", "Stubbornness with certain players"]
  },
  {
    "slug": "roberto-de-zerbi",
    "name": "Roberto De Zerbi",
    "team": "Tottenham",
    "league": "Premier League",
    "pressureScore": 65,
    "status": "Under Scrutiny",
    "trend": "up",
    "sackingOdds": "8/1",
    "recentResults": ["W", "L", "D", "L", "W"],
    "nextMatch": "vs Chelsea (A)",
    "sentiment": "Exciting football but defensive frailties worry supporters.",
    "topGrievances": ["Defensive transitions", "Set-piece vulnerability"]
  },
  {
    "slug": "unai-emery",
    "name": "Unai Emery",
    "team": "Aston Villa",
    "league": "Premier League",
    "pressureScore": 40,
    "status": "Stable",
    "trend": "flat",
    "sackingOdds": "20/1",
    "recentResults": ["W", "L", "W", "D", "W"],
    "nextMatch": "vs Newcastle (H)",
    "sentiment": "High confidence after European qualification.",
    "topGrievances": ["High line sometimes exploited", "Away form inconsistency"]
  },
  {
    "slug": "marco-silva",
    "name": "Marco Silva",
    "team": "Fulham",
    "league": "Premier League",
    "pressureScore": 55,
    "status": "Under Scrutiny",
    "trend": "up",
    "sackingOdds": "12/1",
    "recentResults": ["L", "D", "D", "W", "L"],
    "nextMatch": "vs Brentford (A)",
    "sentiment": "Board wants a push for top half.",
    "topGrievances": ["Lack of cutting edge", "Midfield balance"]
  },
  {
    "slug": "nuno-espirito-santo",
    "name": "Nuno Espírito Santo",
    "team": "Nottingham Forest",
    "league": "Premier League",
    "pressureScore": 85,
    "status": "Under Fire",
    "trend": "up",
    "sackingOdds": "3/1",
    "recentResults": ["L", "L", "D", "L", "D"],
    "nextMatch": "vs Crystal Palace (H)",
    "sentiment": "Relegation fears growing rapidly.",
    "topGrievances": ["Negative tactics", "Poor record against bottom-half teams"]
  },
  {
    "slug": "sean-dyche",
    "name": "Sean Dyche",
    "team": "Everton",
    "league": "Premier League",
    "pressureScore": 75,
    "status": "Under Fire",
    "trend": "flat",
    "sackingOdds": "5/1",
    "recentResults": ["D", "L", "W", "L", "L"],
    "nextMatch": "vs Liverpool (A)",
    "sentiment": "Survival instinct appreciated, but style criticized.",
    "topGrievances": ["Direct play predictability", "Lack of goals"]
  },
  {
    "slug": "carlo-ancelotti",
    "name": "Carlo Ancelotti",
    "team": "Real Madrid",
    "league": "La Liga",
    "pressureScore": 25,
    "status": "Stable",
    "trend": "down",
    "sackingOdds": "50/1",
    "recentResults": ["W", "W", "W", "D", "W"],
    "nextMatch": "vs Atletico Madrid (H)",
    "sentiment": "Absolute legend status.",
    "topGrievances": ["Youth integration could be better", "Occasional passive periods in games"]
  },
  {
    "slug": "hansi-flick",
    "name": "Hansi Flick",
    "team": "Barcelona",
    "league": "La Liga",
    "pressureScore": 45,
    "status": "Stable",
    "trend": "up",
    "sackingOdds": "15/1",
    "recentResults": ["W", "D", "W", "L", "W"],
    "nextMatch": "vs Sevilla (A)",
    "sentiment": "Promising start, bringing high intensity back.",
    "topGrievances": ["High line risks", "Squad depth issues affecting rotation"]
  },
  {
    "slug": "diego-simeone",
    "name": "Diego Simeone",
    "team": "Atlético Madrid",
    "league": "La Liga",
    "pressureScore": 30,
    "status": "Stable",
    "trend": "flat",
    "sackingOdds": "33/1",
    "recentResults": ["W", "W", "L", "D", "W"],
    "nextMatch": "vs Real Madrid (A)",
    "sentiment": "The eternal leader.",
    "topGrievances": ["Predictable attacking patterns", "Struggles against low blocks"]
  },
  {
    "slug": "imanol-alguacil",
    "name": "Imanol Alguacil",
    "team": "Real Sociedad",
    "league": "La Liga",
    "pressureScore": 50,
    "status": "Stable",
    "trend": "up",
    "sackingOdds": "18/1",
    "recentResults": ["D", "L", "W", "W", "D"],
    "nextMatch": "vs Athletic Club (H)",
    "sentiment": "Local hero, but expectations are rising.",
    "topGrievances": ["Inconsistent away form", "Fatigue in late season"]
  },
  {
    "slug": "vincent-kompany",
    "name": "Vincent Kompany",
    "team": "Bayern Munich",
    "league": "Bundesliga",
    "pressureScore": 60,
    "status": "Under Scrutiny",
    "trend": "up",
    "sackingOdds": "10/1",
    "recentResults": ["W", "D", "L", "W", "W"],
    "nextMatch": "vs Borussia Dortmund (A)",
    "sentiment": "Board is patient but demands domestic dominance.",
    "topGrievances": ["Naive defending at times", "Struggles vs elite counter-attacks"]
  },
  {
    "slug": "nuri-sahin",
    "name": "Nuri Şahin",
    "team": "Borussia Dortmund",
    "league": "Bundesliga",
    "pressureScore": 55,
    "status": "Under Scrutiny",
    "trend": "flat",
    "sackingOdds": "14/1",
    "recentResults": ["W", "L", "W", "D", "L"],
    "nextMatch": "vs Bayern Munich (H)",
    "sentiment": "Promising tactical shifts, but results are patchy.",
    "topGrievances": ["Mental fragility in big games", "Set-piece defending"]
  },
  {
    "slug": "xabi-alonso",
    "name": "Xabi Alonso",
    "team": "Bayer Leverkusen",
    "league": "Bundesliga",
    "pressureScore": 20,
    "status": "Stable",
    "trend": "flat",
    "sackingOdds": "100/1",
    "recentResults": ["W", "W", "D", "W", "W"],
    "nextMatch": "vs RB Leipzig (H)",
    "sentiment": "Untouchable after recent successes.",
    "topGrievances": ["Occasional over-playing at the back", "None major"]
  },
  {
    "slug": "simone-inzaghi",
    "name": "Simone Inzaghi",
    "team": "Inter Milan",
    "league": "Serie A",
    "pressureScore": 25,
    "status": "Stable",
    "trend": "down",
    "sackingOdds": "40/1",
    "recentResults": ["W", "W", "W", "D", "W"],
    "nextMatch": "vs Juventus (A)",
    "sentiment": "Master of cup competitions and solid in league.",
    "topGrievances": ["Rotation predictability", "Slow starts to halves"]
  },
  {
    "slug": "thiago-motta",
    "name": "Thiago Motta",
    "team": "Juventus",
    "league": "Serie A",
    "pressureScore": 45,
    "status": "Stable",
    "trend": "flat",
    "sackingOdds": "20/1",
    "recentResults": ["W", "D", "W", "D", "W"],
    "nextMatch": "vs Inter Milan (H)",
    "sentiment": "Bringing a modern identity back to Turin.",
    "topGrievances": ["Lack of clinical edge", "Integrating new signings slowly"]
  },
  {
    "slug": "paulo-fonseca",
    "name": "Paulo Fonseca",
    "team": "AC Milan",
    "league": "Serie A",
    "pressureScore": 70,
    "status": "Under Fire",
    "trend": "up",
    "sackingOdds": "6/1",
    "recentResults": ["L", "W", "L", "D", "L"],
    "nextMatch": "vs Napoli (A)",
    "sentiment": "Fans impatient with defensive lapses.",
    "topGrievances": ["Soft center", "Poor game management when leading"]
  },
  {
    "slug": "luis-enrique",
    "name": "Luis Enrique",
    "team": "PSG",
    "league": "Ligue 1",
    "pressureScore": 35,
    "status": "Stable",
    "trend": "flat",
    "sackingOdds": "25/1",
    "recentResults": ["W", "W", "D", "W", "L"],
    "nextMatch": "vs Marseille (A)",
    "sentiment": "Building a younger, more dynamic team.",
    "topGrievances": ["Champions League away form", "Stubborn possession obsession"]
  },
  {
    "slug": "gennaro-gattuso",
    "name": "Gennaro Gattuso",
    "team": "Marseille",
    "league": "Ligue 1",
    "pressureScore": 80,
    "status": "Under Fire",
    "trend": "up",
    "sackingOdds": "4/1",
    "recentResults": ["D", "L", "L", "W", "L"],
    "nextMatch": "vs PSG (H)",
    "sentiment": "Volatile atmosphere, results not masking poor play.",
    "topGrievances": ["Lack of creativity", "Discipline issues", "Tactical rigidity"]
  },
  {
    "slug": "pep-guardiola",
    "name": "Pep Guardiola",
    "team": "Manchester City",
    "league": "Premier League",
    "pressureScore": 15,
    "status": "Stable",
    "trend": "flat",
    "sackingOdds": "150/1",
    "recentResults": ["W", "W", "W", "W", "D"],
    "nextMatch": "vs Liverpool (H)",
    "sentiment": "Total control.",
    "topGrievances": ["Overthinking in knockouts", "None really"]
  }
];

fs.writeFileSync(path.join(__dirname, 'data', 'manager_pressure.json'), JSON.stringify(managersData, null, 2));

const playersData = [];
const leagues = ["Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1"];
const positions = ["Striker", "Winger", "Attacking Midfielder", "Central Midfielder", "Defensive Midfielder", "Fullback", "Center Back", "Goalkeeper"];

let id = 1;
for (let i = 0; i < 65; i++) {
  const league = leagues[i % leagues.length];
  const position = positions[i % positions.length];
  playersData.push({
    "slug": `player-${id}`,
    "name": `Player Name ${id}`,
    "team": `Team ${id % 20}`,
    "league": league,
    "position": position,
    "nationality": "Unknown",
    "age": 20 + (i % 15),
    "seasonStats": {
      "goals": (i % 5 === 0) ? 15 : i % 5,
      "assists": i % 8,
      "appearances": 20 + (i % 10),
      "minutesPlayed": 1800 + (i * 10),
      "xG": 5.5 + (i % 3),
      "rating": (7.0 + (i % 15) * 0.1).toFixed(1)
    },
    "tacticalRole": "Detailed tactical role analysis goes here. The player is known for high intelligence and physical prowess on the pitch.",
    "strengths": ["Passing", "Vision", "Pace"],
    "weaknesses": ["Aerial duels", "Weak foot"],
    "relatedTags": [league, position.toLowerCase(), `team-${id % 20}`],
    "lastUpdated": "2026-09-25"
  });
  id++;
}

// Add a few realistic ones
playersData[0] = {
  "slug": "erling-haaland",
  "name": "Erling Haaland",
  "team": "Manchester City",
  "league": "Premier League",
  "position": "Striker",
  "nationality": "Norway",
  "age": 26,
  "seasonStats": {
    "goals": 24,
    "assists": 5,
    "appearances": 27,
    "minutesPlayed": 2340,
    "xG": 21.3,
    "rating": 8.2
  },
  "tacticalRole": "Elite poacher who operates exclusively in the penalty area. His movement patterns are designed to create separation in the final third. Rarely drops deep to link play, preferring to pin center-backs and make explosive runs in behind.",
  "strengths": ["Aerial duels", "Off-ball movement", "Clinical finishing", "Physical dominance"],
  "weaknesses": ["Link-up play outside the box", "Pressing consistency"],
  "relatedTags": ["Manchester City", "Premier League", "striker"],
  "lastUpdated": "2026-09-25"
};
playersData[1] = {
  "slug": "vinicius-junior",
  "name": "Vinícius Júnior",
  "team": "Real Madrid",
  "league": "La Liga",
  "position": "Winger",
  "nationality": "Brazil",
  "age": 26,
  "seasonStats": {
    "goals": 14,
    "assists": 12,
    "appearances": 25,
    "minutesPlayed": 2100,
    "xG": 12.1,
    "rating": 8.0
  },
  "tacticalRole": "Dynamic left-winger who excels in 1v1 situations. Primary ball progressor for Real Madrid in transitions.",
  "strengths": ["Dribbling", "Pace", "Chance creation"],
  "weaknesses": ["Defensive work rate", "Occasional decision making"],
  "relatedTags": ["Real Madrid", "La Liga", "winger"],
  "lastUpdated": "2026-09-25"
};

fs.writeFileSync(path.join(__dirname, 'data', 'players.json'), JSON.stringify(playersData, null, 2));

const leaguesData = [
  { "slug": "premier-league", "name": "Premier League", "country": "England", "teams": 20, "description": "The most-watched football league in the world, known for its high intensity, physical style, and competitive balance from top to bottom." },
  { "slug": "la-liga", "name": "La Liga", "country": "Spain", "teams": 20, "description": "Renowned for its technical quality and tactical sophistication, home to some of the world's most historic clubs." },
  { "slug": "bundesliga", "name": "Bundesliga", "country": "Germany", "teams": 18, "description": "Characterized by high-octane attacking football, packed stadiums, and a strong emphasis on fan culture and youth development." },
  { "slug": "serie-a", "name": "Serie A", "country": "Italy", "teams": 20, "description": "A league rich in history and tactical pedigree, experiencing a modern renaissance with increasingly attacking play styles." },
  { "slug": "ligue-1", "name": "Ligue 1", "country": "France", "teams": 18, "description": "The premier breeding ground for Europe's top talent, featuring a mix of raw athleticism and technical brilliance." }
];

fs.writeFileSync(path.join(__dirname, 'data', 'leagues.json'), JSON.stringify(leaguesData, null, 2));

console.log("Data generated.");
