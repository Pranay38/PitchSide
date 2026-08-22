import type { ClubReportCard } from "../components/TransferReportCard";

export interface TransferReportCards {
  window: string;
  season: string;
  enabled: boolean;
  lastUpdated: string;
  clubs: ClubReportCard[];
}

export const defaultTransferReportCards: TransferReportCards = {
  window: "Summer 2025",
  season: "2025-26",
  enabled: true,
  lastUpdated: "2025-09-02",
  clubs: [
    {
      club: "Arsenal",
      league: "Premier League",
      grades: {
        incomings: {
          grade: "A",
          comment: "Statement window. Addressed every position of need.",
          names: ["V. Osimhen (€75M)", "M. Salah (Free)", "M. Merino (€32M)"]
        },
        outgoings: {
          grade: "B+",
          comment: "Managed departures well, got fair fees.",
          names: ["E. Nketiah (€30M)", "Fabio Vieira (€18M)", "A. Ramsdale (€21M)"]
        },
        valueForMoney: {
          grade: "A-",
          comment: "Salah on a free is elite business."
        },
        squadBalance: {
          grade: "B+",
          comment: "Still light at left-back but improved depth across the spine."
        },
        overall: {
          grade: "A-",
          comment: "Genuine title contenders"
        }
      },
      teachersComment: "Excellent window showing real ambition. The Salah signing on a free is the deal of the summer. Osimhen gives them the ruthless #9 they've lacked in two title run-ins. Arteta is finally running out of excuses.",
      totalSpend: "€107M",
      totalIncome: "€69M",
      netSpend: "€38M"
    },
    {
      club: "Chelsea",
      league: "Premier League",
      grades: {
        incomings: {
          grade: "C-",
          comment: "Signed 7 more South American teenagers and another backup goalkeeper.",
          names: ["Estêvão Willian (€34M)", "J. Duran (€55M)", "F. Jørgensen (€24M)", "A. Anselmino (€18M)"]
        },
        outgoings: {
          grade: "D",
          comment: "Failed to permanently shift deadwood; created a 42-man training circus.",
          names: ["R. Sterling (Loan)", "R. Lukaku (€30M)", "A. Broja (Loan)", "K. Arrizabalaga (Loan)"]
        },
        valueForMoney: {
          grade: "D+",
          comment: "Amortizing 8-year contracts until the heat death of the universe."
        },
        squadBalance: {
          grade: "F",
          comment: "They need two dressing rooms and a traffic warden at Cobham."
        },
        overall: {
          grade: "D+",
          comment: "Chaotic experiment"
        }
      },
      teachersComment: "Todd Boehly operates like a teenager playing Football Manager with infinite money cheat codes. Four goalkeepers, eight wingers, zero defensive midfielders who can stay fit. Needs to sit in the corner and reflect on amortization.",
      totalSpend: "€131M",
      totalIncome: "€30M",
      netSpend: "€101M"
    },
    {
      club: "Manchester City",
      league: "Premier League",
      grades: {
        incomings: {
          grade: "B+",
          comment: "Surgical precision as always, replaced departing stars with plug-and-play monsters.",
          names: ["Savinho (€40M)", "I. Gündoğan (Free)", "J. Neves (€60M)"]
        },
        outgoings: {
          grade: "A-",
          comment: "Generated massive profits from academy graduates and fringe stars.",
          names: ["J. Álvarez (€75M)", "J. Cancelo (€25M)", "S. Gómez (€9M)"]
        },
        valueForMoney: {
          grade: "A",
          comment: "Turned a net profit while upgrading the squad. Unfair."
        },
        squadBalance: {
          grade: "A-",
          comment: "Guardiola could field 11 midfielders and still win 4-0."
        },
        overall: {
          grade: "A",
          comment: "Machine-like efficiency"
        }
      },
      teachersComment: "Cold, clinical, and slightly sickening in its perfection. Selling Julián Álvarez for massive profit and replacing him seamlessly while maintaining a net positive spend is why everyone else in the league is chasing shadows.",
      totalSpend: "€100M",
      totalIncome: "€109M",
      netSpend: "-€9M"
    },
    {
      club: "Real Madrid",
      league: "La Liga",
      grades: {
        incomings: {
          grade: "A+",
          comment: "Galácticos 3.0 assembled for pennies in transfer fees.",
          names: ["K. Mbappé (Free)", "Endrick (€47M)", "A. Davies (Free)"]
        },
        outgoings: {
          grade: "B",
          comment: "Kroos retired gracefully; fringe veterans left with winners' medals.",
          names: ["Joselu (€1.5M)", "Nacho (Free)", "T. Kroos (Retired)"]
        },
        valueForMoney: {
          grade: "A+",
          comment: "Signing the world's best player on a free is daylight robbery."
        },
        squadBalance: {
          grade: "B+",
          comment: "Who needs defenders when your front three averages 35 goals each?"
        },
        overall: {
          grade: "A+",
          comment: "Football royalty flexing"
        }
      },
      teachersComment: "Florentino Pérez has done it again. Landing Kylian Mbappé on a free transfer while the rest of Europe panics over PSR is supreme executive mastery. An embarrassment of attacking riches that will terrorize Champions League nights for a decade.",
      totalSpend: "€47M",
      totalIncome: "€2M",
      netSpend: "€45M"
    },
    {
      club: "Barcelona",
      league: "La Liga",
      grades: {
        incomings: {
          grade: "B-",
          comment: "Pulled three financial levers just to register Dani Olmo at 11:59 PM.",
          names: ["Dani Olmo (€55M)", "P. Víctor (€3M)"]
        },
        outgoings: {
          grade: "C+",
          comment: "Forced Ilkay Gündogan out to free up wage bill space.",
          names: ["I. Gündoğan (Free)", "M. Faye (€10M)", "J. Félix (End of Loan)"]
        },
        valueForMoney: {
          grade: "C",
          comment: "Overpaid for Olmo given the desperate need for a holding pivot."
        },
        squadBalance: {
          grade: "C-",
          comment: "One midfield injury away from having to start a 15-year-old from La Masia."
        },
        overall: {
          grade: "C+",
          comment: "Surviving on vibes and youth"
        }
      },
      teachersComment: "A dramatic soap opera as per usual. Letting Gündoğan leave for €0 just to register Olmo is peak Catalan accounting gymnastics. If Lamine Yamal catches a cold, the entire tactical system collapses. God bless La Masia.",
      totalSpend: "€58M",
      totalIncome: "€10M",
      netSpend: "€48M"
    },
    {
      club: "Bayern Munich",
      league: "Bundesliga",
      grades: {
        incomings: {
          grade: "A-",
          comment: "Addressed their biggest flaws with proven Premier League steel.",
          names: ["M. Olise (€53M)", "J. Palhinha (€51M)", "H. Ito (€23M)"]
        },
        outgoings: {
          grade: "B-",
          comment: "De Ligt departure sparked fan petitions, but cleared huge wages.",
          names: ["M. de Ligt (€45M)", "N. Mazraoui (€15M)", "M. Tillman (€12M)"]
        },
        valueForMoney: {
          grade: "B+",
          comment: "Paid high fees, but Olise and Palhinha directly solve structural issues."
        },
        squadBalance: {
          grade: "A-",
          comment: "Kompany has a physical, dynamic squad built to reclaim the Meisterschale."
        },
        overall: {
          grade: "A-",
          comment: "Title redemption inbound"
        }
      },
      teachersComment: "Vincent Kompany got the defensive destroyer Bayern have craved since Javi Martínez retired in João Palhinha. Michael Olise is an electrifying addition. Losing De Ligt hurts the fans, but this squad is built to reclaim the Bundesliga crown from Leverkusen.",
      totalSpend: "€127M",
      totalIncome: "€72M",
      netSpend: "€55M"
    }
  ]
};

export function normalizeTransferReportCards(input?: Partial<TransferReportCards> | null): TransferReportCards {
  if (!input) return defaultTransferReportCards;
  
  return {
    window: String(input.window || defaultTransferReportCards.window),
    season: String(input.season || defaultTransferReportCards.season),
    enabled: input.enabled ?? defaultTransferReportCards.enabled,
    lastUpdated: String(input.lastUpdated || defaultTransferReportCards.lastUpdated),
    clubs: Array.isArray(input.clubs) ? input.clubs : defaultTransferReportCards.clubs,
  };
}
