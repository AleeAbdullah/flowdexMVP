'use client';
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarSearch,
  useKBar
} from 'kbar';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { navItems } from '@/constants/data';

import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

import RenderResults from './render-result';
import useThemeSwitching from './use-theme-switching';

export default function KBar({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const navigateTo = (url: string) => {
    router.push(url);
  };

  // These action are for the navigation
  const actions = useMemo(
    () =>
      navItems.flatMap((navItem) => {
        // Only include base action if the navItem has a real URL and is not just a container
        const baseAction =
          navItem.url !== '#'
            ? {
                id: `${navItem.title.toLowerCase()}Action`,
                name: navItem.title,
                shortcut: navItem.shortcut,
                keywords: navItem.title.toLowerCase(),
                section: 'Navigation',
                subtitle: `Go to ${navItem.title}`,
                perform: () => navigateTo(navItem.url)
              }
            : null;

        // Map child items into actions
        const childActions =
          navItem.items?.map((childItem) => ({
            id: `${childItem.title.toLowerCase()}Action`,
            name: childItem.title,
            shortcut: childItem.shortcut,
            keywords: childItem.title.toLowerCase(),
            section: navItem.title,
            subtitle: `Go to ${childItem.title}`,
            perform: () => navigateTo(childItem.url)
          })) ?? [];

        // Return only valid actions (ignoring null base actions for containers)
        return baseAction ? [baseAction, ...childActions] : childActions;
      }),
    []
  );

  return (
    <KBarProvider actions={actions}>
      <KBarComponent>{children}</KBarComponent>
    </KBarProvider>
  );
}
const KBarComponent = ({ children }: { children: React.ReactNode }) => {
  useThemeSwitching();
  const { query } = useKBar();

  return (
    <>
      <KBarPortal>
        <KBarPositioner className="scrollbar-hide fixed inset-0 z-[99999] bg-black/80  !p-0 backdrop-blur-sm">
          <KBarAnimator className="relative !mt-64 w-full max-w-[600px] !-translate-y-12 overflow-hidden rounded-lg border bg-background text-foreground shadow-lg">
            <div className="bg-background">
              <div className="relative border-x-0 border-b-2">
                <KBarSearch className="w-full border-none bg-background px-6 py-4 text-lg outline-none focus:outline-none focus:ring-0 focus:ring-offset-0" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        onClick={() => query.toggle()}
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="z-[100000]">
                      Close Search
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <RenderResults />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
};
