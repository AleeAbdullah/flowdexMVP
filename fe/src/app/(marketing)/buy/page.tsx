import { Suspense } from 'react';
import { BuyPageClient } from './_components/buy-page-client';

export default function BuyRoute() {
  return (
    <Suspense fallback={null}>
      <BuyPageClient />
    </Suspense>
  );
}
