"use client";


import { getClubByName } from "@/app/data/clubs";

export interface GradeEntry {
  grade: string;
  comment: string;
  names?: string[];
}

export interface ClubReportCard {
  club: string;
  league: string;
  grades: {
    incomings: GradeEntry;
    outgoings: GradeEntry;
    valueForMoney: GradeEntry;
    squadBalance: GradeEntry;
    overall: GradeEntry;
  };
  teachersComment: string;
  totalSpend: string;
  totalIncome: string;
  netSpend: string;
}

const getGradeColor = (grade: string) => {
  if (grade.startsWith("A")) return "bg-[#16A34A]";
  if (grade.startsWith("B")) return "bg-[#65A30D]";
  if (grade.startsWith("C")) return "bg-[#D97706]";
  if (grade === "D") return "bg-[#DC2626]";
  if (grade === "F") return "bg-[#991B1B]";
  return "bg-gray-500";
};

export function TransferReportCard({ card }: { card: ClubReportCard }) {
  const clubData = getClubByName(card.club);

  const subjects = [
    { id: "incomings", title: "Incomings", data: card.grades.incomings },
    { id: "outgoings", title: "Outgoings", data: card.grades.outgoings },
    { id: "valueForMoney", title: "Value for Money", data: card.grades.valueForMoney },
    { id: "squadBalance", title: "Squad Balance", data: card.grades.squadBalance },
  ];

  return (
    <div className="w-full max-w-[420px] mx-auto transform -rotate-[0.5deg] transition-transform hover:rotate-0">
      {/* Paper Container */}
      <div 
        className="relative shadow-xl overflow-hidden bg-[#FFFDF7] dark:bg-[#1a1a2e] text-black dark:text-gray-100 rounded-sm"
        style={{
          backgroundImage: `
            linear-gradient(90deg, transparent 58px, rgba(239, 68, 68, 0.3) 58px, rgba(239, 68, 68, 0.3) 60px, transparent 60px),
            repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(59, 130, 246, 0.15) 27px, rgba(59, 130, 246, 0.15) 28px)
          `,
        }}
      >
        {/* Coffee Stain Watermark */}
        <div 
          className="absolute bottom-16 right-4 w-24 h-24 rounded-full pointer-events-none opacity-20 dark:opacity-10 mix-blend-multiply dark:mix-blend-screen"
          style={{
            background: "radial-gradient(circle, transparent 40%, #8B5A2B 90%, #6b4423 100%)",
            transform: "rotate(-15deg) scale(1.1) skew(5deg, 5deg)"
          }}
        />

        {/* Content Container (padded to respect the red margin) */}
        <div className="pl-[72px] pr-6 py-8 relative z-10">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-serif text-lg font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 opacity-90">
                Transfer Window
                <br />
                Report Card
              </h2>
              <div className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.club} • {card.league}
              </div>
            </div>
            {clubData?.logo && (
              <div className="flex-shrink-0 ml-3">
                <img 
                  src={clubData.logo} 
                  alt={card.club} 
                  width={48} 
                  height={48}
                  className="object-contain"
                />
              </div>
            )}
          </div>

          {/* Grades */}
          <div className="flex flex-col gap-5">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex flex-col">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <div className="font-bold font-outfit text-[15px]">{subject.title}</div>
                    {subject.data.names && subject.data.names.length > 0 && (
                      <div className="text-xs italic text-gray-600 dark:text-gray-400 mt-0.5 leading-tight">
                        {subject.data.names.join(", ")}
                      </div>
                    )}
                    <div className="text-[13px] text-gray-700 dark:text-gray-300 mt-1 leading-snug">
                      {subject.data.comment}
                    </div>
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm shadow-sm ${getGradeColor(subject.data.grade)}`}>
                      {subject.data.grade}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Overall Row */}
          <div className="mt-6 pt-5 border-t-2 border-gray-400 dark:border-gray-600 flex justify-between items-center">
            <div className="pr-4">
              <div className="font-black font-outfit text-lg uppercase">Overall Grade</div>
              <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {card.grades.overall.comment}
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-xl shadow-md ring-2 ring-white dark:ring-gray-800 ${getGradeColor(card.grades.overall.grade)}`}>
                {card.grades.overall.grade}
              </div>
            </div>
          </div>

          {/* Teachers Comments */}
          <div className="mt-8 pt-4 relative">
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 font-serif">
              Teacher's Comments
            </div>
            <div className="font-serif italic text-[#1a365d] dark:text-[#93c5fd] text-[15px] leading-relaxed">
              "{card.teachersComment}"
            </div>
          </div>

        </div>

        {/* Financial Summary */}
        <div className="bg-black/5 dark:bg-black/20 border-t border-black/10 dark:border-white/10 pl-[72px] pr-6 py-3 text-[11px] font-medium flex justify-between items-center text-gray-600 dark:text-gray-400 uppercase tracking-wider">
          <div className="flex flex-col">
            <span className="opacity-70 text-[9px]">Spend</span>
            <span className="text-gray-800 dark:text-gray-200">{card.totalSpend}</span>
          </div>
          <div className="flex flex-col text-center">
            <span className="opacity-70 text-[9px]">Income</span>
            <span className="text-gray-800 dark:text-gray-200">{card.totalIncome}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="opacity-70 text-[9px]">Net</span>
            <span className="text-gray-800 dark:text-gray-200">{card.netSpend}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
