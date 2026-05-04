'use client';

import Link from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';
import type { IAuthMe } from '@/dal/app/auth/auth.types';
import {
  icons,
} from '@/icons';
import { cn } from '@/lib/utils';
import { FlowdexWordmark } from '@/components/flowdex/primitives';
import { ThemeToggle } from '@/components/flowdex/theme-toggle';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { ROUTES } from '@/routes';
import { appNavItems, filterNavItemsByRole, type NavItem } from './app-nav';

const appSidebarButtonClassName = [
  'rounded-lg font-medium text-[color-mix(in_srgb,var(--text)_74%,transparent)]',
  'hover:bg-[color-mix(in_srgb,var(--accent-strong)_8%,transparent)] hover:text-[var(--text)]',
  'hover:shadow-[inset_2px_0_0_color-mix(in_srgb,var(--accent-strong)_36%,transparent)]',
  'data-[active=true]:bg-[linear-gradient(90deg,color-mix(in_srgb,var(--accent-strong)_16%,transparent),color-mix(in_srgb,var(--accent-strong)_5%,transparent))]',
  'data-[active=true]:text-[var(--text)]',
  'data-[active=true]:shadow-[inset_2px_0_0_var(--accent-strong),0_10px_28px_color-mix(in_srgb,var(--accent-strong)_10%,transparent)]',
  '[&>svg]:text-[color-mix(in_srgb,var(--text)_58%,transparent)]',
  'hover:[&>svg]:text-[var(--accent-strong)] data-[active=true]:[&>svg]:text-[var(--accent-strong)]',
].join(' ');

export function AppSidebar(props: {
  profile: IAuthMe;
}) {
  const { state } = useSidebar();
  const segments = useSelectedLayoutSegments().filter(segment => !segment.startsWith('('));
  const visibleNavItems = filterNavItemsByRole(appNavItems, props.profile.role);
  const isCompact = state === 'collapsed';

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        'border-r border-[var(--card-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--bg)_96%,var(--bg-2)),color-mix(in_srgb,var(--bg-2)_90%,var(--bg)))] text-[var(--text)]',
      )}
    >
      <SidebarHeader className="gap-4 px-4 py-5">
        <Link href={ROUTES.MARKETING.HOME} className="inline-flex items-center gap-3" aria-label="FlowDex public home">
          <FlowdexWordmark compact={isCompact} />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup className="px-1">
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map(item => (
                <NavNode key={item.title} item={item} currentSegments={segments} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 pb-5 pt-2 group-data-[collapsible=icon]:px-1">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[color-mix(in_srgb,var(--accent-strong)_14%,var(--card-border))] bg-[color-mix(in_srgb,var(--bg)_72%,var(--card-bg))] p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
          <span className="min-w-0 truncate px-1 text-xs font-semibold text-[color-mix(in_srgb,var(--text)_60%,transparent)] group-data-[collapsible=icon]:hidden">
            Theme
          </span>
          <ThemeToggle />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function NavNode(props: {
  item: NavItem;
  currentSegments: string[];
}) {
  const isActive = isItemActive(props.item, props.currentSegments);
  const Icon = icons[props.item.icon];

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={props.item.title}
        className={appSidebarButtonClassName}
      >
        <Link href={props.item.url}>
          <Icon className="h-4 w-4" />
          <span>{props.item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function isItemActive(item: NavItem, currentSegments: string[]): boolean {
  const itemSegments = getAppSegments(item.url);

  if (itemSegments.length === 0) {
    return currentSegments.length === 0;
  }

  const isDirectMatch = itemSegments.every((segment, index) => currentSegments[index] === segment);
  if (isDirectMatch) {
    return true;
  }

  return false;
}

function getAppSegments(url: string) {
  const pathname = url.split('?')[0] ?? url;
  return pathname.split('/').filter(Boolean).slice(1);
}
