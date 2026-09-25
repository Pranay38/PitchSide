import type { BlogPost } from "@/app/data/posts";

export interface InternalLink {
    sourceId: string;
    targetId: string;
}

export function calculateLinkAuthority(post: BlogPost, inboundLinksCount: number): number {
    // Base score could be derived from views or general engagement
    const baseScore = (post.views || 0) * 0.1;
    // Each inbound link adds significant authority
    const linkScore = inboundLinksCount * 5;
    
    return baseScore + linkScore;
}

export function detectOrphans(posts: BlogPost[], allInternalLinks: InternalLink[]): BlogPost[] {
    const targetIds = new Set(allInternalLinks.map(link => link.targetId));
    return posts.filter(post => !targetIds.has(post.id));
}

export interface LinkSuggestion {
    targetPost: BlogPost;
    reason: string;
    suggestedAnchor: string;
    authorityScore: number;
}

export function suggestLinkTargets(
    sourcePost: Partial<BlogPost>, 
    allPosts: BlogPost[], 
    inboundLinksCountMap: Record<string, number> = {}
): LinkSuggestion[] {
    const suggestions: LinkSuggestion[] = [];
    const sourceTags = new Set((sourcePost.tags || []).map(t => t.toLowerCase()));
    
    for (const post of allPosts) {
        if (post.id === sourcePost.id) continue;
        
        const matchingTags = (post.tags || []).filter(t => sourceTags.has(t.toLowerCase()));
        
        let reason = "";
        let anchor = "";
        
        if (matchingTags.length > 0) {
            reason = `Shared tags: ${matchingTags.join(", ")}`;
            anchor = matchingTags[0];
        } else if (post.club && sourcePost.club && post.club.toLowerCase() === sourcePost.club.toLowerCase()) {
            reason = `Same club: ${post.club}`;
            anchor = post.club;
        } else if (post.playerName && sourcePost.playerName && post.playerName.toLowerCase() === sourcePost.playerName.toLowerCase()) {
            reason = `Same player: ${post.playerName}`;
            anchor = post.playerName;
        }
        
        if (reason) {
            const authScore = calculateLinkAuthority(post, inboundLinksCountMap[post.id] || 0);
            suggestions.push({
                targetPost: post,
                reason,
                suggestedAnchor: anchor,
                authorityScore: authScore
            });
        }
    }
    
    // Sort by authority score descending
    return suggestions.sort((a, b) => b.authorityScore - a.authorityScore);
}
