export interface PlayerStats {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
    vision: number;
    positioning: number;
}

export interface Player {
    id: string;
    name: string;
    fullName: string;
    team: string;
    league: string;
    position: string;
    nationality: string;
    age: number;
    image: string;
    teamColor: string;
    stats: PlayerStats;
}

export const STAT_LABELS: Record<keyof PlayerStats, string> = {
    pace: "Pace",
    shooting: "Shooting",
    passing: "Passing",
    dribbling: "Dribbling",
    defending: "Defending",
    physical: "Physical",
    vision: "Vision",
    positioning: "Positioning",
};

export const players: Player[] = [
    // ── Premier League ──
    { id: "haaland", name: "Haaland", fullName: "Erling Haaland", team: "Manchester City", league: "Premier League", position: "ST", nationality: "🇳🇴 Norway", age: 25, image: "https://img.a.transfermarkt.technology/portrait/header/418560-1694590254.jpg", teamColor: "#6CABDD", stats: { pace: 89, shooting: 93, passing: 65, dribbling: 78, defending: 45, physical: 91, vision: 68, positioning: 95 } },
    { id: "salah", name: "Salah", fullName: "Mohamed Salah", team: "Liverpool", league: "Premier League", position: "RW", nationality: "🇪🇬 Egypt", age: 33, image: "https://img.a.transfermarkt.technology/portrait/header/148455-1711523515.jpg", teamColor: "#C8102E", stats: { pace: 90, shooting: 89, passing: 81, dribbling: 90, defending: 45, physical: 75, vision: 82, positioning: 90 } },
    { id: "saka", name: "Saka", fullName: "Bukayo Saka", team: "Arsenal", league: "Premier League", position: "RW", nationality: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", age: 24, image: "https://img.a.transfermarkt.technology/portrait/header/433177-1694590376.jpg", teamColor: "#EF0107", stats: { pace: 88, shooting: 82, passing: 83, dribbling: 88, defending: 62, physical: 72, vision: 80, positioning: 85 } },
    { id: "rice", name: "Rice", fullName: "Declan Rice", team: "Arsenal", league: "Premier League", position: "CDM", nationality: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", age: 27, image: "https://img.a.transfermarkt.technology/portrait/header/357662-1694590291.jpg", teamColor: "#EF0107", stats: { pace: 74, shooting: 68, passing: 80, dribbling: 76, defending: 87, physical: 86, vision: 78, positioning: 79 } },
    { id: "palmer", name: "Palmer", fullName: "Cole Palmer", team: "Chelsea", league: "Premier League", position: "CAM", nationality: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", age: 23, image: "https://img.a.transfermarkt.technology/portrait/header/568177-1694590363.jpg", teamColor: "#034694", stats: { pace: 78, shooting: 86, passing: 84, dribbling: 86, defending: 40, physical: 62, vision: 85, positioning: 87 } },
    { id: "son", name: "Son", fullName: "Heung-min Son", team: "Tottenham", league: "Premier League", position: "LW", nationality: "🇰🇷 South Korea", age: 33, image: "https://img.a.transfermarkt.technology/portrait/header/91845-1694590290.jpg", teamColor: "#132257", stats: { pace: 88, shooting: 87, passing: 79, dribbling: 86, defending: 42, physical: 69, vision: 78, positioning: 89 } },
    { id: "brunofernandes", name: "B. Fernandes", fullName: "Bruno Fernandes", team: "Manchester United", league: "Premier League", position: "CAM", nationality: "🇵🇹 Portugal", age: 31, image: "https://img.a.transfermarkt.technology/portrait/header/240306-1694590284.jpg", teamColor: "#DA291C", stats: { pace: 70, shooting: 84, passing: 89, dribbling: 82, defending: 64, physical: 72, vision: 90, positioning: 84 } },
    { id: "debruyne", name: "De Bruyne", fullName: "Kevin De Bruyne", team: "Manchester City", league: "Premier League", position: "CAM", nationality: "🇧🇪 Belgium", age: 34, image: "https://img.a.transfermarkt.technology/portrait/header/88755-1694590350.jpg", teamColor: "#6CABDD", stats: { pace: 72, shooting: 85, passing: 93, dribbling: 86, defending: 58, physical: 74, vision: 95, positioning: 86 } },
    { id: "odegaard", name: "Ødegaard", fullName: "Martin Ødegaard", team: "Arsenal", league: "Premier League", position: "CAM", nationality: "🇳🇴 Norway", age: 27, image: "https://img.a.transfermarkt.technology/portrait/header/316264-1694590323.jpg", teamColor: "#EF0107", stats: { pace: 72, shooting: 79, passing: 88, dribbling: 87, defending: 58, physical: 62, vision: 91, positioning: 83 } },
    { id: "vanDijk", name: "Van Dijk", fullName: "Virgil van Dijk", team: "Liverpool", league: "Premier League", position: "CB", nationality: "🇳🇱 Netherlands", age: 34, image: "https://img.a.transfermarkt.technology/portrait/header/139208-1694590248.jpg", teamColor: "#C8102E", stats: { pace: 72, shooting: 55, passing: 76, dribbling: 65, defending: 92, physical: 90, vision: 72, positioning: 88 } },
    { id: "isak", name: "Isak", fullName: "Alexander Isak", team: "Newcastle", league: "Premier League", position: "ST", nationality: "🇸🇪 Sweden", age: 26, image: "https://img.a.transfermarkt.technology/portrait/header/375612-1694590330.jpg", teamColor: "#241F20", stats: { pace: 88, shooting: 85, passing: 72, dribbling: 84, defending: 38, physical: 76, vision: 74, positioning: 87 } },
    { id: "foden", name: "Foden", fullName: "Phil Foden", team: "Manchester City", league: "Premier League", position: "LW", nationality: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", age: 25, image: "https://img.a.transfermarkt.technology/portrait/header/406635-1694590361.jpg", teamColor: "#6CABDD", stats: { pace: 84, shooting: 82, passing: 84, dribbling: 89, defending: 52, physical: 64, vision: 85, positioning: 84 } },

    // ── La Liga ──
    { id: "vinicius", name: "Vinícius Jr", fullName: "Vinícius Júnior", team: "Real Madrid", league: "La Liga", position: "LW", nationality: "🇧🇷 Brazil", age: 25, image: "https://img.a.transfermarkt.technology/portrait/header/371998-1694590268.jpg", teamColor: "#FEBE10", stats: { pace: 95, shooting: 83, passing: 76, dribbling: 93, defending: 32, physical: 68, vision: 76, positioning: 85 } },
    { id: "bellingham", name: "Bellingham", fullName: "Jude Bellingham", team: "Real Madrid", league: "La Liga", position: "CAM", nationality: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", age: 22, image: "https://img.a.transfermarkt.technology/portrait/header/581678-1694590389.jpg", teamColor: "#FEBE10", stats: { pace: 78, shooting: 82, passing: 82, dribbling: 85, defending: 72, physical: 82, vision: 83, positioning: 86 } },
    { id: "yamal", name: "Yamal", fullName: "Lamine Yamal", team: "Barcelona", league: "La Liga", position: "RW", nationality: "🇪🇸 Spain", age: 18, image: "https://img.a.transfermarkt.technology/portrait/header/930694-1718607498.jpg", teamColor: "#A50044", stats: { pace: 90, shooting: 78, passing: 82, dribbling: 90, defending: 30, physical: 58, vision: 84, positioning: 80 } },
    { id: "pedri", name: "Pedri", fullName: "Pedri González", team: "Barcelona", league: "La Liga", position: "CM", nationality: "🇪🇸 Spain", age: 23, image: "https://img.a.transfermarkt.technology/portrait/header/901307-1694590380.jpg", teamColor: "#A50044", stats: { pace: 73, shooting: 70, passing: 88, dribbling: 89, defending: 68, physical: 64, vision: 90, positioning: 80 } },
    { id: "mbappe", name: "Mbappé", fullName: "Kylian Mbappé", team: "Real Madrid", league: "La Liga", position: "ST", nationality: "🇫🇷 France", age: 27, image: "https://img.a.transfermarkt.technology/portrait/header/342229-1694590234.jpg", teamColor: "#FEBE10", stats: { pace: 97, shooting: 90, passing: 74, dribbling: 92, defending: 35, physical: 78, vision: 77, positioning: 93 } },
    { id: "lewandowski", name: "Lewandowski", fullName: "Robert Lewandowski", team: "Barcelona", league: "La Liga", position: "ST", nationality: "🇵🇱 Poland", age: 37, image: "https://img.a.transfermarkt.technology/portrait/header/38253-1694590268.jpg", teamColor: "#A50044", stats: { pace: 64, shooting: 91, passing: 74, dribbling: 78, defending: 42, physical: 78, vision: 76, positioning: 94 } },
    { id: "modric", name: "Modrić", fullName: "Luka Modrić", team: "Real Madrid", league: "La Liga", position: "CM", nationality: "🇭🇷 Croatia", age: 40, image: "https://img.a.transfermarkt.technology/portrait/header/27992-1694590233.jpg", teamColor: "#FEBE10", stats: { pace: 62, shooting: 72, passing: 90, dribbling: 86, defending: 68, physical: 60, vision: 93, positioning: 82 } },

    // ── Bundesliga ──
    { id: "musiala", name: "Musiala", fullName: "Jamal Musiala", team: "Bayern Munich", league: "Bundesliga", position: "CAM", nationality: "🇩🇪 Germany", age: 22, image: "https://img.a.transfermarkt.technology/portrait/header/580195-1694590362.jpg", teamColor: "#DC052D", stats: { pace: 82, shooting: 78, passing: 82, dribbling: 92, defending: 42, physical: 62, vision: 84, positioning: 82 } },
    { id: "wirtz", name: "Wirtz", fullName: "Florian Wirtz", team: "Bayer Leverkusen", league: "Bundesliga", position: "CAM", nationality: "🇩🇪 Germany", age: 22, image: "https://img.a.transfermarkt.technology/portrait/header/521361-1694590356.jpg", teamColor: "#E32221", stats: { pace: 78, shooting: 80, passing: 86, dribbling: 90, defending: 45, physical: 60, vision: 88, positioning: 83 } },
    { id: "kimmich", name: "Kimmich", fullName: "Joshua Kimmich", team: "Bayern Munich", league: "Bundesliga", position: "CDM", nationality: "🇩🇪 Germany", age: 31, image: "https://img.a.transfermarkt.technology/portrait/header/161056-1694590348.jpg", teamColor: "#DC052D", stats: { pace: 68, shooting: 70, passing: 88, dribbling: 78, defending: 84, physical: 76, vision: 88, positioning: 82 } },
    { id: "sane", name: "Sané", fullName: "Leroy Sané", team: "Bayern Munich", league: "Bundesliga", position: "RW", nationality: "🇩🇪 Germany", age: 30, image: "https://img.a.transfermarkt.technology/portrait/header/192565-1694590296.jpg", teamColor: "#DC052D", stats: { pace: 92, shooting: 80, passing: 78, dribbling: 86, defending: 38, physical: 65, vision: 78, positioning: 82 } },

    // ── Serie A ──
    { id: "lautaro", name: "Lautaro", fullName: "Lautaro Martínez", team: "Inter Milan", league: "Serie A", position: "ST", nationality: "🇦🇷 Argentina", age: 28, image: "https://img.a.transfermarkt.technology/portrait/header/406625-1694590359.jpg", teamColor: "#0068A8", stats: { pace: 82, shooting: 86, passing: 70, dribbling: 80, defending: 48, physical: 80, vision: 72, positioning: 88 } },
    { id: "osimhen", name: "Osimhen", fullName: "Victor Osimhen", team: "Napoli", league: "Serie A", position: "ST", nationality: "🇳🇬 Nigeria", age: 27, image: "https://img.a.transfermarkt.technology/portrait/header/401923-1694590344.jpg", teamColor: "#12A0D7", stats: { pace: 90, shooting: 85, passing: 58, dribbling: 75, defending: 40, physical: 85, vision: 62, positioning: 90 } },
    { id: "leao", name: "Leão", fullName: "Rafael Leão", team: "AC Milan", league: "Serie A", position: "LW", nationality: "🇵🇹 Portugal", age: 26, image: "https://img.a.transfermarkt.technology/portrait/header/461638-1694590341.jpg", teamColor: "#FB090B", stats: { pace: 94, shooting: 78, passing: 72, dribbling: 88, defending: 30, physical: 72, vision: 72, positioning: 80 } },

    // ── Ligue 1 ──
    { id: "dembele", name: "Dembélé", fullName: "Ousmane Dembélé", team: "PSG", league: "Ligue 1", position: "RW", nationality: "🇫🇷 France", age: 28, image: "https://img.a.transfermarkt.technology/portrait/header/288230-1694590280.jpg", teamColor: "#004170", stats: { pace: 93, shooting: 76, passing: 79, dribbling: 90, defending: 35, physical: 65, vision: 76, positioning: 78 } },

    // ── Legends ──
    { id: "messi", name: "Messi", fullName: "Lionel Messi", team: "Inter Miami", league: "MLS", position: "RW", nationality: "🇦🇷 Argentina", age: 38, image: "https://img.a.transfermarkt.technology/portrait/header/28003-1694590254.jpg", teamColor: "#F7B5CD", stats: { pace: 72, shooting: 88, passing: 91, dribbling: 94, defending: 34, physical: 58, vision: 95, positioning: 92 } },
    { id: "ronaldo", name: "Ronaldo", fullName: "Cristiano Ronaldo", team: "Al Nassr", league: "Saudi Pro League", position: "ST", nationality: "🇵🇹 Portugal", age: 41, image: "https://img.a.transfermarkt.technology/portrait/header/8198-1694590254.jpg", teamColor: "#FFC72C", stats: { pace: 74, shooting: 90, passing: 72, dribbling: 82, defending: 38, physical: 80, vision: 72, positioning: 95 } },
    { id: "neymar", name: "Neymar", fullName: "Neymar Jr", team: "Santos", league: "Brazilian Serie A", position: "LW", nationality: "🇧🇷 Brazil", age: 34, image: "https://img.a.transfermarkt.technology/portrait/header/68290-1694590254.jpg", teamColor: "#000000", stats: { pace: 78, shooting: 82, passing: 86, dribbling: 92, defending: 32, physical: 56, vision: 88, positioning: 82 } },

    // ── More Top Players ──
    { id: "rodri", name: "Rodri", fullName: "Rodrigo Hernández", team: "Manchester City", league: "Premier League", position: "CDM", nationality: "🇪🇸 Spain", age: 29, image: "https://img.a.transfermarkt.technology/portrait/header/357565-1694590330.jpg", teamColor: "#6CABDD", stats: { pace: 62, shooting: 72, passing: 87, dribbling: 80, defending: 86, physical: 84, vision: 86, positioning: 84 } },
    { id: "taa", name: "Alexander-Arnold", fullName: "Trent Alexander-Arnold", team: "Liverpool", league: "Premier League", position: "RB", nationality: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", age: 27, image: "https://img.a.transfermarkt.technology/portrait/header/314353-1694590299.jpg", teamColor: "#C8102E", stats: { pace: 72, shooting: 68, passing: 90, dribbling: 74, defending: 72, physical: 68, vision: 90, positioning: 74 } },
    { id: "saliba", name: "Saliba", fullName: "William Saliba", team: "Arsenal", league: "Premier League", position: "CB", nationality: "🇫🇷 France", age: 25, image: "https://img.a.transfermarkt.technology/portrait/header/516374-1694590373.jpg", teamColor: "#EF0107", stats: { pace: 78, shooting: 38, passing: 72, dribbling: 65, defending: 88, physical: 84, vision: 68, positioning: 85 } },
    { id: "hakimi", name: "Hakimi", fullName: "Achraf Hakimi", team: "PSG", league: "Ligue 1", position: "RB", nationality: "🇲🇦 Morocco", age: 27, image: "https://img.a.transfermarkt.technology/portrait/header/398073-1694590315.jpg", teamColor: "#004170", stats: { pace: 93, shooting: 68, passing: 76, dribbling: 78, defending: 78, physical: 76, vision: 72, positioning: 80 } },
    { id: "gavi", name: "Gavi", fullName: "Pablo Gavi", team: "Barcelona", league: "La Liga", position: "CM", nationality: "🇪🇸 Spain", age: 21, image: "https://img.a.transfermarkt.technology/portrait/header/855550-1694590389.jpg", teamColor: "#A50044", stats: { pace: 78, shooting: 68, passing: 82, dribbling: 83, defending: 72, physical: 72, vision: 82, positioning: 76 } },
    { id: "havertz", name: "Havertz", fullName: "Kai Havertz", team: "Arsenal", league: "Premier League", position: "CF", nationality: "🇩🇪 Germany", age: 26, image: "https://img.a.transfermarkt.technology/portrait/header/309400-1694590296.jpg", teamColor: "#EF0107", stats: { pace: 74, shooting: 78, passing: 76, dribbling: 78, defending: 55, physical: 78, vision: 76, positioning: 82 } },
    { id: "nunez", name: "Núñez", fullName: "Darwin Núñez", team: "Liverpool", league: "Premier League", position: "ST", nationality: "🇺🇾 Uruguay", age: 26, image: "https://img.a.transfermarkt.technology/portrait/header/546543-1694590370.jpg", teamColor: "#C8102E", stats: { pace: 92, shooting: 80, passing: 58, dribbling: 74, defending: 40, physical: 82, vision: 60, positioning: 82 } },
    { id: "diaz", name: "L. Díaz", fullName: "Luis Díaz", team: "Liverpool", league: "Premier League", position: "LW", nationality: "🇨🇴 Colombia", age: 28, image: "https://img.a.transfermarkt.technology/portrait/header/480692-1694590348.jpg", teamColor: "#C8102E", stats: { pace: 90, shooting: 76, passing: 72, dribbling: 86, defending: 48, physical: 70, vision: 72, positioning: 80 } },
    { id: "grealish", name: "Grealish", fullName: "Jack Grealish", team: "Manchester City", league: "Premier League", position: "LW", nationality: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", age: 30, image: "https://img.a.transfermarkt.technology/portrait/header/340557-1694590301.jpg", teamColor: "#6CABDD", stats: { pace: 80, shooting: 72, passing: 82, dribbling: 88, defending: 42, physical: 68, vision: 80, positioning: 76 } },
    { id: "watkins", name: "Watkins", fullName: "Ollie Watkins", team: "Aston Villa", league: "Premier League", position: "ST", nationality: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", age: 30, image: "https://img.a.transfermarkt.technology/portrait/header/333466-1694590304.jpg", teamColor: "#670E36", stats: { pace: 84, shooting: 82, passing: 72, dribbling: 78, defending: 42, physical: 78, vision: 72, positioning: 86 } },
    { id: "raphinha", name: "Raphinha", fullName: "Raphael Dias Belloli", team: "Barcelona", league: "La Liga", position: "RW", nationality: "🇧🇷 Brazil", age: 29, image: "https://img.a.transfermarkt.technology/portrait/header/316023-1694590311.jpg", teamColor: "#A50044", stats: { pace: 87, shooting: 80, passing: 78, dribbling: 85, defending: 50, physical: 72, vision: 76, positioning: 82 } },
];

export function searchPlayers(query: string): Player[] {
    if (!query.trim()) return players;
    const q = query.toLowerCase();
    return players.filter(
        (p) =>
            p.name.toLowerCase().includes(q) ||
            p.fullName.toLowerCase().includes(q) ||
            p.team.toLowerCase().includes(q) ||
            p.position.toLowerCase().includes(q) ||
            p.nationality.toLowerCase().includes(q)
    );
}

export function getPlayerById(id: string): Player | undefined {
    return players.find((p) => p.id === id);
}

export function getLeagues(): string[] {
    return [...new Set(players.map((p) => p.league))];
}

export function getPlayersByLeague(league: string): Player[] {
    return players.filter((p) => p.league === league);
}
