'use client';

import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { alchemy, baseSepolia } from '@account-kit/infra';
import { AlchemyAccountProvider, createConfig } from '@account-kit/react';
import { useQueryClient } from '@tanstack/react-query';
import { Env } from '@/libs/Env';

export function AlchemyProvider(props: {
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const apiKey = Env.NEXT_PUBLIC_ALCHEMY_API_KEY;

  const config = useMemo(() => {
    if (!apiKey) {
      return null;
    }

    return createConfig(
      {
        transport: alchemy({ apiKey }),
        chain: baseSepolia,
        ssr: true,
      },
      {
        auth: {
          sections: [[{ type: 'email' }]],
        },
      },
    );
  }, [apiKey]);

  if (!config) {
    return <>{props.children}</>;
  }

  return (
    <AlchemyAccountProvider config={config} queryClient={queryClient}>
      {props.children}
    </AlchemyAccountProvider>
  );
}
