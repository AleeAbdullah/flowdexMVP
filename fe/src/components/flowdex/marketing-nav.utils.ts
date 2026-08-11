type MarketingNavItem = {
  label: string;
  href: string;
  newTab?: boolean;
};

export const MARKETING_NAV_ITEMS: MarketingNavItem[] = [
  { label: 'About', href: '/about' },
  { label: 'Tokenomics', href: '/tokenomics' },
  { label: 'Roadmap', href: '/roadmap' },
  { label: 'Blog', href: '/blogs' },
  { label: 'Whitepaper', href: '/assets/whitepaper/FlowDex_Whitepaper_v7-1_newlogo.pdf', newTab: true },
  { label: 'FAQ', href: '/faq' },
];

const ACTIVE_NAV_HREFS = new Set(MARKETING_NAV_ITEMS.map(item => item.href));

export function isTopLevelMarketingNavHref(href: string) {
  return ACTIVE_NAV_HREFS.has(href);
}

export function getActiveMarketingNavHref(pathname: string): string | null {
  return MARKETING_NAV_ITEMS.find(item => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href ?? null;
}
