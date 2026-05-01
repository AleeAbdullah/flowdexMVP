import { getOptionalSession } from '@/lib/auth-server';
import { MarketingNavClient } from './marketing-nav-client';

export async function MarketingNav() {
  const session = process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true'
    ? null
    : await getOptionalSession();

  return (
    <MarketingNavClient
      primaryAction={session
        ? { href: '/app', label: 'Open App' }
        : { href: '/buy', label: 'Join Presale' }}
    />
  );
}
