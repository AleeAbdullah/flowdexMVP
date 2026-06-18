'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatUnits, isAddress } from 'viem';
import type { BuySnapshot } from '@/components/flowdex/buy-page-types';
import { buildBuyMarketModel } from '@/components/flowdex/buy-page-market';
import { formatCompact, formatCurrency, formatDateTime, formatPlainNumber } from '@/components/flowdex/utils';
import {
  buildWalletSupportRegistry,
  getBuyWalletPickerEntries,
  getWalletSupportRuntime,
} from '@/constants/wallet-support';
import {
  paymentsQueryKeys,
  paymentsService,
  useCreatePaymentIntent,
} from '@/dal/app/payments/payments.services';
import {
  PAYMENT_CHAINS,
  PAYMENT_INTENT_STATUSES,
  PAYMENT_TERMINAL_STATUSES,
  type IPaymentIntentPublic,
  type IPaymentPublic,
  type PaymentAsset,
  type PaymentChain,
  type PaymentIntentStatus,
} from '@/dal/app/payments/payments.types';
import { extractAxiosError } from '@/lib/axios';
import { ROUTES } from '@/routes';
import { useMarketingWalletStore } from '@/hooks/use-marketing-wallet-store';
import { normalizeMarketingWalletConnectorName, useMarketingWalletSync } from '@/hooks/use-marketing-wallet-sync';
import {
  buildSupportedAssetOptions,
  getChainLabel,
  getChainLabelFromId,
  resolvePreferredSupportedAssetId,
} from '../utils/supported-asset-options';
import type {
  ActivePaymentView,
  BuyActionId,
  BuyUiTone,
  PaymentInstructionSummary,
} from '../types/buy-view-model';

const ACTIVE_PAYMENT_STORAGE_KEY = 'flowdex.activePaymentIntent.v1';
const DEFAULT_BUY_AMOUNT = '500';
const PAYMENT_STATUS_POLL_INTERVAL_MS = 12_000;
const PAYMENT_STATUS_RATE_LIMIT_BACKOFF_MS = 30_000;

const ASSET_DECIMALS: Record<PaymentAsset, number> = {
  ETH: 18,
  SOL: 9,
  BTC: 8,
};

type StoredActivePayment = {
  intent: IPaymentIntentPublic;
  payment: IPaymentPublic | null;
};

function readStoredActivePayment(): ActivePaymentView | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(ACTIVE_PAYMENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredActivePayment;
    if (!parsed.intent?.id) {
      return null;
    }

    return {
      intent: parsed.intent,
      payment: parsed.payment ?? null,
    };
  } catch {
    return null;
  }
}

function writeStoredActivePayment(payment: ActivePaymentView | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!payment) {
    window.sessionStorage.removeItem(ACTIVE_PAYMENT_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(ACTIVE_PAYMENT_STORAGE_KEY, JSON.stringify(payment));
}

function formatTokenAmount(input: number) {
  if (!Number.isFinite(input) || input <= 0) {
    return '';
  }

  return input.toFixed(6).replace(/\.?0+$/u, '');
}

function formatPaymentAmount(baseUnits: string, asset: PaymentAsset) {
  try {
    return `${formatUnits(BigInt(baseUnits), ASSET_DECIMALS[asset])} ${asset}`;
  } catch {
    return `${baseUnits} ${asset}`;
  }
}

function formatCompactCurrency(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits,
  }).format(value);
}

function getPaymentStatusCopy(status: PaymentIntentStatus): {
  title: string;
  description: string;
  tone: BuyUiTone;
} {
  switch (status) {
    case PAYMENT_INTENT_STATUSES.WAITING:
      return {
        title: 'Waiting for payment',
        description: 'Send the exact amount shown. This page will update when the payment is detected.',
        tone: 'info',
      };
    case PAYMENT_INTENT_STATUSES.DETECTED:
      return {
        title: 'Payment detected',
        description: 'The payment was found on-chain and is moving toward confirmation.',
        tone: 'info',
      };
    case PAYMENT_INTENT_STATUSES.CONFIRMING:
      return {
        title: 'Confirming payment',
        description: 'The payment is on-chain. We are waiting for the required confirmations.',
        tone: 'info',
      };
    case PAYMENT_INTENT_STATUSES.CONFIRMED:
      return {
        title: 'Payment confirmed',
        description: 'Your presale payment is confirmed and recorded for admin allocation review.',
        tone: 'success',
      };
    case PAYMENT_INTENT_STATUSES.UNDERPAID:
      return {
        title: 'Amount was too low',
        description: 'The received amount was lower than the required amount. Support review is needed.',
        tone: 'warning',
      };
    case PAYMENT_INTENT_STATUSES.OVERPAID:
      return {
        title: 'Amount was higher than expected',
        description: 'The received amount was higher than expected. Support review is needed.',
        tone: 'warning',
      };
    case PAYMENT_INTENT_STATUSES.EXPIRED:
      return {
        title: 'Payment window expired',
        description: 'This payment window expired before a matching payment was confirmed. Start a new purchase.',
        tone: 'warning',
      };
    case PAYMENT_INTENT_STATUSES.LATE_PAID:
      return {
        title: 'Payment arrived after expiry',
        description: 'A payment was detected after expiry. Support review is needed before allocation.',
        tone: 'warning',
      };
    case PAYMENT_INTENT_STATUSES.FAILED:
    default:
      return {
        title: 'Payment could not be confirmed',
        description: 'The payment could not be confirmed. Start a new purchase or contact support.',
        tone: 'danger',
      };
  }
}

function normalizeOptionalAddress(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isPaymentChain(value: string): value is PaymentChain {
  return value === PAYMENT_CHAINS.ETHEREUM
    || value === PAYMENT_CHAINS.SOLANA
    || value === PAYMENT_CHAINS.BITCOIN;
}

function isSimpleSolanaAddress(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/u.test(value.trim());
}

function isSimpleBitcoinAddress(value: string) {
  return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,90}$/u.test(value.trim());
}

export function useBuyCheckoutController(snapshot: BuySnapshot) {
  const market = buildBuyMarketModel(snapshot);
  const supportedAssets = useMemo(() => buildSupportedAssetOptions(snapshot), [snapshot]);
  const queryClient = useQueryClient();
  const marketingWallet = useMarketingWalletSync();
  const createPaymentIntent = useCreatePaymentIntent();

  const provider = useMarketingWalletStore(state => state.provider);
  const verification = useMarketingWalletStore(state => state.verification);
  const checkout = useMarketingWalletStore(state => state.checkout);
  const setCheckoutSelectedAssetId = useMarketingWalletStore(state => state.setCheckoutSelectedAssetId);
  const setCheckoutAmountDisplay = useMarketingWalletStore(state => state.setCheckoutAmountDisplay);
  const clearCheckoutLifecycle = useMarketingWalletStore(state => state.clearCheckoutLifecycle);

  const [activePayment, setActivePayment] = useState<ActivePaymentView | null>(null);
  const [paymentWalletAddress, setPaymentWalletAddress] = useState('');
  const [directPaymentWalletModalOpen, setDirectPaymentWalletModalOpen] = useState(false);
  const [walletConnectModalOpen, setWalletConnectModalOpen] = useState(false);
  const [walletPaymentRequested, setWalletPaymentRequested] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const statusRequestInFlightRef = useRef(false);
  const statusBackoffUntilRef = useRef(0);
  const manualSelectedAssetIdRef = useRef<string | null>(null);
  const walletPaymentSubmissionInFlightRef = useRef(false);

  const checkoutInProgress = checkout.submission !== 'idle' || Boolean(activePayment);
  const manualSelectionIsCurrent = Boolean(
    manualSelectedAssetIdRef.current
    && checkout.selectedAssetId === manualSelectedAssetIdRef.current
    && supportedAssets.some(asset => asset.id === manualSelectedAssetIdRef.current),
  );
  const preferredAssetId = resolvePreferredSupportedAssetId({
    selectedAssetId: checkout.selectedAssetId,
    preserveSelectedAsset: manualSelectionIsCurrent || checkoutInProgress,
    supportedAssets,
    verifiedChainId: verification.chainId,
    providerChainId: provider.status === 'connected' ? provider.chainId : null,
  });

  useEffect(() => {
    if (checkout.selectedAssetId === preferredAssetId) {
      return;
    }

    setCheckoutSelectedAssetId(preferredAssetId);
  }, [checkout.selectedAssetId, preferredAssetId, setCheckoutSelectedAssetId]);

  useEffect(() => {
    if (checkout.amountDisplay) {
      return;
    }

    setCheckoutAmountDisplay(DEFAULT_BUY_AMOUNT);
  }, [checkout.amountDisplay, setCheckoutAmountDisplay]);

  useEffect(() => {
    const stored = readStoredActivePayment();
    if (stored) {
      setActivePayment(stored);
    }
  }, []);

  useEffect(() => {
    writeStoredActivePayment(activePayment);
  }, [activePayment]);

  useEffect(() => {
    if (provider.status === 'connected' && provider.address && !paymentWalletAddress) {
      setPaymentWalletAddress(provider.address);
    }
  }, [paymentWalletAddress, provider.address, provider.status]);

  const selectedAsset = supportedAssets.find(asset => asset.id === (checkout.selectedAssetId ?? preferredAssetId)) ?? null;
  const selectedChainLabel = selectedAsset ? getChainLabel(selectedAsset.chain) : 'No chain selected';
  const walletChainLabel = getChainLabelFromId(provider.chainId);
  const walletStatusLabel = provider.status === 'connected' ? 'Connected optional' : 'Wallet optional';

  const walletSupportRegistry = useMemo(() => {
    const runtime = getWalletSupportRuntime();
    return buildWalletSupportRegistry({
      walletConnectEnabled: runtime.walletConnectEnabled,
    });
  }, []);
  const walletButtons = useMemo(() => {
    const availableConnectorNames = new Set(provider.availableConnectorNames);
    return [...getBuyWalletPickerEntries(walletSupportRegistry)].sort((left, right) => {
      if (left.id === 'wallet-connect') {
        return -1;
      }

      if (right.id === 'wallet-connect') {
        return 1;
      }

      return 0;
    }).map((entry) => {
      const normalizedConnectorName = normalizeMarketingWalletConnectorName(entry.accountKitName);
      const isConnectedConnector = provider.status === 'connected'
        && provider.connectorName === normalizedConnectorName;
      const isUnavailable = !availableConnectorNames.has(normalizedConnectorName);
      const isLockedByActiveWallet = provider.status === 'connected' && !isConnectedConnector;
      const displayName = entry.id === 'wallet-connect'
        ? 'Wallet'
        : entry.id === 'metamask'
          ? 'Connect MetaMask'
          : entry.id === 'coinbase-wallet'
            ? 'Connect Coinbase'
            : entry.displayName;
      return {
        id: entry.id,
        label: displayName,
        caption: isConnectedConnector
          ? 'This is the active wallet for the current checkout.'
          : isLockedByActiveWallet
            ? 'Disconnect the active wallet before selecting this option.'
            : entry.releaseTier === 'fallback'
              ? 'Connect with WalletConnect to pay from a supported wallet.'
              : 'Connect this wallet to pay from its active address.',
        mode: entry.releaseTier === 'fallback' ? 'session-gated' as const : 'direct' as const,
        busy: provider.status === 'checking' && provider.pendingConnectorName === normalizedConnectorName,
        connected: isConnectedConnector,
        disabled: isUnavailable || provider.status === 'checking' || provider.status === 'connected',
        onClick: () => {
          clearCheckoutLifecycle();
          setFormError(null);
          setWalletPaymentRequested(true);
          marketingWallet.clearConnectionIssue();
          marketingWallet.connectByName(normalizedConnectorName, { chainId: 1 });
        },
      };
    });
  }, [
    clearCheckoutLifecycle,
    marketingWallet,
    provider.availableConnectorNames,
    provider.pendingConnectorName,
    provider.status,
    walletSupportRegistry,
  ]);

  const usdAmount = Number(checkout.amountDisplay);
  const tokenAmount = market.tokenPriceUsd > 0 ? usdAmount / market.tokenPriceUsd : 0;
  const tokenAmountInput = formatTokenAmount(tokenAmount);
  const estimatedTokensDisplay = tokenAmount > 0 ? formatPlainNumber(tokenAmount, 2) : '0';
  const estimatedContributionUsdDisplay = Number.isFinite(usdAmount) && usdAmount > 0 ? formatCurrency(usdAmount, 0) : '$0';

  function getPaymentWalletValidation(addressInput: string) {
    const address = addressInput.trim();
    if (!selectedAsset) {
      return null;
    }

    if (selectedAsset.chain === PAYMENT_CHAINS.ETHEREUM) {
      if (!address) {
        return 'Enter the Ethereum wallet address you will pay from.';
      }

      return isAddress(address) ? null : 'Enter a valid EVM wallet address.';
    }

    if (!address) {
      return null;
    }

    if (selectedAsset.chain === PAYMENT_CHAINS.SOLANA) {
      return isSimpleSolanaAddress(address) ? null : 'Enter a valid Solana public key or leave this blank.';
    }

    if (selectedAsset.chain === PAYMENT_CHAINS.BITCOIN) {
      return isSimpleBitcoinAddress(address) ? null : 'Enter a valid Bitcoin address or leave this blank.';
    }

    return null;
  }

  const paymentWalletValidation = getPaymentWalletValidation(paymentWalletAddress);

  const canSubmit = Boolean(
    selectedAsset
    && !activePayment
    && !createPaymentIntent.isPending
    && checkout.submission !== 'creating_intent'
    && checkout.amountDisplay
    && Number.isFinite(usdAmount)
    && usdAmount > 0
    && tokenAmountInput
  );

  const paymentInstruction = activePayment
    ? buildPaymentInstructionSummary(activePayment.intent, activePayment.payment, selectedChainLabel)
    : null;
  const latestExplorerUrl = activePayment?.payment?.txHash
    ? getExplorerUrl(activePayment.payment.chain, activePayment.payment.txHash)
    : null;

  async function refreshStatus(intentId: string) {
    if (statusRequestInFlightRef.current || Date.now() < statusBackoffUntilRef.current) {
      return;
    }

    statusRequestInFlightRef.current = true;
    setIsCheckingStatus(true);

    try {
      const result = await paymentsService.getPaymentIntentStatus(intentId);
      setActivePayment({
        intent: result.intent,
        payment: result.payment,
      });
      setStatusError(null);
      await queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.history(result.intent.senderAddress) });
    } catch (error) {
      const details = extractAxiosError(error);
      if (details.status === 429) {
        statusBackoffUntilRef.current = Date.now() + PAYMENT_STATUS_RATE_LIMIT_BACKOFF_MS;
        setStatusError('Payment status is updating slowly. Checking again shortly.');
      } else {
        setStatusError(details.message || 'Could not refresh payment status. Retrying shortly.');
      }
    } finally {
      statusRequestInFlightRef.current = false;
      setIsCheckingStatus(false);
    }
  }

  useEffect(() => {
    if (!activePayment || PAYMENT_TERMINAL_STATUSES.has(activePayment.intent.status)) {
      return;
    }

    void refreshStatus(activePayment.intent.id);
    const interval = window.setInterval(() => {
      void refreshStatus(activePayment.intent.id);
    }, PAYMENT_STATUS_POLL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [activePayment?.intent.id, activePayment?.intent.status]);

  function handleAssetChange(assetId: string) {
    manualSelectedAssetIdRef.current = assetId;
    setFormError(null);
    setCheckoutSelectedAssetId(assetId);
  }

  function handleAmountChange(value: string) {
    setFormError(null);
    setCheckoutAmountDisplay(value.replace(/[^\d.]/gu, ''));
  }

  function getNormalizedSenderAddress(addressInput: string | undefined) {
    if (!selectedAsset) {
      return undefined;
    }

    const address = addressInput?.trim() ?? '';
    if (!address) {
      return undefined;
    }

    if (selectedAsset.chain === PAYMENT_CHAINS.ETHEREUM) {
      return isAddress(address) ? address : undefined;
    }

    if (selectedAsset.chain === PAYMENT_CHAINS.SOLANA) {
      return isSimpleSolanaAddress(address) ? address : undefined;
    }

    if (selectedAsset.chain === PAYMENT_CHAINS.BITCOIN) {
      return isSimpleBitcoinAddress(address) ? address : undefined;
    }

    return undefined;
  }

  async function handleSubmitContribution(options?: {
    senderAddressOverride?: string;
    requireEthSenderModal?: boolean;
  }) {
    if (!selectedAsset || !canSubmit || !isPaymentChain(selectedAsset.chain)) {
      return;
    }

    const senderAddressInput = options?.senderAddressOverride ?? paymentWalletAddress;
    const senderAddressValidation = getPaymentWalletValidation(senderAddressInput);

    if (selectedAsset.chain === PAYMENT_CHAINS.ETHEREUM && senderAddressValidation) {
      setFormError(senderAddressValidation);
      if (options?.requireEthSenderModal !== false) {
        setDirectPaymentWalletModalOpen(true);
      }
      return;
    }

    const senderAddress = getNormalizedSenderAddress(senderAddressInput);

    if (selectedAsset.chain === PAYMENT_CHAINS.ETHEREUM && !senderAddress) {
      setFormError('Enter the Ethereum wallet address you will pay from.');
      if (options?.requireEthSenderModal !== false) {
        setDirectPaymentWalletModalOpen(true);
      }
      return;
    }

    setFormError(null);
    try {
      const intent = await createPaymentIntent.mutateAsync({
        chain: selectedAsset.chain,
        asset: selectedAsset.code,
        tokenAmount: tokenAmountInput,
        senderAddress: senderAddress ? normalizeOptionalAddress(senderAddress) : undefined,
      });

      const nextPayment = {
        intent,
        payment: null,
      };
      setActivePayment(nextPayment);
      setDirectPaymentWalletModalOpen(false);
      setWalletConnectModalOpen(false);
      setWalletPaymentRequested(false);
      writeStoredActivePayment(nextPayment);
    } catch (error) {
      const details = extractAxiosError(error);
      setFormError(details.message || 'Could not start this payment.');
      if (options?.requireEthSenderModal === false) {
        setWalletConnectModalOpen(false);
        setWalletPaymentRequested(false);
      }
    }
  }

  function handlePayDirect() {
    void handleSubmitContribution({ requireEthSenderModal: true });
  }

  function handlePayViaWallet() {
    if (selectedAsset?.chain !== PAYMENT_CHAINS.ETHEREUM) {
      setFormError('Pay via wallet is available for ETH payments only.');
      return;
    }

    if (!canSubmit) {
      return;
    }

    setFormError(null);
    setWalletPaymentRequested(true);
    setWalletConnectModalOpen(true);
  }

  useEffect(() => {
    if (
      !walletPaymentRequested
      || walletPaymentSubmissionInFlightRef.current
      || provider.status !== 'connected'
      || !provider.address
      || selectedAsset?.chain !== PAYMENT_CHAINS.ETHEREUM
      || !canSubmit
    ) {
      return;
    }

    walletPaymentSubmissionInFlightRef.current = true;
    setPaymentWalletAddress(provider.address);
    void handleSubmitContribution({
      senderAddressOverride: provider.address,
      requireEthSenderModal: false,
    }).finally(() => {
      setWalletPaymentRequested(false);
      walletPaymentSubmissionInFlightRef.current = false;
    });
  }, [canSubmit, handleSubmitContribution, provider.address, provider.status, selectedAsset?.chain, walletPaymentRequested]);

  function handleStartNewPayment() {
    setActivePayment(null);
    setStatusError(null);
    setFormError(null);
    writeStoredActivePayment(null);
  }

  const actionHandlers = {
    submitContribution: handlePayDirect,
    viewReceipts: () => {
      window.location.assign(ROUTES.USER.TRANSACTIONS);
    },
    disconnectWallet: marketingWallet.disconnectWallet,
    switchNetwork: () => undefined,
    startNewPayment: handleStartNewPayment,
    verifyWallet: () => undefined,
    retryTracking: () => undefined,
  };

  return {
    walletStatusLabel,
    connectedWalletAddress: provider.address,
    walletChainLabel,
    selectedChainLabel,
    selectedAsset,
    supportedAssets,
    selectedAssetId: checkout.selectedAssetId ?? preferredAssetId ?? '',
    onAssetChange: handleAssetChange,
    amountDisplay: checkout.amountDisplay,
    onAmountChange: handleAmountChange,
    contributionEnabled: Boolean(selectedAsset && !activePayment),
    estimatedContributionUsdDisplay,
    estimatedTokensDisplay,
    latestExplorerUrl,
    walletButtons,
    directPayDisabled: !canSubmit,
    walletPayDisabled: !canSubmit || selectedAsset?.chain !== PAYMENT_CHAINS.ETHEREUM,
    secondaryActionDisabled: marketingWallet.isDisconnecting,
    onPayDirect: handlePayDirect,
    onPayViaWallet: handlePayViaWallet,
    onAction(actionId: BuyActionId | null) {
      if (!actionId) {
        return;
      }

      void actionHandlers[actionId]?.();
    },
    currentTier: market.currentTier,
    tokenPriceDisplay: formatCurrency(market.tokenPriceUsd, 4),
    raisedDisplay: formatCurrency(market.fundsRaisedUsd, 0),
    targetRaisedDisplay: market.targetRaisedUsd > 0 ? formatCompactCurrency(market.targetRaisedUsd) : '$0',
    remainingRaiseDisplay: formatCurrency(market.remainingRaiseUsd, 0),
    tokensSoldDisplay: `${formatCompact(market.tokensSold, 2)} $FDP`,
    nextTierPriceDisplay: market.nextTierTokenPriceUsd
      ? formatCurrency(market.nextTierTokenPriceUsd, 4)
      : formatCurrency(market.listingReferenceUsd, 2),
    discountPercentDisplay: `${market.discountPercent}% Discount`,
    raisedProgressPercent: market.raisedProgressPercent,
    sourceUpdatedAt: market.sourceUpdatedAt,
    listingReferenceDisplay: formatCurrency(market.listingReferenceUsd, 2),
    paymentWalletAddress,
    onPaymentWalletAddressChange(value: string) {
      setPaymentWalletAddress(value);
      setFormError(null);
    },
    directPaymentWalletModalOpen,
    onDirectPaymentWalletModalOpenChange: setDirectPaymentWalletModalOpen,
    walletConnectModalOpen,
    onWalletConnectModalOpenChange(open: boolean) {
      setWalletConnectModalOpen(open);
      if (!open) {
        setWalletPaymentRequested(false);
      }
    },
    paymentWalletError: formError ?? (directPaymentWalletModalOpen ? paymentWalletValidation : null),
    activePayment,
    paymentInstruction,
    isCreatingIntent: createPaymentIntent.isPending,
    isCheckingStatus,
    statusError,
  };
}

function buildPaymentInstructionSummary(
  intent: IPaymentIntentPublic,
  payment: IPaymentPublic | null,
  fallbackNetworkLabel: string,
): PaymentInstructionSummary {
  const copy = getPaymentStatusCopy(intent.status);
  const paymentUri = intent.instructions.paymentUri;
  return {
    status: intent.status,
    statusTitle: copy.title,
    statusDescription: copy.description,
    statusTone: copy.tone,
    exactAmountDisplay: formatPaymentAmount(intent.instructions.expectedAmountBaseUnits, intent.asset),
    receiverAddress: intent.instructions.receiverAddress,
    networkLabel: getChainLabel(intent.chain) ?? fallbackNetworkLabel,
    expiresAtDisplay: formatDateTime(intent.expiresAt),
    paymentUri,
    qrValue: paymentUri ?? intent.instructions.receiverAddress,
    txHash: payment?.txHash ?? null,
  };
}

function getExplorerUrl(chain: IPaymentPublic['chain'], txHash: string) {
  switch (chain) {
    case PAYMENT_CHAINS.ETHEREUM:
      return `https://etherscan.io/tx/${txHash}`;
    case PAYMENT_CHAINS.SOLANA:
      return `https://solscan.io/tx/${txHash}`;
    case PAYMENT_CHAINS.BITCOIN:
      return `https://mempool.space/tx/${txHash}`;
  }
}
