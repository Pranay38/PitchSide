export function getAvatarUrl(userId: string | undefined | null, seedFallback: string = "guest"): string {
    const seed = userId || seedFallback;
    // Using Bottts Neutral from DiceBear for a sleek, Reddit-like robot identity
    return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}&backgroundColor=e2e8f0,16A34a&radius=50`;
}
