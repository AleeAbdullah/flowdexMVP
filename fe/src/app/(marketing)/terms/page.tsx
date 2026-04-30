import type { Metadata } from 'next';
import { TermsPage } from '@/components/flowdex/terms-page';

export const metadata: Metadata = {
  title: 'Terms | FlowDex',
  description: 'Launch-stage terms for the public FlowDex marketing and presale surface.',
};

export default function TermsRoute() {
  return <TermsPage />;
}
