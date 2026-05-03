import { APP_USER_ROLES, type AppUserRole } from '@/dal/app/auth/auth.types';
import type { IconName } from '@/icons';
import { ROUTES } from '@/routes';

export type NavItem = {
  title: string;
  url: string;
  icon: IconName;
  shortcut?: string[];
  allowedRoles?: AppUserRole[];
  items: NavItem[];
};

export const appNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: ROUTES.DASHBOARD.HOME,
    icon: 'Home',
    shortcut: ['g', 'd'],
    items: [],
  },
  {
    title: 'Administration',
    url: ROUTES.ADMIN.HOME,
    icon: 'ShieldCheck',
    shortcut: ['a', 'd'],
    allowedRoles: [APP_USER_ROLES.ADMIN],
    items: [],
  },
  {
    title: 'Wallets',
    url: ROUTES.WORKSPACE.WALLETS,
    icon: 'Wallet',
    shortcut: ['w', 'w'],
    items: [],
  },
  {
    title: 'Buy',
    url: ROUTES.WORKSPACE.BUY,
    icon: 'Banknote',
    shortcut: ['w', 'b'],
    items: [],
  },
  {
    title: 'Transactions',
    url: ROUTES.WORKSPACE.TRANSACTIONS,
    icon: 'ReceiptText',
    shortcut: ['w', 't'],
    items: [],
  },
  {
    title: 'Trade',
    url: ROUTES.MARKETS.TRADE,
    icon: 'BarChart3',
    shortcut: ['m', 't'],
    items: [],
  },
  {
    title: 'Portfolio',
    url: ROUTES.MARKETS.PORTFOLIO,
    icon: 'Coins',
    shortcut: ['m', 'p'],
    items: [],
  },
  {
    title: 'Stake',
    url: ROUTES.MARKETS.STAKE,
    icon: 'Gem',
    shortcut: ['m', 's'],
    items: [],
  },
  {
    title: 'Govern',
    url: ROUTES.ECOSYSTEM.GOVERN,
    icon: 'Landmark',
    shortcut: ['e', 'g'],
    items: [],
  },
  {
    title: 'FlowChain',
    url: ROUTES.ECOSYSTEM.FLOWCHAIN,
    icon: 'Boxes',
    shortcut: ['e', 'f'],
    items: [],
  },
];

export function filterNavItemsByRole(
  items: NavItem[],
  role: AppUserRole,
): NavItem[] {
  return items.flatMap((item) => {
    if (item.allowedRoles && !item.allowedRoles.includes(role)) {
      return [];
    }

    return [
      {
        ...item,
        items: filterNavItemsByRole(item.items, role),
      },
    ];
  });
}
