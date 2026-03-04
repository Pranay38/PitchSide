import {
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    Legend, ResponsiveContainer, Tooltip,
} from "recharts";

interface PlayerStats {
  [label: string]: number;
}

interface PlayerRadarChartProps {
  playerName: string;
  playerStats: PlayerStats;
  matchName: string;
  matchStats: PlayerStats;
}

export function PlayerRadarChart({
  playerName,
  playerStats,
  matchName,
  matchStats,
}: PlayerRadarChartProps) {
  const labels = Object.keys(playerStats);
  const allValues = labels.flatMap((label) => [playerStats[label] || 0, matchStats[label] || 0]);
  const maxVal = Math.max(...allValues, 0.01);

  const data = labels.map((label) => ({
    label,
    player: Math.round(((playerStats[label] || 0) / maxVal) * 100),
    match: Math.round(((matchStats[label] || 0) / maxVal) * 100),
    rawPlayer: playerStats[label] || 0,
    rawMatch: matchStats[label] || 0,
  }));

  return (
    <div className="w-full rounded-2xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A] p-4 sm:p-6">
      <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#64748B] dark:text-[#94A3B8] text-center">
        Statistical Profile Comparison
      </h3>
      <div className="w-full h-[320px] sm:h-[380px] mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#64748B" strokeOpacity={0.35} />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 500 }}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name={playerName}
              dataKey="player"
              stroke="#16A34A"
              fill="#16A34A"
              fillOpacity={0.22}
              strokeWidth={2}
            />
            <Radar
              name={matchName}
              dataKey="match"
              stroke="#0EA5E9"
              fill="#0EA5E9"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: "10px" }}
              iconType="circle"
              iconSize={8}
            />
            <Tooltip
              formatter={(value, name, payload) => {
                const row = payload?.payload as { rawPlayer?: number; rawMatch?: number } | undefined;
                const rawValue = name === "player" ? row?.rawPlayer : row?.rawMatch;
                const safe = typeof rawValue === "number" ? rawValue : Number(value);
                return [safe.toFixed(2), name === "player" ? playerName : matchName];
              }}
              contentStyle={{
                backgroundColor: "#0F172A",
                border: "1px solid rgba(148,163,184,0.35)",
                borderRadius: "12px",
                color: "#E2E8F0",
                fontSize: "12px",
              }}
              itemStyle={{ color: "#E2E8F0" }}
              labelStyle={{ color: "#94A3B8" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
