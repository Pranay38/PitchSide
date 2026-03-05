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
    url = "https://pitchside-orcin.vercel.app",
    type = "website",
    schema,
    club,
    date,
}: SEOProps) {

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

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={formattedTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />

            {/* Schema / JSON-LD structured data */}
            {schema && (
                <script type="application/ld+json">
                    {schema}
                </script>
            )}
        </Helmet>
    );
}

