'use client';

import type {
  AdminStats,
  AdminTransactionFilters,
  AdminTransactionsResponse,
  AdminUnmatchedTransactionsResponse,
  AuthMe,
  CreateRefundInput,
  CreatePurchaseIntentInput,
  CreateWalletChallengeInput,
  DashboardSummary,
  PurchaseIntentResponse,
  RefundListResponse,
  ReportTransactionInput,
  TransactionListItem,
  TransactionsResponse,
  VerifyWalletSignatureInput,
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
    const message = typeof payload === 'object' && payload && 'message' in payload
      ? String(payload.message)
      : typeof payload === 'string'
        ? payload
        : `Request failed with status ${response.status}`;

    if (response.status === 401 && typeof window !== 'undefined') {
      window.location.assign('/login');
    }

    throw new Error(message);
  }

  return payload as T;
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
  verifyWalletSignature(input: VerifyWalletSignatureInput) {
    return fetchAppApi<Wallet>(APP_API_ROUTES.walletVerify, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  deleteWallet(id: string) {
    return fetchAppApi<{ deleted: true }>(`${APP_API_ROUTES.wallets}/${id}`, {
      method: 'DELETE',
    });
  },
  createPurchaseIntent(input: CreatePurchaseIntentInput) {
    return fetchAppApi<PurchaseIntentResponse>(APP_API_ROUTES.purchaseIntents, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
  reportPurchaseTransaction(intentId: string, input: ReportTransactionInput) {
    return fetchAppApi<{ accepted: true }>(`${APP_API_ROUTES.purchaseIntents}/${intentId}/report-tx`, {
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
  getAdminUnmatchedTransactions() {
    return fetchAppApi<AdminUnmatchedTransactionsResponse>(APP_API_ROUTES.adminReconciliationUnmatched, {
      cache: 'no-store',
    });
  },
  getAdminRefunds() {
    return fetchAppApi<RefundListResponse>(APP_API_ROUTES.adminRefunds, {
      cache: 'no-store',
    });
  },
  createAdminRefund(input: CreateRefundInput) {
    return fetchAppApi<{ refundId: string; status: string }>(APP_API_ROUTES.adminRefunds, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
