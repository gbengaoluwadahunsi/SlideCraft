import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://www.carouslk.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://www.carouslk.com/dashboard',
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.8,
    },
  ];
}


