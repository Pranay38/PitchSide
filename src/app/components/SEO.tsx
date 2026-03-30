/**
 * SEO component — now a no-op wrapper for Next.js migration.
 * 
 * In Next.js, SEO metadata is handled by the `generateMetadata` function
 * in each page's server component (app/post/[id]/page.tsx, etc.).
 * 
 * This component is kept as a no-op so existing page components don't break
 * when they render <SEO ... />. It simply renders nothing.
 */

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    schema?: string;
    club?: string;
    date?: string;
}

export function SEO(_props: SEOProps) {
    // In Next.js, metadata is set via generateMetadata() in server components.
    // This client-side component is now a no-op.
    return null;
}
