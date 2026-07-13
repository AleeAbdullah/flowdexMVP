import { parseAsStringLiteral } from 'nuqs';

const queryTabValues = ['buy', 'portfolio', 'leaders', 'staking', 'referrals'] as const;

export const buyTabParser = parseAsStringLiteral([...queryTabValues]);

export const BUY_PAGE_TABS = ['Buy $FDN', 'Portfolio', 'Referral'] as const;
export type BuyPageTab = (typeof BUY_PAGE_TABS)[number];

const QUERY_TAB_TO_PAGE_TAB = {
  buy: 'Buy $FDN',
  portfolio: 'Portfolio',
  referrals: 'Referral',
} as const satisfies Partial<Record<(typeof queryTabValues)[number], BuyPageTab>>;

export function resolveBuyPageTabFromQuery(
  tab: (typeof queryTabValues)[number] | null,
): BuyPageTab | null {
  if (!tab) {
    return null;
  }

  return QUERY_TAB_TO_PAGE_TAB[tab as keyof typeof QUERY_TAB_TO_PAGE_TAB] ?? null;
}
