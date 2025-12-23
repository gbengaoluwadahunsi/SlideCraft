import type { Metadata } from "next";
import { Geist, Geist_Mono, Permanent_Marker, Inter, Playfair_Display, Oswald, Roboto_Mono } from "next/font/google";
import { ToasterProvider } from "@/components/ToasterProvider";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SessionProvider } from "@/components/SessionProvider";
import { ConfirmProvider } from "@/components/ConfirmDialog";
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

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono" });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.carouslk.com'),
  title: {
    default: "Carouslk – AI Carousel Generator for LinkedIn & Instagram",
    template: "%s | Carouslk"
  },
  description: "Create viral carousels for LinkedIn, Instagram, and X in seconds. AI-powered writing, beautiful templates, and one-click PDF export. No design skills needed.",
  keywords: ["LinkedIn Carousel Generator", "Instagram Carousel Maker", "AI Content Creation", "PDF Slider Tool", "Social Media Marketing", "Carousel Templates", "LinkedIn PDF"],
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
    title: "Carouslk – Create Viral Carousels in Seconds",
    description: "Transform your ideas into multi-platform carousels instantly. AI-powered, customizable, and free to try.",
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
    title: "Carouslk – AI Carousel Generator",
    description: "Stop wasting hours on design. Generate LinkedIn & Instagram carousels instantly with AI.",
    images: ["/og-image.png"],
    creator: "@carouslk", // Update if you have a handle
  },
  alternates: {
    canonical: "https://www.carouslk.com",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${permanentMarker.variable} ${inter.variable} ${playfair.variable} ${oswald.variable} ${robotoMono.variable} antialiased`}
        suppressHydrationWarning
      >
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
              "description": "AI-powered tool to create LinkedIn and Instagram carousels in minutes.",
              "featureList": "AI Writing, PDF Export, Customizable Templates, LinkedIn Integration",
              "screenshot": "https://www.carouslk.com/og-image.png",
              "url": "https://www.carouslk.com"
            })
          }}
        />
        <SessionProvider>
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
        </SessionProvider>
        <ToasterProvider />
        <ScrollToTop />
      </body>
    </html>
  );
}
