import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { NuqsProvider } from '@/components/providers/nuqs-adapter';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/providers/toaster';
import { AppConfig } from '@/utils/app-config';
import '@/styles/global.css';

export const metadata: Metadata = {
  icons: [
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      url: '/favicon-16x16.png',
    },
    {
      rel: 'icon',
      url: '/favicon.ico',
    },
  ],
  title: `${AppConfig.name} | Universal Exchange`,
  description: 'FlowDex is building the non-custodial universal exchange for crypto and tokenized real-world assets.',
};

export default function RootLayout(props: {
  children: ReactNode;
}) {
  return (
    <html lang={AppConfig.language} data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="data-theme"
          themes={['light', 'dark']}
          defaultTheme="dark"
          enableSystem={false}
          storageKey="theme"
        >
          <QueryProvider>
            <NuqsProvider>
              {props.children}
              <Toaster />
            </NuqsProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
