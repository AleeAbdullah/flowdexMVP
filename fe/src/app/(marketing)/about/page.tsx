import type { Metadata } from 'next';
import { AboutPage } from '@/components/flowdex/about-page';

export const metadata: Metadata = {
  title: 'About FlowDex | Universal Exchange',
  description: 'Learn how FlowDex bridges blockchain and traditional finance through a non-custodial Universal Exchange for crypto, tokenized stocks, forex, commodities, ETFs, and indices.',
};

export default function AboutRoute() {
  return <AboutPage />;
}
