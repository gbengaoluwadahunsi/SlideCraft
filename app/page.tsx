import { Metadata } from 'next';
import LandingPageWrapper from './LandingPageWrapper';

export const metadata: Metadata = {
  title: 'Carouslk - Editable AI Carousel Drafts',
  description: 'Create editable carousel drafts from ideas, articles, or notes. Simple workflow, AI-assisted structure, and export-ready slides.',
  keywords: ['carousel generator', 'Instagram carousel maker', 'LinkedIn carousel generator', 'AI content creation', 'PDF slider tool', 'social media marketing', 'carousel templates'],
  openGraph: {
    title: 'Carouslk - Editable AI Carousel Drafts',
    description: 'Turn ideas, articles, and notes into editable carousel drafts for multiple platforms.',
    url: 'https://www.carouslk.com',
    siteName: 'Carouslk',
    images: [
      {
        url: 'https://www.carouslk.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Carouslk - AI Carousel Generator Dashboard',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Carouslk - AI Carousel Drafts',
    description: 'Create editable carousel drafts for LinkedIn, Instagram, sales, education, and general content.',
    images: ['https://www.carouslk.com/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.carouslk.com',
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
