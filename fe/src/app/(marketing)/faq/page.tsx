import type { Metadata } from 'next';
import { FaqPage } from '@/components/flowdex/faq-page';

export const metadata: Metadata = {
  title: 'FAQ | FlowDex',
  description: 'Answers about FlowDex product direction, presale framing, and public route behavior.',
};

export default function FaqRoute() {
  return <FaqPage />;
}
