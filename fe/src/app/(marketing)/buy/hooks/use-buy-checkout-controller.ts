'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import type { BuySnapshot } from '@/components/flowdex/buy-page-types';
import { buildBuyMarketModel } from '@/components/flowdex/buy-page-market';
import { formatCompact, formatCurrency, formatDateTime, formatPlainNumber } from '@/components/flowdex/utils';
import { paymentsQueryKeys, paymentsService, useCreatePaymentIntent } from '@/dal/app/payments/payments.services';
import { PAYMENT_CHAINS, PAYMENT_TERMINAL_STATUSES } from '@/dal/app/payments/payments.types';
import { usePricing } from '@/dal/market/pricing/pricing.services';
import { usePresaleConfig, usePresaleStats, usePresaleTiers } from '@/dal/market/presale/presale.services';
import { extractAxiosError } from '@/lib/axios';
import type { ActivePaymentView, PaymentInstructionSummary } from '../types/buy-view-model';
import {
  formatCompactCurrency,
  formatPaymentAmount,
  formatTokenAmount,
  getChainLabel,
  getPaymentStatusCopy,
  normalizeOptionalAddress,
  validateSenderAddress,
} from '../utils/buy-display';
import { readStoredActivePayment, writeStoredActivePayment } from '../utils/buy-payment-storage';
import { buildSupportedAssetOptions } from '../utils/supported-asset-options';

const DEFAULT_BUY_AMOUNT = '1.7544';
const PAYMENT_STATUS_POLL_INTERVAL_MS = 12_000;
const PAYMENT_STATUS_RATE_LIMIT_BACKOFF_MS = 30_000;

export function useBuyCheckoutController() {
  const pricing = usePricing();
  const presaleStats = usePresaleStats();
  const presaleTiers = usePresaleTiers();
  const presaleConfig = usePresaleConfig();
  const snapshot: BuySnapshot = pricing.data && presaleStats.data && presaleTiers.data && presaleConfig.data
    ? {
        pricing: pricing.data,
        presaleStats: presaleStats.data,
        presaleTiers: presaleTiers.data,
        presaleConfig: presaleConfig.data,
      }
    : null;
  const marketModel = buildBuyMarketModel(snapshot);
  const supportedAssets = useMemo(() => buildSupportedAssetOptions(snapshot), [snapshot]);
  const queryClient = useQueryClient();
  const createPaymentIntent = useCreatePaymentIntent();

  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [amountDisplay, setAmountDisplay] = useState(DEFAULT_BUY_AMOUNT);
  const [activePayment, setActivePayment] = useState<ActivePaymentView | null>(null);
  const [paymentWalletAddress, setPaymentWalletAddress] = useState('');
  const [paymentWalletModalOpen, setPaymentWalletModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusBackoffUntil, setStatusBackoffUntil] = useState(0);

  useEffect(() => {
    if (!selectedAssetId && supportedAssets[0]) {
      setSelectedAssetId(supportedAssets[0].id);
    }
  }, [selectedAssetId, supportedAssets]);

  useEffect(() => {
    setActivePayment(readStoredActivePayment());
  }, []);

  useEffect(() => {
    writeStoredActivePayment(activePayment);
  }, [activePayment]);

  const selectedAsset = supportedAssets.find(asset => asset.id === selectedAssetId) ?? supportedAssets[0] ?? null;
  const assetAmount = Number(amountDisplay);
  const contributionUsd = selectedAsset && Number.isFinite(assetAmount) ? assetAmount * selectedAsset.usdPrice : 0;
  const tokenAmount = marketModel.tokenPriceUsd > 0 ? contributionUsd / marketModel.tokenPriceUsd : 0;
  const tokenAmountInput = formatTokenAmount(tokenAmount);
  const listingValue = tokenAmount * marketModel.listingReferenceUsd;
  const roiPercent = contributionUsd > 0 ? ((listingValue - contributionUsd) / contributionUsd) * 100 : 0;
  const remainingTokens = Math.max(0, marketModel.remainingRaiseUsd / Math.max(marketModel.tokenPriceUsd, 0.000001));
  const validationError = selectedAsset ? validateSenderAddress(selectedAsset.chain, paymentWalletAddress) : null;
  const canSubmit = Boolean(selectedAsset && !activePayment && !createPaymentIntent.isPending && contributionUsd > 0 && tokenAmountInput);
  const selectedChainLabel = selectedAsset ? getChainLabel(selectedAsset.chain) : 'Ethereum';

  async function refreshStatus(intentId: string) {
    if (Date.now() < statusBackoffUntil) {
      return;
    }

    setIsCheckingStatus(true);
    try {
      const result = await paymentsService.getPaymentIntentStatus(intentId);
      setActivePayment({ intent: result.intent, payment: result.payment });
      setStatusError(null);
      await queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.history(result.intent.senderAddress) });
    } catch (error) {
      const details = extractAxiosError(error);
      if (details.status === 429) {
        setStatusBackoffUntil(Date.now() + PAYMENT_STATUS_RATE_LIMIT_BACKOFF_MS);
        setStatusError('Payment status is updating slowly. Checking again shortly.');
      } else {
        setStatusError(details.message || 'Could not refresh payment status. Retrying shortly.');
      }
    } finally {
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
  }, [activePayment?.intent.id, activePayment?.intent.status, statusBackoffUntil]);

  async function buy() {
    if (!selectedAsset || !canSubmit) {
      return;
    }

    const senderValidation = validateSenderAddress(selectedAsset.chain, paymentWalletAddress);
    if (selectedAsset.chain === PAYMENT_CHAINS.ETHEREUM && senderValidation) {
      setFormError(senderValidation);
      setPaymentWalletModalOpen(true);
      return;
    }

    setFormError(null);
    try {
      const intent = await createPaymentIntent.mutateAsync({
        chain: selectedAsset.chain,
        asset: selectedAsset.code,
        tokenAmount: tokenAmountInput,
        senderAddress: normalizeOptionalAddress(paymentWalletAddress),
      });
      setActivePayment({ intent, payment: null });
      setPaymentWalletModalOpen(false);
    } catch (error) {
      const details = extractAxiosError(error);
      setFormError(details.message || 'Could not start this payment.');
    }
  }

  const paymentInstruction = activePayment
    ? buildPaymentInstructionSummary(activePayment, selectedChainLabel)
    : null;

  return {
    market: {
      currentTier: marketModel.currentTier,
      raisedDisplay: formatCurrency(marketModel.fundsRaisedUsd, 0),
      targetRaisedDisplay: marketModel.targetRaisedUsd > 0 ? formatCompactCurrency(marketModel.targetRaisedUsd) : '$5.00M',
      tokensSoldDisplay: `${formatCompact(marketModel.tokensSold, 2)} FDN`,
      remainingTokensDisplay: formatCompact(remainingTokens, 2),
      tokenPriceDisplay: formatCurrency(marketModel.tokenPriceUsd, 4),
      discountPercentDisplay: `-${marketModel.discountPercent}%`,
      nextTierPriceDisplay: marketModel.nextTierTokenPriceUsd ? formatCurrency(marketModel.nextTierTokenPriceUsd, 4) : formatCurrency(marketModel.listingReferenceUsd, 3),
      raisedProgressPercent: marketModel.raisedProgressPercent,
    },
    order: {
      selectedAsset,
      supportedAssets,
      amountDisplay,
      payDisplay: selectedAsset ? `${amountDisplay || '0'} ${selectedAsset.code}` : '0',
      receiveDisplay: `${formatPlainNumber(tokenAmount, 0)} $FDN`,
      listingValueDisplay: formatCurrency(listingValue, 0),
      roiDisplay: contributionUsd > 0 ? `+${formatPlainNumber(roiPercent, 0)}%` : '+0%',
      buyButtonLabel: `Buy ${formatPlainNumber(tokenAmount, 0)} $FDN`,
      error: formError,
      canSubmit,
      scenarios: buildScenarioCards(tokenAmount, contributionUsd, marketModel.listingReferenceUsd),
    },
    payment: {
      instruction: paymentInstruction,
      isCreating: createPaymentIntent.isPending,
      isCheckingStatus,
      statusError,
    },
    wallet: {
      paymentWalletAddress,
      paymentWalletModalOpen,
      paymentWalletError: formError ?? (paymentWalletModalOpen ? validationError : null),
    },
    actions: {
      selectAsset(assetId: string) {
        setSelectedAssetId(assetId);
        setFormError(null);
      },
      changeAmount(value: string) {
        setAmountDisplay(value.replace(/[^\d.]/gu, ''));
        setFormError(null);
      },
      buy,
      startNewPayment() {
        setActivePayment(null);
        setStatusError(null);
        setFormError(null);
        writeStoredActivePayment(null);
      },
      setPaymentWalletAddress(value: string) {
        setPaymentWalletAddress(value);
        setFormError(null);
      },
      setPaymentWalletModalOpen,
    },
  };
}

function buildPaymentInstructionSummary(
  activePayment: ActivePaymentView,
  fallbackNetworkLabel: string,
): PaymentInstructionSummary {
  const { intent } = activePayment;
  const [statusTitle, statusDescription] = getPaymentStatusCopy(intent.status);
  const paymentUri = intent.instructions.paymentUri;

  return {
    status: intent.status,
    statusTitle,
    statusDescription,
    exactAmountDisplay: formatPaymentAmount(intent.instructions.expectedAmountBaseUnits, intent.asset),
    receiverAddress: intent.instructions.receiverAddress,
    networkLabel: getChainLabel(intent.chain) ?? fallbackNetworkLabel,
    expiresAtDisplay: formatDateTime(intent.expiresAt),
    paymentUri,
    qrValue: paymentUri ?? intent.instructions.receiverAddress,
  };
}

function buildScenarioCards(tokenAmount: number, contributionUsd: number, listingReferenceUsd: number) {
  const scenarios = [
    { label: 'Listing', multiple: 1, cap: '$500M MCAP' },
    { label: '5x', multiple: 5, cap: '$2.5B MCAP' },
    { label: '10x', multiple: 10, cap: '$5B MCAP' },
    { label: '50x', multiple: 50, cap: '$25B MCAP' },
  ];

  return scenarios.map((scenario) => {
    const price = listingReferenceUsd * scenario.multiple;
    const value = tokenAmount * price;
    const roi = contributionUsd > 0 ? ((value - contributionUsd) / contributionUsd) * 100 : 0;
    return {
      label: scenario.label,
      price: `${formatCurrency(price, 2)} / FDN`,
      cap: scenario.cap,
      value: formatCompactCurrency(value),
      roi: `+${formatPlainNumber(roi, 0)}%`,
    };
  });
}
