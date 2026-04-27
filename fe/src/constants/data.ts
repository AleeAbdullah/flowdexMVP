import type { AppUserRole } from '@/dal/app/types';

export const ROUTES = {
  DASHBOARD: {
    HOME: '/app',
    ACCOUNT: '/app/account',
  },
  WORKSPACE: {
    HOME: '/app',
    WALLETS: '/app/wallets',
    BUY: '/app/buy',
    TRANSACTIONS: '/app/transactions',
  },
  MARKETS: {
    TRADE: '/app/trade',
    PORTFOLIO: '/app/portfolio',
    STAKE: '/app/stake',
  },
  ECOSYSTEM: {
    GOVERN: '/app/govern',
    FLOWCHAIN: '/app/flowchain',
  },
  ADMIN: {
    HOME: '/app/admin',
  },
} as const;

export type NavIconName =
  | 'home'
  | 'category'
  | 'overview'
  | 'account'
  | 'wallet'
  | 'banknote'
  | 'receipt'
  | 'chart'
  | 'portfolio'
  | 'stake'
  | 'sparkles'
  | 'govern'
  | 'flowchain'
  | 'shield';

export type NavItem = {
  title: string;
  url: string;
  icon: NavIconName;
  shortcut?: string[];
  allowedRoles?: AppUserRole[];
  items: NavItem[];
};

export const navItems: NavItem[] = [
  {
    title: 'Home',
    url: ROUTES.DASHBOARD.HOME,
    icon: 'home',
    shortcut: ['g', 'h'],
    items: [],
  },
  {
    title: 'Workspace',
    url: ROUTES.WORKSPACE.HOME,
    icon: 'category',
    shortcut: ['a', 'p'],
    items: [
      {
        title: 'Overview',
        url: ROUTES.DASHBOARD.HOME,
        icon: 'overview',
        items: [
          {
            title: 'Dashboard',
            url: ROUTES.DASHBOARD.HOME,
            icon: 'home',
            shortcut: ['g', 'd'],
            items: [],
          },
          {
            title: 'Account',
            url: ROUTES.DASHBOARD.ACCOUNT,
            icon: 'account',
            shortcut: ['g', 'a'],
            items: [],
          },
        ],
      },
      {
        title: 'Operations',
        url: ROUTES.WORKSPACE.WALLETS,
        icon: 'wallet',
        items: [
          {
            title: 'Wallets',
            url: ROUTES.WORKSPACE.WALLETS,
            icon: 'wallet',
            shortcut: ['w', 'w'],
            items: [],
          },
          {
            title: 'Buy',
            url: ROUTES.WORKSPACE.BUY,
            icon: 'banknote',
            shortcut: ['w', 'b'],
            items: [],
          },
          {
            title: 'Transactions',
            url: ROUTES.WORKSPACE.TRANSACTIONS,
            icon: 'receipt',
            shortcut: ['w', 't'],
            items: [],
          },
        ],
      },
      {
        title: 'Markets',
        url: ROUTES.MARKETS.TRADE,
        icon: 'chart',
        items: [
          {
            title: 'Trade',
            url: ROUTES.MARKETS.TRADE,
            icon: 'chart',
            shortcut: ['m', 't'],
            items: [],
          },
          {
            title: 'Portfolio',
            url: ROUTES.MARKETS.PORTFOLIO,
            icon: 'portfolio',
            shortcut: ['m', 'p'],
            items: [],
          },
          {
            title: 'Stake',
            url: ROUTES.MARKETS.STAKE,
            icon: 'stake',
            shortcut: ['m', 's'],
            items: [],
          },
        ],
      },
      {
        title: 'Ecosystem',
        url: ROUTES.ECOSYSTEM.GOVERN,
        icon: 'sparkles',
        items: [
          {
            title: 'Govern',
            url: ROUTES.ECOSYSTEM.GOVERN,
            icon: 'govern',
            shortcut: ['e', 'g'],
            items: [],
          },
          {
            title: 'FlowChain',
            url: ROUTES.ECOSYSTEM.FLOWCHAIN,
            icon: 'flowchain',
            shortcut: ['e', 'f'],
            items: [],
          },
        ],
      },
    ],
  },
  {
    title: 'Admin',
    url: ROUTES.ADMIN.HOME,
    icon: 'shield',
    shortcut: ['a', 'd'],
    allowedRoles: ['ADMIN'],
    items: [
      {
        title: 'Dashboard',
        url: ROUTES.ADMIN.HOME,
        icon: 'shield',
        items: [],
      },
    ],
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

    const children = filterNavItemsByRole(item.items, role);

    return [
      {
        ...item,
        items: children,
      },
    ];
  });
}
