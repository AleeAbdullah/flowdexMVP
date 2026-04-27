import { describe, expect, it } from 'vitest';
import {
  getActiveMarketingNavHref,
  getMarketingNavActions,
  MARKETING_NAV_ITEMS,
} from './marketing-nav.utils';

describe('marketing nav contract', () => {
  it('uses standalone page routes instead of home-section anchors', () => {
    expect(MARKETING_NAV_ITEMS.map(item => item.href)).toEqual([
      '/about',
      '/tokenomics',
      '/buy',
      '/roadmap',
      '/whitepaper',
      '/faq',
    ]);
  });

  it('includes whitepaper and excludes team', () => {
    expect(MARKETING_NAV_ITEMS.map(item => item.label)).toContain('Whitepaper');
    expect(MARKETING_NAV_ITEMS.map(item => item.label)).not.toContain('Team');
  });

  it('maps route-level pages to the correct active nav item', () => {
    expect(getActiveMarketingNavHref('/about')).toBe('/about');
    expect(getActiveMarketingNavHref('/tokenomics')).toBe('/tokenomics');
    expect(getActiveMarketingNavHref('/buy')).toBe('/buy');
    expect(getActiveMarketingNavHref('/roadmap')).toBe('/roadmap');
    expect(getActiveMarketingNavHref('/whitepaper')).toBe('/whitepaper');
    expect(getActiveMarketingNavHref('/faq')).toBe('/faq');
  });

  it('does not synthesize active states for routes outside the top nav', () => {
    expect(getActiveMarketingNavHref('/')).toBeNull();
    expect(getActiveMarketingNavHref('/blogs')).toBeNull();
    expect(getActiveMarketingNavHref('/legal')).toBeNull();
    expect(getActiveMarketingNavHref('/terms')).toBeNull();
    expect(getActiveMarketingNavHref('/privacy')).toBeNull();
  });

  it('keeps the public site focused on the presale CTA only', () => {
    expect(getMarketingNavActions(false)).toEqual(['buy']);
    expect(getMarketingNavActions(true)).toEqual(['buy']);
  });
});
