import type { Metadata } from "next";
import { Geist, Geist_Mono, Permanent_Marker, Inter, Playfair_Display, Oswald, Roboto_Mono } from "next/font/google";
import { ToasterProvider } from "@/components/ToasterProvider";
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
  title: "Carouslk – Carousel Builder for Every Platform",
  description:
    "Transform any idea into swipe-worthy carousels for LinkedIn, Instagram, X, newsletters, and pitch decks. Customize, export, and publish in minutes.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
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
      >
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
