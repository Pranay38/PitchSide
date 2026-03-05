import { Helmet } from "react-helmet-async";

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: "website" | "article";
}

export function SEO({
    title = "The Touchline Dribble | Football Analysis & News",
    description = "A modern football blog featuring data-driven tactical analysis, rumors, manager pressure indices, and the latest news for die-hard fans.",
    image = "/og-image.jpg", // A default fallback image
    url = "https://pitchside.vercel.app",
    type = "website"
}: SEOProps) {

    // Ensure title suffix is present unless it's already the default
    const formattedTitle = title === "The Touchline Dribble | Football Analysis & News"
        ? title
        : `${title} | The Touchline Dribble`;

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
            <meta property="og:image" content={image} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url} />
            <meta property="twitter:title" content={formattedTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={image} />
        </Helmet>
    );
}
