import { shouldPersistAppRedirectPath } from '@/lib/auth-redirect';

type QueryValue = string | number | boolean | null | undefined;

function buildPathname(
  pathname: string,
  query?: Record<string, QueryValue>,
) {
  if (!query) {
    return pathname;
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export const AUTH_TOASTS = {
  BACKEND_UNREACHABLE: 'backend_unreachable',
} as const;

export type AuthToast = (typeof AUTH_TOASTS)[keyof typeof AUTH_TOASTS];

export const ROUTES = {
  MARKETING: {
    HOME: '/',
    ABOUT: '/about',
    BUY: '/buy',
    FAQ: '/faq',
    LEGAL: '/legal',
    PRIVACY: '/privacy',
    ROADMAP: '/roadmap',
    TERMS: '/terms',
    TOKENOMICS: '/tokenomics',
    UPDATES: '/updates',
    WHITEPAPER: '/whitepaper',
    BLOGS: '/blogs',
  },
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/signup',
  },
  DASHBOARD: {
    HOME: '/app',
    ACCOUNT: '/app/account',
  },
  WORKSPACE: {
    HOME: '/app',
    WALLETS: '/app/wallets',
    BUY: '/app/buy',
    TRANSACTIONS: '/app/transactions',
    transactionDetail: (id: string) => `/app/transactions/${id}`,
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
    TRANSACTIONS: '/app/admin/transactions',
    transactionDetail: (id: string) => `/app/admin/transactions/${id}`,
  },
  ASSETS: {
    WHITEPAPER_DOC: '/assets/whitepaper/FlowDex_Whitepaper.docx',
  },
} as const;

export function getLoginRoute(nextPath?: string | null) {
  return shouldPersistAppRedirectPath(nextPath ?? '')
    ? buildPathname(ROUTES.AUTH.LOGIN, { next: nextPath })
    : ROUTES.AUTH.LOGIN;
}

export function getSignupRoute(nextPath?: string | null) {
  return shouldPersistAppRedirectPath(nextPath ?? '')
    ? buildPathname(ROUTES.AUTH.SIGNUP, { next: nextPath })
    : ROUTES.AUTH.SIGNUP;
}

export function getPublicAuthToastRoute(input: {
  toast: AuthToast;
  userEmail?: string | null;
  userName?: string | null;
  userRole?: string | null;
}) {
  return buildPathname(ROUTES.MARKETING.HOME, {
    auth_toast: input.toast,
    user_email: input.userEmail,
    user_name: input.userName,
    user_role: input.userRole,
  });
}

