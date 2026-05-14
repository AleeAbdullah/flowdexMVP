export type MarketingNavItem = {
  label: string;
  href: string;
};

export const MARKETING_NAV_ITEMS: MarketingNavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Tokenomics', href: '/tokenomics' },
  { label: 'Roadmap', href: '/roadmap' },
  { label: 'Whitepaper', href: '/whitepaper' },
  { label: 'FAQ', href: '/faq' },
];

const ACTIVE_NAV_HREFS = new Set(MARKETING_NAV_ITEMS.map(item => item.href));

export function isTopLevelMarketingNavHref(href: string) {
  return ACTIVE_NAV_HREFS.has(href);
}

export function getActiveMarketingNavHref(pathname: string): string | null {
  if (ACTIVE_NAV_HREFS.has(pathname)) {
    return pathname;
  }

  return null;
}
