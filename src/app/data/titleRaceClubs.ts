export interface TitleRaceClubDef {
  id: string;
  name: string;
  short: string;
  color: string;
  logo: string;
  league: "premier-league" | "la-liga" | "serie-a";
}

export const TITLE_RACE_CLUBS: TitleRaceClubDef[] = [
  // ── PREMIER LEAGUE ──────────────────────────────────────────────────────────
  { id: "arsenal", name: "Arsenal", short: "ARS", color: "#EF0107", logo: "https://resources.premierleague.com/premierleague/badges/50/t3.png", league: "premier-league" },
  { id: "astonvilla", name: "Aston Villa", short: "AVL", color: "#95BFE5", logo: "https://resources.premierleague.com/premierleague/badges/50/t7.png", league: "premier-league" },
  { id: "bournemouth", name: "Bournemouth", short: "BOU", color: "#B50E12", logo: "https://resources.premierleague.com/premierleague/badges/50/t91.png", league: "premier-league" },
  { id: "brentford", name: "Brentford", short: "BRE", color: "#E30613", logo: "https://resources.premierleague.com/premierleague/badges/50/t94.png", league: "premier-league" },
  { id: "brighton", name: "Brighton", short: "BHA", color: "#0057B8", logo: "https://resources.premierleague.com/premierleague/badges/50/t36.png", league: "premier-league" },
  { id: "chelsea", name: "Chelsea", short: "CHE", color: "#034694", logo: "https://resources.premierleague.com/premierleague/badges/50/t8.png", league: "premier-league" },
  { id: "crystalpalace", name: "Crystal Palace", short: "CRY", color: "#1B458F", logo: "https://resources.premierleague.com/premierleague/badges/50/t31.png", league: "premier-league" },
  { id: "everton", name: "Everton", short: "EVE", color: "#003399", logo: "https://resources.premierleague.com/premierleague/badges/50/t11.png", league: "premier-league" },
  { id: "fulham", name: "Fulham", short: "FUL", color: "#FFFFFF", logo: "https://resources.premierleague.com/premierleague/badges/50/t43.png", league: "premier-league" },
  { id: "ipswich", name: "Ipswich Town", short: "IPS", color: "#0022a1", logo: "https://resources.premierleague.com/premierleague/badges/50/t40.png", league: "premier-league" },
  { id: "leicester", name: "Leicester City", short: "LEI", color: "#003090", logo: "https://resources.premierleague.com/premierleague/badges/50/t13.png", league: "premier-league" },
  { id: "liverpool", name: "Liverpool", short: "LIV", color: "#C8102E", logo: "https://resources.premierleague.com/premierleague/badges/50/t14.png", league: "premier-league" },
  { id: "mancity", name: "Man City", short: "MCI", color: "#6CABDD", logo: "https://resources.premierleague.com/premierleague/badges/50/t43.png", league: "premier-league" },
  { id: "manunited", name: "Man United", short: "MUN", color: "#DA291C", logo: "https://resources.premierleague.com/premierleague/badges/50/t1.png", league: "premier-league" },
  { id: "newcastle", name: "Newcastle", short: "NEW", color: "#241F20", logo: "https://resources.premierleague.com/premierleague/badges/50/t4.png", league: "premier-league" },
  { id: "nottmforest", name: "Nott'm Forest", short: "NFO", color: "#DD0000", logo: "https://resources.premierleague.com/premierleague/badges/50/t17.png", league: "premier-league" },
  { id: "southampton", name: "Southampton", short: "SOU", color: "#D71920", logo: "https://resources.premierleague.com/premierleague/badges/50/t20.png", league: "premier-league" },
  { id: "tottenham", name: "Spurs", short: "TOT", color: "#132257", logo: "https://resources.premierleague.com/premierleague/badges/50/t6.png", league: "premier-league" },
  { id: "westham", name: "West Ham", short: "WHU", color: "#7A263A", logo: "https://resources.premierleague.com/premierleague/badges/50/t21.png", league: "premier-league" },
  { id: "wolves", name: "Wolves", short: "WOL", color: "#FDB913", logo: "https://resources.premierleague.com/premierleague/badges/50/t39.png", league: "premier-league" },

  // ── LA LIGA ─────────────────────────────────────────────────────────────────
  { id: "alaves", name: "Alavés", short: "ALA", color: "#003090", logo: "https://crests.football-data.org/263.png", league: "la-liga" },
  { id: "athletic", name: "Athletic Club", short: "ATH", color: "#EE2523", logo: "https://crests.football-data.org/77.png", league: "la-liga" },
  { id: "atletico", name: "Atlético Madrid", short: "ATM", color: "#CB3524", logo: "https://crests.football-data.org/78.png", league: "la-liga" },
  { id: "barcelona", name: "Barcelona", short: "BAR", color: "#004D98", logo: "https://crests.football-data.org/81.png", league: "la-liga" },
  { id: "celta", name: "Celta Vigo", short: "CEL", color: "#00A1E4", logo: "https://crests.football-data.org/558.png", league: "la-liga" },
  { id: "espanyol", name: "Espanyol", short: "ESP", color: "#1F51FF", logo: "https://crests.football-data.org/80.png", league: "la-liga" },
  { id: "getafe", name: "Getafe", short: "GET", color: "#004F9F", logo: "https://crests.football-data.org/82.png", league: "la-liga" },
  { id: "girona", name: "Girona", short: "GIR", color: "#DA291C", logo: "https://crests.football-data.org/298.png", league: "la-liga" },
  { id: "laspalmas", name: "Las Palmas", short: "LPA", color: "#F4D03F", logo: "https://crests.football-data.org/275.png", league: "la-liga" },
  { id: "leganes", name: "Leganés", short: "LEG", color: "#005A9C", logo: "https://crests.football-data.org/745.png", league: "la-liga" },
  { id: "mallorca", name: "Mallorca", short: "MLL", color: "#E30613", logo: "https://crests.football-data.org/89.png", league: "la-liga" },
  { id: "osasuna", name: "Osasuna", short: "OSA", color: "#D0112B", logo: "https://crests.football-data.org/79.png", league: "la-liga" },
  { id: "rayo", name: "Rayo Vallecano", short: "RAY", color: "#DA291C", logo: "https://crests.football-data.org/87.png", league: "la-liga" },
  { id: "betis", name: "Real Betis", short: "BET", color: "#0BB363", logo: "https://crests.football-data.org/90.png", league: "la-liga" },
  { id: "realmadrid", name: "Real Madrid", short: "RMA", color: "#FFFFFF", logo: "https://crests.football-data.org/86.png", league: "la-liga" },
  { id: "realsociedad", name: "Real Sociedad", short: "RSO", color: "#005A9C", logo: "https://crests.football-data.org/92.png", league: "la-liga" },
  { id: "sevilla", name: "Sevilla", short: "SEV", color: "#F4F4F4", logo: "https://crests.football-data.org/559.png", league: "la-liga" },
  { id: "valencia", name: "Valencia", short: "VAL", color: "#000000", logo: "https://crests.football-data.org/95.png", league: "la-liga" },
  { id: "valladolid", name: "Valladolid", short: "VLL", color: "#8B008B", logo: "https://crests.football-data.org/250.png", league: "la-liga" },
  { id: "villarreal", name: "Villarreal", short: "VIL", color: "#FFD700", logo: "https://crests.football-data.org/94.png", league: "la-liga" },

  // ── SERIE A ─────────────────────────────────────────────────────────────────
  { id: "atalanta", name: "Atalanta", short: "ATA", color: "#005A9C", logo: "https://crests.football-data.org/102.png", league: "serie-a" },
  { id: "bologna", name: "Bologna", short: "BOL", color: "#002D57", logo: "https://crests.football-data.org/103.png", league: "serie-a" },
  { id: "cagliari", name: "Cagliari", short: "CAG", color: "#0B254E", logo: "https://crests.football-data.org/104.png", league: "serie-a" },
  { id: "como", name: "Como", short: "COM", color: "#004B87", logo: "https://crests.football-data.org/7397.png", league: "serie-a" },
  { id: "empoli", name: "Empoli", short: "EMP", color: "#005CA9", logo: "https://crests.football-data.org/445.png", league: "serie-a" },
  { id: "fiorentina", name: "Fiorentina", short: "FIO", color: "#482E92", logo: "https://crests.football-data.org/99.png", league: "serie-a" },
  { id: "genoa", name: "Genoa", short: "GEN", color: "#A61A2F", logo: "https://crests.football-data.org/107.png", league: "serie-a" },
  { id: "inter", name: "Inter Milan", short: "INT", color: "#001E60", logo: "https://crests.football-data.org/108.png", league: "serie-a" },
  { id: "juventus", name: "Juventus", short: "JUV", color: "#000000", logo: "https://crests.football-data.org/109.png", league: "serie-a" },
  { id: "lazio", name: "Lazio", short: "LAZ", color: "#87CEEB", logo: "https://crests.football-data.org/110.png", league: "serie-a" },
  { id: "lecce", name: "Lecce", short: "LEC", color: "#FFD700", logo: "https://crests.football-data.org/3459.png", league: "serie-a" },
  { id: "acmilan", name: "AC Milan", short: "MIL", color: "#FB090B", logo: "https://crests.football-data.org/98.png", league: "serie-a" },
  { id: "monza", name: "Monza", short: "MON", color: "#DA291C", logo: "https://crests.football-data.org/5911.png", league: "serie-a" },
  { id: "napoli", name: "Napoli", short: "NAP", color: "#003C82", logo: "https://crests.football-data.org/113.png", league: "serie-a" },
  { id: "parma", name: "Parma", short: "PAR", color: "#FFCE00", logo: "https://crests.football-data.org/112.png", league: "serie-a" },
  { id: "roma", name: "Roma", short: "ROM", color: "#8E1F2F", logo: "https://crests.football-data.org/100.png", league: "serie-a" },
  { id: "torino", name: "Torino", short: "TOR", color: "#8A1538", logo: "https://crests.football-data.org/586.png", league: "serie-a" },
  { id: "udinese", name: "Udinese", short: "UDI", color: "#000000", logo: "https://crests.football-data.org/115.png", league: "serie-a" },
  { id: "venezia", name: "Venezia", short: "VEN", color: "#F47C1C", logo: "https://crests.football-data.org/454.png", league: "serie-a" },
  { id: "verona", name: "Verona", short: "VER", color: "#002E6D", logo: "https://crests.football-data.org/450.png", league: "serie-a" },
];
