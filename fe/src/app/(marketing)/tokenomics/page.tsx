import type { Metadata } from 'next';
import { TokenomicsPage } from '@/components/flowdex/tokenomics-page';

export const metadata: Metadata = {
  title: 'Tokenomics | FlowDex Protocol',
  description: 'Review $FDP token metrics, fixed supply, allocation, utility, fee sharing, burn mechanics, governance, and staggered vesting.',
};

export default function TokenomicsRoute() {
  return <TokenomicsPage />;
}
