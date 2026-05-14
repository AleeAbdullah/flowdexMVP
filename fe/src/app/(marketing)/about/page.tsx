import type { Metadata } from 'next';
import { AboutPage } from '@/components/flowdex/about-page';

export const metadata: Metadata = {
  title: 'About FlowDex | Protocol Thesis',
  description: 'Read the FlowDex product thesis, market opportunity, custody posture, and phased expansion from Ethereum launch to FlowChain.',
};

export default function AboutRoute() {
  return <AboutPage />;
}
