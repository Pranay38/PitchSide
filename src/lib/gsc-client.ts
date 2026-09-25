export interface GSCQuery {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCClientOptions {
  siteUrl: string;
}

export class GSCClient {
  private options: GSCClientOptions;
  private data: GSCQuery[] = [];

  constructor(options: GSCClientOptions) {
    this.options = options;
  }

  loadFromJSON(data: GSCQuery[]) {
    this.data = data;
  }

  async getStrikingDistanceQueries(days?: number): Promise<GSCQuery[]> {
    return this.data
      .filter(q => q.position >= 8 && q.position <= 20)
      .sort((a, b) => b.impressions - a.impressions);
  }

  async getLowCTRPages(days?: number): Promise<GSCQuery[]> {
    // Assuming 0.05 is below average CTR
    return this.data
      .filter(q => q.position >= 3 && q.position <= 10 && q.ctr < 0.05)
      .sort((a, b) => b.impressions - a.impressions);
  }

  async getQueryDistribution(days?: number): Promise<{ pos1to3: number; pos4to10: number; pos11to20: number; pos21plus: number }> {
    const dist = { pos1to3: 0, pos4to10: 0, pos11to20: 0, pos21plus: 0 };
    for (const q of this.data) {
      if (q.position <= 3) dist.pos1to3++;
      else if (q.position <= 10) dist.pos4to10++;
      else if (q.position <= 20) dist.pos11to20++;
      else dist.pos21plus++;
    }
    return dist;
  }

  async getBrandedVsNonBranded(days?: number): Promise<{ branded: GSCQuery[]; nonBranded: GSCQuery[] }> {
    const brandTerms = ['touchline dribble', 'touchlinedribble', 'touchline'];
    const branded: GSCQuery[] = [];
    const nonBranded: GSCQuery[] = [];

    for (const q of this.data) {
      const isBranded = brandTerms.some(term => q.query.toLowerCase().includes(term));
      if (isBranded) branded.push(q);
      else nonBranded.push(q);
    }
    
    return { branded, nonBranded };
  }

  async getTopGainersLosers(days?: number): Promise<{ gainers: GSCQuery[]; losers: GSCQuery[] }> {
    // Requires historical comparison, return dummy split for now
    const sorted = [...this.data].sort((a, b) => b.impressions - a.impressions);
    const mid = Math.floor(sorted.length / 2);
    return {
      gainers: sorted.slice(0, mid),
      losers: sorted.slice(mid)
    };
  }
}

export function parseGSCExport(csvContent: string): GSCQuery[] {
  const lines = csvContent.split('\\n');
  const queries: GSCQuery[] = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parse, handling basic quotes if necessary
    const parts = line.split(',');
    if (parts.length >= 6) {
      queries.push({
        query: parts[0]?.replace(/"/g, '') || '',
        page: parts[1]?.replace(/"/g, '') || '',
        clicks: parseInt(parts[2], 10) || 0,
        impressions: parseInt(parts[3], 10) || 0,
        ctr: parseFloat(parts[4]) || 0,
        position: parseFloat(parts[5]) || 0,
      });
    }
  }
  return queries;
}
