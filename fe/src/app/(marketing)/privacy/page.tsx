import type { Metadata } from 'next';
import { PrivacyPage } from '@/components/flowdex/privacy-page';

export const metadata: Metadata = {
  title: 'Privacy | FlowDex',
  description: 'Launch-stage privacy notice aligned with current public and authenticated FlowDex behavior.',
};

export default function PrivacyRoute() {
  return <PrivacyPage />;
}
