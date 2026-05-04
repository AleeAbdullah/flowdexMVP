'use client';

import { useMemo, type ReactNode } from 'react';
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
          hideSignInText: true,
          sections: [[{ type: 'email' }]],
        },
        uiMode: 'embedded',
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
