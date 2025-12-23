import { Metadata } from 'next';
import LandingPageWrapper from './LandingPageWrapper';

export const metadata: Metadata = {
  title: "Carouslk – AI Carousel Generator for LinkedIn & Instagram",
  description: "Create viral carousels for LinkedIn, Instagram, and X in seconds. AI-powered writing, beautiful templates, and one-click PDF export. No design skills needed.",
  keywords: ["LinkedIn Carousel Generator", "Instagram Carousel Maker", "AI Content Creation", "PDF Slider Tool", "Social Media Marketing", "Carousel Templates", "LinkedIn PDF", "free carousel maker", "AI carousel generator"],
  openGraph: {
    title: "Carouslk – Create Viral Carousels in Seconds",
    description: "Transform your ideas into multi-platform carousels instantly. AI-powered, customizable, and free to try.",
    url: "https://www.carouslk.com",
    siteName: "Carouslk",
    images: [
      {
        url: "https://www.carouslk.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Carouslk - AI Carousel Generator Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Carouslk – AI Carousel Generator",
    description: "Stop wasting hours on design. Generate LinkedIn & Instagram carousels instantly with AI.",
    images: ["https://www.carouslk.com/og-image.png"],
  },
  alternates: {
    canonical: "https://www.carouslk.com",
  },
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
};

export default function LandingPage() {
  return <LandingPageWrapper />;
}
