export interface ClubColor {
    primary: string;
    light: string;
}

export const CLUB_COLORS: Record<string, ClubColor> = {
    // Default PitchSide Green
    "default": { primary: "var(--theme-primary)", light: "var(--theme-light)" },

    // Premier League Clubs
    "Arsenal": { primary: "#EF0107", light: "#F25458" },
    "Aston Villa": { primary: "#95BFE5", light: "#BEE1FF" }, // Using their light blue accent or Claret (#670E36). Let's use Claret. Wait, Claret is primary, blue is light.
    "Bournemouth": { primary: "#B50E12", light: "#E03A3E" },
    "Brentford": { primary: "#E30613", light: "#FF4D55" },
    "Brighton": { primary: "#0057B8", light: "#4D9EF0" },
    "Chelsea": { primary: "#034694", light: "#4B8BE0" },
    "Crystal Palace": { primary: "#1B458F", light: "#527BD2" },
    "Everton": { primary: "#003399", light: "#4D7BE0" },
    "Fulham": { primary: "#CC0000", light: "#FF4D4D" }, // Red accent for Fulham or black/white
    "Ipswich Town": { primary: "#001B69", light: "#405BB0" },
    "Leicester City": { primary: "#003090", light: "#4D76D6" },
    "Liverpool": { primary: "#C8102E", light: "#F54E62" },
    "Manchester City": { primary: "#6CABDD", light: "#A3D4FB" },
    "Manchester United": { primary: "#DA291C", light: "#FF594F" },
    "Newcastle United": { primary: "#241F20", light: "#6B6566" },
    "Nottingham Forest": { primary: "#E53233", light: "#FF6E6E" },
    "Southampton": { primary: "#D71920", light: "#FF5E63" },
    "Tottenham Hotspur": { primary: "#132257", light: "#5060A0" },
    "West Ham United": { primary: "#7A263A", light: "#B35A70" },
    "Wolverhampton": { primary: "#FDB913", light: "#FFD868" },

    // La Liga
    "Real Madrid": { primary: "#00529F", light: "#4D95DF" },
    "Barcelona": { primary: "#A50044", light: "#DB407B" },
    "Atletico Madrid": { primary: "#CB3524", light: "#FA6E5E" },

    // Serie A
    "Juventus": { primary: "#000000", light: "#4A4A4A" },
    "AC Milan": { primary: "#FB090B", light: "#FF5C5E" },
    "Inter Milan": { primary: "#010E80", light: "#3F4DBE" },

    // Bundesliga
    "Bayern Munich": { primary: "#DC052D", light: "#FF5270" },
    "Borussia Dortmund": { primary: "#FDE100", light: "#FFF166" },
};
