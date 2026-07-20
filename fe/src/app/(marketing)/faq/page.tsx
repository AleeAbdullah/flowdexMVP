import type { Metadata } from 'next';
import { FaqPage } from '@/components/flowdex/faq-page';

export const metadata: Metadata = {
  title: 'FAQ | FlowDex',
  description: 'Answers about FlowDex Protocol, non-custodial trading, presale participation, $FDP utility, staking, token supply, and security planning.',
};

export default function FaqRoute() {
  return <FaqPage />;
}
