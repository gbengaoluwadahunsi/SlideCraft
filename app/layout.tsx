import type { Metadata } from "next";
import { Geist, Geist_Mono, Permanent_Marker, Inter, Playfair_Display, Oswald, Roboto_Mono } from "next/font/google";
import { ToasterProvider } from "@/components/ToasterProvider";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SessionProvider } from "@/components/SessionProvider";
import { ConfirmProvider } from "@/components/ConfirmDialog";
import { HelpChatbot } from "@/components/HelpChatbot";
import { AppContextProvider } from "@/lib/hooks/useAppContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const permanentMarker = Permanent_Marker({
  weight: "400",
  variable: "--font-permanent-marker",
  subsets: ["latin"],
});

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap"
});
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono" });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.carouslk.com'),
  title: {
    default: "Carouslk – Turn Ideas Into Scroll-Stopping Carousels",
    template: "%s | Carouslk"
  },
  description: "Create stunning carousels for any platform—social media, presentations, pitch decks, newsletters, and more. AI-powered content generation, beautiful templates, and instant export. Zero design skills needed.",
  keywords: ["AI Carousel Generator", "Visual Storytelling Tool", "Presentation Creator", "Pitch Deck Designer", "Social Media Content", "Newsletter Graphics", "AI Content Creation", "PDF Carousel Export", "Carousel Templates", "Content Marketing Tool"],
  authors: [{ name: "Carouslk Team" }],
  creator: "Carouslk",
  publisher: "Carouslk",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.carouslk.com",
    title: "Carouslk – Visual Storytelling for Every Platform",
    description: "Turn any idea into stunning carousels for social media, presentations, pitch decks, newsletters—anywhere visual content matters. AI-powered and effortless.",
    siteName: "Carouslk",
    images: [
      {
        url: "/og-image.png", // We should create this
        width: 1200,
        height: 630,
        alt: "Carouslk Dashboard Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Carouslk – AI Carousel Generator for Social & Slide Platforms",
    description: "Create stunning carousels for LinkedIn, Instagram, X/Twitter, presentations and more. AI-powered writing, beautiful templates, one-click export.",
    images: ["/og-image.png"],
    creator: "@carouslk", // Update if you have a handle
  },
  alternates: {
    canonical: "https://www.carouslk.com",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "android-chrome-192x192", url: "/android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/android-chrome-512x512.png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head></head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${permanentMarker.variable} ${inter.variable} ${playfair.variable} ${oswald.variable} ${robotoMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Remove Vercel toolbar in production */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function removeVercelToolbar() {
                  var selectors = [
                    '[data-vercel-toolbar]',
                    '[data-vercel]',
                    '#vercel-toolbar',
                    '#__vercel-toolbar__',
                    'vercel-toolbar',
                    'vercel-live-feedback',
                    '[class*="vercel-toolbar"]',
                    '[id*="vercel-toolbar"]'
                  ];
                  selectors.forEach(function(sel) {
                    try {
                      document.querySelectorAll(sel).forEach(function(el) {
                        el.remove();
                      });
                    } catch(e) {}
                  });
                }
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', removeVercelToolbar);
                } else {
                  removeVercelToolbar();
                }
                setInterval(removeVercelToolbar, 1000);
              })();
            `
          }}
        />
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Carouslk",
              "url": "https://www.carouslk.com",
              "logo": "https://www.carouslk.com/android-chrome-512x512.png",
              "sameAs": [],
              "description": "AI-powered visual storytelling tool for social media, presentations, pitch decks, newsletters, and beyond."
            })
          }}
        />
        {/* WebSite Schema for Search Box */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Carouslk",
              "url": "https://www.carouslk.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.carouslk.com/dashboard?search={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        {/* Software Application Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Carouslk",
              "applicationCategory": "DesignApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "150"
              },
              "description": "AI-powered tool to create stunning carousels for any platform—social media, presentations, pitch decks—in minutes.",
              "featureList": "AI Writing, PDF Export, Customizable Templates, LinkedIn Integration, Brand Customization",
              "screenshot": "https://www.carouslk.com/og-image.png",
              "url": "https://www.carouslk.com"
            })
          }}
        />
        <SessionProvider>
          <ConfirmProvider>
            <AppContextProvider>
              {children}
              <HelpChatbot />
            </AppContextProvider>
          </ConfirmProvider>
        </SessionProvider>
        <ToasterProvider />
        <ScrollToTop />
      </body>
    </html>
  );
}
