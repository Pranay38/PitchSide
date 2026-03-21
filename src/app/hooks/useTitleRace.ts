import { useState, useEffect } from "react";

interface Fixture {
  opp: string;
  h: boolean;
  diff: 1 | 2 | 3;
}

interface TitleRaceTeam {
  id: string;
  name: string;
  short: string;
  color: string;
  logo: string;
  pts: number;
  played: number;
  gd: number;
  w: number;
  d: number;
  l: number;
  form: string[];
  remaining: Fixture[];
  verdict: string;
}

export interface TitleRaceData {
  configId: string;
  teams: TitleRaceTeam[];
  updatedAt: string;
}

export function useTitleRace(league = "premier-league", refreshInterval = 60000) {
  const [data, setData] = useState<TitleRaceData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/title-race?league=${league}`);
        if (!res.ok) throw new Error("Failed to fetch title race data");
        const json = await res.json();
        if (isMounted) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err as Error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    // Revalidation polling loop
    const intervalId = setInterval(fetchData, refreshInterval);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [league, refreshInterval]);

  return { data, error, isLoading };
}
