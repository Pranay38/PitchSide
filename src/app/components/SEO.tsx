import { Helmet } from "react-helmet-async";

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

/** Build a dynamic OG image URL using the /api/og edge function */
function buildOgImageUrl(title: string, club?: string, date?: string): string {
    const params = new URLSearchParams({ title });
    if (club) params.set("club", club);
    if (date) params.set("date", date);
    return `https://pitchside-orcin.vercel.app/api/og?${params.toString()}`;
}

export function SEO({
    title = "The Touchline Dribble | Football Analysis & News",
    description = "A modern football blog featuring data-driven tactical analysis, rumors, manager pressure indices, and the latest news for die-hard fans.",
    image,
    url,
    type = "website",
    schema,
    club,
    date,
}: SEOProps) {

    // Auto-detect canonical URL from window.location if not explicitly provided
    const canonicalUrl = url || (typeof window !== "undefined" ? window.location.href : "https://pitchside-orcin.vercel.app");

    // Ensure title suffix is present unless it's already the default
    const formattedTitle = title === "The Touchline Dribble | Football Analysis & News"
        ? title
        : `${title} | The Touchline Dribble`;

    // Use dynamic OG image if no custom image provided, or if it's an article
    const ogImage = image || buildOgImageUrl(title, club, date);

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{formattedTitle}</title>
            <meta name="title" content={formattedTitle} />
            <meta name="description" content={description} />

            {/* Canonical URL */}
            <link rel="canonical" href={canonicalUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:title" content={formattedTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:site_name" content="The Touchline Dribble" />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={canonicalUrl} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />
            <meta name="twitter:site" content="@TouchlineDribbl" />

            {/* Schema / JSON-LD structured data */}
            {schema && (
                <script type="application/ld+json">
                    {schema}
                </script>
            )}
        </Helmet>
    );
}

