import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/utils/Helpers';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${getBaseUrl()}/`,
      lastModified,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${getBaseUrl()}/about`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${getBaseUrl()}/tokenomics`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${getBaseUrl()}/roadmap`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${getBaseUrl()}/whitepaper`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${getBaseUrl()}/faq`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${getBaseUrl()}/blogs`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${getBaseUrl()}/legal`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${getBaseUrl()}/terms`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${getBaseUrl()}/privacy`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${getBaseUrl()}/buy`,
      lastModified,
      changeFrequency: 'daily',
      priority: 0.95,
    },
  ];
}
