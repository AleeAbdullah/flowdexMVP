import type { Metadata } from 'next';
import { LegalHubPage } from '@/components/flowdex/legal-hub-page';

export const metadata: Metadata = {
  title: 'Legal Hub | FlowDex',
  description: 'Public legal entry route for terms, privacy, and launch-stage notices.',
};

export default function LegalRoute() {
  return <LegalHubPage />;
}
