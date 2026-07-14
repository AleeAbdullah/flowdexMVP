import { API_ROUTES } from '@/api-routes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, extractAxiosError } from '@/lib/axios';
import { toast } from 'sonner';
import type {
  BroadcastPreparedTronTransactionInput,
  BroadcastPreparedTronTransactionResponse,
  CreatePaymentIntentInput,
  IPaymentCheckoutCapabilitiesResponse,
  IPaymentBuyConfigResponse,
  IPaymentCheckoutSession,
  IPreparedWalletAction,
  IPaymentLeadersResponse,
  IPaymentIntentStatusResponse,
  IPaymentPortfolioTransaction,
  IPaymentPortfolioResponse,
  IPaymentPublic,
  IPaymentsHistoryResponse,
  PaymentChain,
  PaymentHistoryFilters,
  PaymentTransactionIdKind,
  PreparePaymentWalletActionInput,
  SubmitPaymentTxResultInput,
} from './payments.types';

export const paymentsQueryKeys = {
  buyConfig: ['app', 'payments', 'buy-config'] as const,
  checkoutCapabilities: ['app', 'payments', 'checkout-capabilities'] as const,
  intentStatus: (intentId: string | null | undefined) => ['app', 'payments', 'intent-status', intentId ?? 'none'] as const,
  history: (walletAddress: string | null | undefined) => ['app', 'payments', 'history', walletAddress ?? 'none'] as const,
  portfolio: (walletAddress: string | null | undefined) => ['app', 'payments', 'portfolio', walletAddress ?? 'none'] as const,
  leaders: (limit: number) => ['app', 'payments', 'leaders', limit] as const,
};

const browserPublicProxyConfig = typeof window === 'undefined'
  ? undefined
  : { baseURL: API_ROUTES.proxy.publicBackend };

function getTransactionIdKind(chain: PaymentChain, txHash: string | null): PaymentTransactionIdKind | null {
  if (!txHash) {
    return null;
  }

  switch (chain) {
    case 'ETHEREUM':
      return 'evm_tx_hash';
    case 'SOLANA':
      return 'solana_signature';
    case 'BITCOIN':
      return 'btc_tx_hash';
    case 'TRON':
      return 'tron_tx_hash';
  }
}

function normalizePayment(payment: IPaymentPublic): IPaymentPublic {
  return {
    ...payment,
    transactionId: payment.transactionId ?? payment.txHash,
    transactionIdKind: payment.transactionIdKind ?? getTransactionIdKind(payment.chain, payment.txHash),
  };
}

function normalizePaymentIntentStatus(response: IPaymentIntentStatusResponse): IPaymentIntentStatusResponse {
  return {
    ...response,
    payment: response.payment ? normalizePayment(response.payment) : null,
  };
}

function normalizePortfolioTransaction(transaction: IPaymentPortfolioTransaction): IPaymentPortfolioTransaction {
  return {
    ...transaction,
    paymentId: transaction.paymentId ?? null,
    transactionId: transaction.transactionId ?? transaction.txHash,
    transactionIdKind: transaction.transactionIdKind ?? getTransactionIdKind(transaction.chain, transaction.txHash),
  };
}

function normalizePaymentHistory(response: IPaymentsHistoryResponse): IPaymentsHistoryResponse {
  return {
    ...response,
    items: response.items.map(normalizePayment),
  };
}

function normalizePaymentPortfolio(response: IPaymentPortfolioResponse): IPaymentPortfolioResponse {
  return {
    ...response,
    transactions: response.transactions.map(normalizePortfolioTransaction),
  };
}

export const paymentsService = {
  createPaymentIntent(input: CreatePaymentIntentInput) {
    return api.post<IPaymentCheckoutSession>(
      API_ROUTES.public.payments.intents,
      input,
      browserPublicProxyConfig,
    );
  },
  getCheckoutCapabilities() {
    return api.get<IPaymentCheckoutCapabilitiesResponse>(
      API_ROUTES.public.payments.checkoutCapabilities,
      browserPublicProxyConfig,
    );
  },
  getBuyConfig() {
    return api.get<IPaymentBuyConfigResponse>(
      API_ROUTES.public.payments.buyConfig,
      browserPublicProxyConfig,
    );
  },
  getPaymentIntentStatus(intentId: string) {
    return api.get<IPaymentIntentStatusResponse>(
      API_ROUTES.public.payments.intentStatus(intentId),
      browserPublicProxyConfig,
    ).then(normalizePaymentIntentStatus);
  },
  getPaymentHistory(filters: PaymentHistoryFilters) {
    return api.get<IPaymentsHistoryResponse>(
      API_ROUTES.public.payments.root,
      { ...browserPublicProxyConfig, params: filters },
    ).then(normalizePaymentHistory);
  },
  getPaymentLeaders(limit = 10) {
    return api.get<IPaymentLeadersResponse>(
      API_ROUTES.public.payments.leaders({ limit }),
      browserPublicProxyConfig,
    );
  },
  getPaymentPortfolio(filters: PaymentHistoryFilters) {
    return api.get<IPaymentPortfolioResponse>(
      API_ROUTES.public.payments.portfolio(filters),
      browserPublicProxyConfig,
    ).then(normalizePaymentPortfolio);
  },
  async prepareWalletAction(
    intentId: string,
    checkoutToken: string,
    input: PreparePaymentWalletActionInput,
  ): Promise<IPreparedWalletAction> {
    const response = await api.post<IPreparedWalletAction>(
      API_ROUTES.public.payments.intentWalletAction(intentId),
      input,
      {
        ...browserPublicProxyConfig,
        headers: { 'x-payment-checkout-token': checkoutToken },
      },
    );
    return response;
  },
  async submitPaymentIntentTxResult(
    intentId: string,
    checkoutToken: string,
    input: SubmitPaymentTxResultInput,
  ): Promise<IPaymentIntentStatusResponse> {
    const response = await api.post<IPaymentIntentStatusResponse>(
      API_ROUTES.public.payments.intentTxResult(intentId),
      input,
      {
        ...browserPublicProxyConfig,
        headers: { 'x-payment-checkout-token': checkoutToken },
      },
    );
    return response;
  },
  async broadcastPreparedTronTransaction(
    intentId: string,
    preparedActionId: string,
    checkoutToken: string,
    input: BroadcastPreparedTronTransactionInput,
  ): Promise<BroadcastPreparedTronTransactionResponse> {
    return api.post<BroadcastPreparedTronTransactionResponse>(
      API_ROUTES.public.payments.intentTronBroadcast(intentId, preparedActionId),
      input,
      {
        ...browserPublicProxyConfig,
        headers: { 'x-payment-checkout-token': checkoutToken },
      },
    );
  },
};

export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: (input: CreatePaymentIntentInput) => paymentsService.createPaymentIntent(input),
    onError(error) {
      const details = extractAxiosError(error);
      toast.error(details.message || 'Could not start this payment');
    },
  });
}

export function usePreparePaymentWalletAction() {
  return useMutation({
    mutationFn: (input: { intentId: string; checkoutToken: string; payload: PreparePaymentWalletActionInput }) => (
      paymentsService.prepareWalletAction(input.intentId, input.checkoutToken, input.payload)
    ),
    onError(error, input) {
      const details = extractAxiosError(error);
      if (input.payload.chain === 'SOLANA' && details.code === 'SOLANA_WALLET_CHECKOUT_UNAVAILABLE') {
        return;
      }

      toast.error(details.message || 'Could not prepare wallet payment');
    },
  });
}

export function useSubmitPaymentIntentTxResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { intentId: string; checkoutToken: string; payload: SubmitPaymentTxResultInput }) => (
      paymentsService.submitPaymentIntentTxResult(input.intentId, input.checkoutToken, input.payload)
    ),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.intentStatus(result.intent.id) }),
        queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.portfolio(result.intent.senderAddress) }),
        queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.history(result.intent.senderAddress) }),
      ]);
    },
    onError(error) {
      const details = extractAxiosError(error);
      toast.error(details.message || 'Could not attach wallet transaction');
    },
  });
}

export function usePaymentHistory(walletAddress: string | null) {
  return useQuery({
    queryKey: paymentsQueryKeys.history(walletAddress),
    queryFn: () => paymentsService.getPaymentHistory({ walletAddress: walletAddress! }),
    enabled: Boolean(walletAddress),
  });
}

export function usePaymentCheckoutCapabilities() {
  return useQuery({
    queryKey: paymentsQueryKeys.checkoutCapabilities,
    queryFn: paymentsService.getCheckoutCapabilities,
    staleTime: 60_000,
  });
}

export function usePaymentBuyConfig(enabled = true) {
  return useQuery({
    queryKey: paymentsQueryKeys.buyConfig,
    queryFn: paymentsService.getBuyConfig,
    staleTime: 60_000,
    retry: false,
    enabled,
  });
}

export function usePaymentLeaders(limit = 10) {
  return useQuery({
    queryKey: paymentsQueryKeys.leaders(limit),
    queryFn: () => paymentsService.getPaymentLeaders(limit),
    staleTime: 30_000,
    retry: false,
  });
}

export function usePaymentPortfolio(walletAddress: string | null) {
  return useQuery({
    queryKey: paymentsQueryKeys.portfolio(walletAddress),
    queryFn: () => paymentsService.getPaymentPortfolio({ walletAddress: walletAddress! }),
    enabled: Boolean(walletAddress),
    staleTime: 30_000,
  });
}
