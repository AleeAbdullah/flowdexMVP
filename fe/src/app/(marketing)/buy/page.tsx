import { BuyPage } from '@/components/flowdex/buy-page';
import { getOptionalSession } from '@/lib/auth-server';

export default async function BuyRoute() {
  const session = await getOptionalSession();

  return <BuyPage isAuthenticated={Boolean(session)} />;
}
