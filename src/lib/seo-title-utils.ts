interface TitleOptions {
  keyword?: string;
  addYear?: boolean;
  hook?: string; // e.g. '[Tactical Breakdown]', '[Data Analysis]'
  maxLength?: number; // default 60
}

export function generateClickTitle(base: string, options?: TitleOptions): string {
  let title = base.trim();
  const maxLength = options?.maxLength || 60;
  
  // Lead with keyword if provided
  if (options?.keyword) {
    const keywordPattern = new RegExp(options.keyword, 'i');
    if (keywordPattern.test(title)) {
      title = title.replace(keywordPattern, '').trim();
    }
    title = `${options.keyword} - ${title}`;
  }

  // Append hook
  if (options?.hook) {
    if (!title.includes(options.hook)) {
      title = `${title} ${options.hook}`;
    }
  }

  // Append year
  if (options?.addYear) {
    const year = new Date().getFullYear().toString();
    if (!title.includes(year)) {
      title = `${title} (${year})`;
    }
  }

  // Truncate smartly
  if (title.length > maxLength) {
    let truncated = title.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
      truncated = truncated.substring(0, lastSpace);
    }
    title = truncated;
  }

  // Cleanup
  title = title.replace(/\s+/g, ' ').replace(/\s-\s*-/g, ' -').trim();
  
  return title;
}

export function validateTitle(title: string): { valid: boolean; issues: string[]; charCount: number; hasNumber: boolean; hasYear: boolean; hasHook: boolean; keywordPosition: 'front' | 'middle' | 'end' | 'missing' } {
  const issues: string[] = [];
  const charCount = title.length;
  
  if (charCount > 60) issues.push('Title is over 60 characters.');
  if (charCount < 30) issues.push('Title is under 30 characters.');

  const hasNumber = /\d/.test(title);
  if (!hasNumber) issues.push('Title does not contain a number.');

  const currentYear = new Date().getFullYear().toString();
  const hasYear = title.includes(currentYear);

  const hasHook = /\[.*?\]/.test(title) || /\{.*?\}/.test(title);

  // We are missing the exact keyword check, so returning missing by default, or try to infer if keyword arg was there
  // Since no keyword argument, this is limited. But as per spec, keywordPosition needs to be returned.
  
  return {
    valid: issues.length === 0,
    issues,
    charCount,
    hasNumber,
    hasYear,
    hasHook,
    keywordPosition: 'missing', // placeholder without keyword arg
  };
}

export function generateMetaDescription(content: string, keyword?: string, maxLength: number = 155): string {
  // Extract first meaningful sentence (simple heuristic)
  const sentences = content.replace(/<[^>]*>?/gm, '').split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
  let desc = sentences[0] || content.substring(0, maxLength);
  
  if (keyword && !desc.toLowerCase().includes(keyword.toLowerCase())) {
    desc = `${keyword}: ${desc}`;
  }

  if (desc.length > maxLength) {
    let truncated = desc.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
      truncated = truncated.substring(0, lastSpace);
    }
    desc = truncated + '...';
  }

  return desc;
}

export function suggestTitleImprovements(title: string): string[] {
  const validation = validateTitle(title);
  const suggestions: string[] = [];
  
  if (validation.charCount > 60) {
    suggestions.push(`Title is ${validation.charCount} chars — truncate to under 60`);
  }
  
  if (!validation.hasYear) {
    const year = new Date().getFullYear();
    suggestions.push(`Add the current year (${year}) for freshness`);
  }
  
  if (!validation.hasHook) {
    suggestions.push('Add a bracketed hook like [Tactical Breakdown]');
  }
  
  if (!validation.hasNumber) {
    suggestions.push('Add a number to increase click-through rate');
  }

  return suggestions;
}
