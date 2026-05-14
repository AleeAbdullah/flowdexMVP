import { MarketingNavClient } from './marketing-nav-client';

export async function MarketingNav() {
  return (
    <MarketingNavClient
      primaryAction={{ href: '/buy', label: 'Buy Now' }}
    />
  );
}
