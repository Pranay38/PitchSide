export function generateHowToSchema(title: string, steps: { name: string; text: string; image?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": title,
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      ...(step.image ? { "image": step.image } : {})
    }))
  };
}

export function generateVideoSchema(options: { name: string; description: string; thumbnailUrl: string; uploadDate: string; embedUrl: string; duration?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": options.name,
    "description": options.description,
    "thumbnailUrl": options.thumbnailUrl,
    "uploadDate": options.uploadDate,
    "embedUrl": options.embedUrl,
    ...(options.duration ? { "duration": options.duration } : {})
  };
}

export function generateItemListSchema(items: { name: string; url: string; position: number }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": items.map(item => ({
      "@type": "ListItem",
      "position": item.position,
      "name": item.name,
      "url": item.url
    }))
  };
}

export function generateComparisonSchema(entityA: { name: string; type: string }, entityB: { name: string; type: string }, aspects: string[]) {
  // A creative way to represent comparison is using ItemList or generic Article with about
  // But ItemList is commonly used for comparing entities as requested by the prompt
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `Comparison: ${entityA.name} vs ${entityB.name}`,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": entityA.type,
          "name": entityA.name
        }
      },
      {
        "@type": "ListItem",
        "position": 2,
        "item": {
          "@type": entityB.type,
          "name": entityB.name
        }
      }
    ],
    "description": `Comparing based on: ${aspects.join(", ")}`
  };
}

export function generateBreadcrumbSchema(items: { name: string; url?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      ...(item.url ? { "item": item.url } : {})
    }))
  };
}

export function generateFAQSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };
}
