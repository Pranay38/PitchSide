export function readTimeToMinutes(readTime?: string): number {
  if (!readTime) return 0;

  const match = readTime.match(/(\d+)\s*min/i);
  return match ? Number(match[1]) : 0;
}

export function sumReadTimeMinutes(items: Array<{ readTime?: string }>): number {
  return items.reduce((total, item) => total + readTimeToMinutes(item.readTime), 0);
}

export function formatReadTimeTotal(minutes: number, fallback = "Quick read"): string {
  if (minutes <= 0) return fallback;
  return `${minutes} min read`;
}

export function hashString(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}
