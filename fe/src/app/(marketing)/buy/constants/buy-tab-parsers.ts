import { parseAsStringLiteral } from 'nuqs';
import { BUY_TAB_VALUES } from '@/components/flowdex/buy-page-content';

export const buyTabParser = parseAsStringLiteral([...BUY_TAB_VALUES]);

export const BUY_PAGE_TABS = ['Buy $FDN', 'Portfolio', 'Referral'] as const;
export type BuyPageTab = (typeof BUY_PAGE_TABS)[number];

const QUERY_TAB_TO_PAGE_TAB = {
  buy: 'Buy $FDN',
  portfolio: 'Portfolio',
  referrals: 'Referral',
} as const satisfies Partial<Record<(typeof BUY_TAB_VALUES)[number], BuyPageTab>>;

export function resolveBuyPageTabFromQuery(
  tab: (typeof BUY_TAB_VALUES)[number] | null,
): BuyPageTab | null {
  if (!tab) {
    return null;
  }

  return QUERY_TAB_TO_PAGE_TAB[tab as keyof typeof QUERY_TAB_TO_PAGE_TAB] ?? null;
}
