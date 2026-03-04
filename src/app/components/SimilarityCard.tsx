interface SimilarityMatch {
  name: string;
  club: string;
  league: string;
  positionGroup: string;
  similarity: number;
  hiddenGemScore: number;
  estimatedValueText: string;
  savingsPct: number;
  valueRatio: number;
  minutes: number;
}

interface SimilarityCardProps {
  match: SimilarityMatch;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
}

export function SimilarityCard({ match, rank, isSelected, onClick }: SimilarityCardProps) {
  const similarityPct = Math.round(match.similarity * 100);
  const savings = Math.max(0, match.savingsPct);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 ${
        isSelected
          ? "border-[#16A34A]/45 bg-[#16A34A]/8 shadow-lg shadow-[#16A34A]/10"
          : "border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] hover:border-[#16A34A]/35"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#64748B] dark:text-[#94A3B8]">
            Hidden Gem #{rank + 1}
          </p>
          <h3 className="mt-1 text-lg font-bold text-[#0F172A] dark:text-white">{match.name}</h3>
          <p className="text-sm text-[#475569] dark:text-[#94A3B8]">{match.club}</p>
        </div>

        <div className="rounded-xl bg-[#E2E8F0] dark:bg-[#1E293B] px-3 py-2 min-w-[72px] text-center">
          <p className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8]">Match</p>
          <p className="text-base font-bold text-[#16A34A]">{similarityPct}%</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-[#F1F5F9] dark:bg-[#111827] px-3 py-2">
          <p className="text-[#64748B] dark:text-[#94A3B8]">Value (proxy)</p>
          <p className="font-semibold text-[#0F172A] dark:text-white">{match.estimatedValueText}</p>
        </div>
        <div className="rounded-xl bg-[#F1F5F9] dark:bg-[#111827] px-3 py-2">
          <p className="text-[#64748B] dark:text-[#94A3B8]">Savings vs star</p>
          <p className="font-semibold text-[#0F172A] dark:text-white">{savings.toFixed(1)}%</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="px-2 py-1 rounded-full bg-[#DBEAFE] dark:bg-[#1E3A8A]/20 text-[#1D4ED8] dark:text-[#93C5FD]">
          {match.positionGroup}
        </span>
        <span className="px-2 py-1 rounded-full bg-[#F1F5F9] dark:bg-[#111827] text-[#475569] dark:text-[#94A3B8]">
          {match.minutes.toLocaleString()} mins
        </span>
        <span className="px-2 py-1 rounded-full bg-[#DCFCE7] dark:bg-[#14532D]/30 text-[#166534] dark:text-[#86EFAC]">
          Gem Score {match.hiddenGemScore.toFixed(1)}
        </span>
      </div>
    </button>
  );
}
