import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DM_Sans, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { QueryProvider } from '@/components/providers/query-provider';
import { AlchemyProvider } from '@/components/providers/alchemy-provider';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { AppConfig } from '@/utils/app-config';
import '@/styles/global.css';

const bodyFont = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const headingFont = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
});

const dataFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

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
    <html
      lang={AppConfig.language}
      data-theme="dark"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${headingFont.variable} ${dataFont.variable}`}
    >
      <body>
        <NextThemesProvider
          attribute="data-theme"
          themes={['light', 'dark']}
          defaultTheme="dark"
          enableSystem={false}
          storageKey="theme"
        >
          <QueryProvider>
            <AlchemyProvider>
              <NuqsAdapter>
                {props.children}
                <SonnerToaster position="top-right" richColors />
              </NuqsAdapter>
            </AlchemyProvider>
          </QueryProvider>
        </NextThemesProvider>
      </body>
    </html>
  );
}
