'use client';

import Link from 'next/link';
import { useSelectedLayoutSegments } from 'next/navigation';
import type { IAuthMe } from '@/dal/app/auth/auth.types';
import {
  icons,
} from '@/icons';
import { cn } from '@/lib/utils';
import { FlowdexWordmark } from '@/components/flowdex/primitives';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { ROUTES } from '@/routes';
import { appNavItems, filterNavItemsByRole, type NavItem } from './app-nav';

export function AppSidebar(props: {
  profile: IAuthMe;
}) {
  const segments = useSelectedLayoutSegments().filter(segment => !segment.startsWith('('));
  const visibleNavItems = filterNavItemsByRole(appNavItems, props.profile.role);

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        'border-r border-[var(--card-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--bg)_96%,var(--bg-2)),color-mix(in_srgb,var(--bg-2)_90%,var(--bg)))] text-[var(--text)]',
      )}
    >
      <SidebarHeader className="gap-4 px-4 py-5">
        <Link href={ROUTES.DASHBOARD.HOME} className="inline-flex items-center gap-3">
          <FlowdexWordmark compact />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {visibleNavItems.map(item => (
          <NavSection key={item.title} item={item} currentSegments={segments} />
        ))}
      </SidebarContent>

      <SidebarFooter className="px-4 pb-5 pt-2">
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 text-xs text-[var(--muted)]">
          Collapse the sidebar when you want more room for the current view.
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function NavSection(props: {
  item: NavItem;
  currentSegments: string[];
}) {
  const isActive = isItemActive(props.item, props.currentSegments);
  const Icon = icons[props.item.icon];
  const hasChildren = props.item.items.length > 0;

  if (!hasChildren) {
    return (
      <SidebarGroup className="px-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={props.item.title}
              className="font-medium"
            >
              <Link href={props.item.url}>
                <Icon className="h-4 w-4" />
                <span>{props.item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className="px-1">
      <SidebarGroupLabel asChild>
        <Link
          href={props.item.url}
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[color-mix(in_srgb,var(--text)_60%,transparent)]"
        >
          <Icon className="h-3.5 w-3.5" />
          <span>{props.item.title}</span>
        </Link>
      </SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu>
          {props.item.items.map(child => (
            <NavNode key={child.title} item={child} currentSegments={props.currentSegments} depth={0} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function NavNode(props: {
  item: NavItem;
  currentSegments: string[];
  depth: number;
}) {
  const isActive = isItemActive(props.item, props.currentSegments);
  const Icon = icons[props.item.icon];
  const hasChildren = props.item.items.length > 0;

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          size={props.depth > 0 ? 'sm' : 'default'}
          tooltip={props.item.title}
        >
          <Link href={props.item.url}>
            <Icon className="h-4 w-4" />
            <span>{props.item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={props.item.title}
        className="font-medium"
      >
        <Link href={props.item.url}>
          <Icon className="h-4 w-4" />
          <span>{props.item.title}</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuSub>
        {props.item.items.map(child => {
          const ChildIcon = icons[child.icon];

          return (
            <SidebarMenuSubItem key={child.title}>
              <SidebarMenuSubButton asChild isActive={isItemActive(child, props.currentSegments)}>
                <Link href={child.url}>
                  <ChildIcon className="h-4 w-4" />
                  <span>{child.title}</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          );
        })}
      </SidebarMenuSub>
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

  if (item.items.length === 0) {
    return false;
  }

  return item.items.some(child => isItemActive(child, currentSegments));
}

function getAppSegments(url: string) {
  const pathname = url.split('?')[0] ?? url;
  return pathname.split('/').filter(Boolean).slice(1);
}
