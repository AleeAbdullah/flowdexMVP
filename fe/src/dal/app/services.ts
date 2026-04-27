'use client';

import type {
  AdminStats,
  AdminTransactionFilters,
  AdminTransactionsResponse,
  AuthMe,
  CreateWalletChallengeInput,
  DashboardSummary,
  LinkWalletInput,
  SimulateTransactionInput,
  SimulateTransactionResult,
  TrackTransactionInput,
  TrackTransactionResult,
  TransactionListItem,
  TransactionsResponse,
  Wallet,
  WalletChallenge,
  WalletListResponse,
} from './types';
import { APP_API_ROUTES } from './routes';

async function fetchAppApi<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = resolveErrorMessage(payload, response.status);

    if (response.status === 401 && typeof window !== 'undefined') {
      window.location.assign('/login');
    }

    throw new Error(message);
  }

  return payload as T;
}

function resolveErrorMessage(payload: unknown, status: number): string {
  const fallback = `Request failed with status ${status}`;

  if (typeof payload === 'object' && payload) {
    if ('message' in payload) {
      const raw = (payload as { message?: unknown }).message;
      if (Array.isArray(raw)) {
        const joined = raw.map(item => String(item)).join(', ').trim();
        if (joined) {
          return joined;
        }
      } else if (raw !== undefined && raw !== null) {
        const asText = String(raw).trim();
        if (asText) {
          return asText;
        }
      }
    }

    if ('error' in payload) {
      const asText = String((payload as { error?: unknown }).error ?? '').trim();
      if (asText) {
        return asText;
      }
    }
  }

  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return fallback;
}

export const appService = {
  getAuthMe() {
    return fetchAppApi<AuthMe>(APP_API_ROUTES.authMe, { cache: 'no-store' });
  },
  getDashboardSummary() {
    return fetchAppApi<DashboardSummary>(APP_API_ROUTES.dashboardSummary, { cache: 'no-store' });
  },
  getWallets() {
    return fetchAppApi<WalletListResponse>(APP_API_ROUTES.wallets, { cache: 'no-store' });
  },
  createWalletChallenge(input: CreateWalletChallengeInput) {
    return fetchAppApi<WalletChallenge>(APP_API_ROUTES.walletChallenge, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  linkWallet(input: LinkWalletInput) {
    return fetchAppApi<Wallet>(APP_API_ROUTES.walletLink, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  deleteWallet(id: string) {
    return fetchAppApi<{ deleted: true }>(`${APP_API_ROUTES.wallets}/${id}`, {
      method: 'DELETE',
    });
  },
  simulateTransaction(input: SimulateTransactionInput) {
    return fetchAppApi<SimulateTransactionResult>(APP_API_ROUTES.transactionSimulate, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  trackTransaction(input: TrackTransactionInput) {
    return fetchAppApi<TrackTransactionResult>(APP_API_ROUTES.transactionTrack, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  getTransactions() {
    return fetchAppApi<TransactionsResponse>(APP_API_ROUTES.transactions, {
      cache: 'no-store',
    });
  },
  getTransaction(id: string) {
    return fetchAppApi<TransactionListItem>(`${APP_API_ROUTES.transactions}/${id}`, {
      cache: 'no-store',
    });
  },
  getAdminStats() {
    return fetchAppApi<AdminStats>(APP_API_ROUTES.adminStats, { cache: 'no-store' });
  },
  getAdminTransactions(filters?: AdminTransactionFilters) {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(filters ?? {})) {
      if (value) {
        query.set(key, value);
      }
    }

    const path = query.size > 0
      ? `${APP_API_ROUTES.adminTransactions}?${query.toString()}`
      : APP_API_ROUTES.adminTransactions;

    return fetchAppApi<AdminTransactionsResponse>(path, { cache: 'no-store' });
  },
  getAdminTransaction(id: string) {
    return fetchAppApi<TransactionListItem>(`${APP_API_ROUTES.adminTransactions}/${id}`, {
      cache: 'no-store',
    });
  },
  reconcileAdminTransaction(id: string) {
    return fetchAppApi<TransactionListItem>(APP_API_ROUTES.adminTransactionReconcile(id), {
      method: 'POST',
    });
  },
};
