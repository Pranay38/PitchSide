import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "./providers";
import { CSPostHogProvider } from "@/app/components/PostHogProvider";
import { InnerCircleModal } from "@/app/components/InnerCircleModal";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Touchline Dribble — Football Tactics & Bold Opinions",
    template: "%s | The Touchline Dribble",
  },
  description:
    "Tactical breakdowns your pundit missed. Post-match analysis, formation deep dives, manager pressure watches, and bold opinions for die-hard football fans. ⚽",
  metadataBase: new URL("https://www.thetouchlinedribble.in"),
  alternates: {
    types: {
      "application/rss+xml": "/api/rss",
    },
  },
  openGraph: {
    type: "website",
    siteName: "The Touchline Dribble",
    title: "The Touchline Dribble — Football Tactics & Bold Opinions",
    description:
      "Tactical breakdowns your pundit missed. Post-match analysis, formation deep dives, manager pressure watches, and bold opinions for die-hard football fans. ⚽",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "The Touchline Dribble — Tactical breakdowns your pundit missed",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@TouchlineDribbl",
    creator: "@TouchlineDribbl",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large" as const,
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Touchline Dribble",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#16A34A",
  width: "device-width",
  initialScale: 1,
};

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts: Inter, Newsreader, Outfit */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Newsreader:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />

        {/* Preconnect to frequently used external services */}
        <link rel="preconnect" href="https://api.football-data.org" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://api.football-data.org" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />

        {/* Inline theme script to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('pitchside_theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />

        {/* JSON-LD for WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "The Touchline Dribble",
              alternateName: "PitchSide",
              url: "https://www.thetouchlinedribble.in",
              description:
                "From the touchline to your timeline — tactical breakdowns, bold football opinions, and the analysis your pundit missed.",
              potentialAction: {
                "@type": "SearchAction",
                target:
                  "https://www.thetouchlinedribble.in/archive?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />

        {/* JSON-LD for Organization — Knowledge Panel + brand signals */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "The Touchline Dribble",
              alternateName: "PitchSide",
              url: "https://www.thetouchlinedribble.in",
              logo: "https://www.thetouchlinedribble.in/logo.png",
              description:
                "Conviction-led football analysis — tactical breakdowns, bold opinions, and the takes your pundit is too safe to make.",
              foundingDate: "2026",
              sameAs: [
                "https://x.com/TouchlineDribbl",
                "https://www.instagram.com/thetouchlinedribble/",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "editorial",
                email: "thetouchlinedribble@gmail.com",
              },
            }),
          }}
        />
      </head>

      <body>
        {/* GA4 */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:false});`}
            </Script>
          </>
        )}

        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          appearance={{
            baseTheme: undefined,
            variables: {
              colorPrimary: "#16A34A",
              borderRadius: "0.75rem",
            },
            elements: {
              card: "bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800 shadow-xl",
              headerTitle:
                "font-outfit font-black text-2xl text-slate-900 dark:text-white",
              headerSubtitle:
                "text-slate-500 dark:text-gray-400 font-medium",
              socialButtonsBlockButton:
                "border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A]/50 hover:bg-gray-50 dark:hover:bg-[#1e293b] text-slate-900 dark:text-white",
              socialButtonsBlockButtonText:
                "text-slate-900 dark:text-white font-semibold flex-1 text-center",
              formButtonPrimary:
                "bg-[#16A34A] hover:bg-[#15803d] text-white font-bold h-11",
              formFieldInput:
                "bg-gray-50 dark:bg-[#08111f] border-gray-200 dark:border-gray-700 text-slate-900 dark:text-white focus:border-[#16A34A] h-11",
              formFieldLabel:
                "text-slate-700 dark:text-gray-300 font-medium",
              footerActionText: "text-slate-500 dark:text-gray-400",
              footerActionLink:
                "text-[#16A34A] hover:text-[#15803d] font-semibold",
              dividerLine: "bg-gray-200 dark:bg-gray-800",
              dividerText: "text-slate-400 dark:text-gray-500",
              identityPreview:
                "bg-gray-50 dark:bg-[#08111f] border border-gray-200 dark:border-gray-700",
              identityPreviewText: "text-slate-900 dark:text-white",
              identityPreviewEditButton:
                "text-[#16A34A] hover:text-[#15803d]",
            },
          }}
        >
          <CSPostHogProvider>
            <Providers>
              {children}
              <InnerCircleModal />
            </Providers>
          </CSPostHogProvider>
        </ClerkProvider>

        {/* SEO: Noscript fallback for bots that don't execute JS */}
        <noscript>
          <div
            style={{
              maxWidth: 800,
              margin: "0 auto",
              padding: "2rem",
              fontFamily: "system-ui,sans-serif",
              color: "#fff",
              background: "#0B1120",
            }}
          >
            <h1>
              The Touchline Dribble — Football Tactics &amp; Bold Opinions
            </h1>
            <p>
              Tactical breakdowns your pundit missed. Post-match analysis,
              formation deep dives, manager pressure watches, and the bold
              opinions that fuel your group chat.
            </p>
            <nav>
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/daily-fix">Daily Fix</a></li>
                <li><a href="/transfers">Transfer Watch</a></li>
                <li><a href="/stories">Stories</a></li>
                <li><a href="/debates">Debates</a></li>
                <li><a href="/collections">Collections</a></li>
                <li><a href="/archive">Archive</a></li>
                <li><a href="/about">About</a></li>
              </ul>
            </nav>
            <p>
              Enable JavaScript for the full interactive experience, or
              subscribe to our <a href="/api/rss">RSS feed</a>.
            </p>
          </div>
        </noscript>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
