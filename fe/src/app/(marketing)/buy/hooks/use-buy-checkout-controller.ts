'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { BuySnapshot } from '@/components/flowdex/buy-page-types';
import { buildBuyMarketModel } from '@/components/flowdex/buy-page-market';
import { formatCompact, formatCurrency, formatDateTime, formatPlainNumber } from '@/components/flowdex/utils';
import {
  paymentsQueryKeys,
  paymentsService,
  useCreatePaymentIntent,
  usePreparePaymentWalletAction,
  useSubmitPaymentIntentTxResult,
} from '@/dal/app/payments/payments.services';
import { PAYMENT_CHAINS, PAYMENT_TERMINAL_STATUSES } from '@/dal/app/payments/payments.types';
import { useMarketingWalletStore } from '@/hooks/use-marketing-wallet-store';
import { useMarketingWalletSync } from '@/hooks/use-marketing-wallet-sync';
import { usePricing } from '@/dal/market/pricing/pricing.services';
import { usePresaleConfig, usePresaleStats, usePresaleTiers } from '@/dal/market/presale/presale.services';
import { extractAxiosError } from '@/lib/axios';
import type { ActivePaymentView, BuyCheckoutStage, PaymentInstructionSummary } from '../types/buy-view-model';
import type { WalletTxResult } from '../types/checkout-wallet.types';
import {
  formatCompactCurrency,
  formatPaymentAmount,
  formatTokenAmount,
  getChainLabel,
  getPaymentStatusCopy,
  normalizeWalletAddress,
  normalizeOptionalAddress,
  validateSenderAddress,
} from '../utils/buy-display';
import { readStoredActivePayment, writeStoredActivePayment } from '../utils/buy-payment-storage';
import { getInitialCheckoutStage } from '../utils/buy-checkout-flow';
import { describeBuyExecutionReadinessBlock, getBuyExecutionReadiness } from '../utils/get-buy-execution-readiness';
import { getCheckoutErrorMessage, toCheckoutStepError } from '../utils/get-checkout-error-message';
import { buildSupportedAssetOptions } from '../utils/supported-asset-options';
import { createEvmCheckoutWalletAdapter } from '../wallet-adapters/checkout-wallet-adapter';
import {
  createSolanaMetaMaskCheckoutWalletAdapter,
  initialSolanaCheckoutWalletAdapterState,
} from '../wallet-adapters/solana-metamask-checkout-wallet-adapter';
import {
  createTronLinkCheckoutWalletAdapter,
  initialTronCheckoutWalletAdapterState,
  isTronLinkAvailable,
} from '../wallet-adapters/tronlink-checkout-wallet-adapter';
import { TRON_MAINNET_WALLET_CHAIN_ID } from '../constants/tronlink';
import type { IPreparedWalletAction } from '@/dal/app/payments/payments.types';
import type { PreparedWalletAction, TronPreparedWalletAction } from '../types/checkout-wallet.types';

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
  const prepareWalletAction = usePreparePaymentWalletAction();
  const submitPaymentIntentTxResult = useSubmitPaymentIntentTxResult();
  const marketingWallet = useMarketingWalletSync();
  const walletProvider = useMarketingWalletStore(state => state.provider);
  const walletVerification = useMarketingWalletStore(state => state.verification);
  const setProviderExecutionState = useMarketingWalletStore(state => state.setProviderExecutionState);

  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [amountDisplay, setAmountDisplay] = useState(DEFAULT_BUY_AMOUNT);
  const [activePayment, setActivePayment] = useState<ActivePaymentView | null>(null);
  const [paymentWalletAddress, setPaymentWalletAddress] = useState('');
  const [checkoutStage, setCheckoutStage] = useState<BuyCheckoutStage>('closed');
  const [formError, setFormError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusBackoffUntil, setStatusBackoffUntil] = useState(0);
  const [walletTxResult, setWalletTxResult] = useState<WalletTxResult | null>(null);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [solanaWalletState, setSolanaWalletState] = useState(initialSolanaCheckoutWalletAdapterState);
  const [tronWalletState, setTronWalletState] = useState(initialTronCheckoutWalletAdapterState);
  const solanaWalletStateRef = useRef(solanaWalletState);
  const tronWalletStateRef = useRef(tronWalletState);
  const autoSwitchAttemptedChainIdRef = useRef<number | null>(null);
  const autoSwitchAttemptedWalletChainIdRef = useRef<string | null>(null);

  useEffect(() => {
    solanaWalletStateRef.current = solanaWalletState;
  }, [solanaWalletState]);

  useEffect(() => {
    tronWalletStateRef.current = tronWalletState;
  }, [tronWalletState]);

  const solanaWalletAdapter = useMemo(() => createSolanaMetaMaskCheckoutWalletAdapter({
    getState: () => solanaWalletStateRef.current,
    setState: (state) => {
      solanaWalletStateRef.current = state;
      setSolanaWalletState(state);
    },
  }), []);

  const tronWalletAdapter = useMemo(() => createTronLinkCheckoutWalletAdapter({
    getState: () => tronWalletStateRef.current,
    setState: (state) => {
      tronWalletStateRef.current = state;
      setTronWalletState(state);
    },
  }), []);

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
  const canSubmit = Boolean(selectedAsset && !createPaymentIntent.isPending && contributionUsd > 0 && tokenAmountInput);
  const selectedChainLabel = selectedAsset ? getChainLabel(selectedAsset.chain) : 'Ethereum';
  const canUseWalletCheckout = Boolean(
    selectedAsset?.walletCheckoutEnabled
    && (
      selectedAsset.chain === PAYMENT_CHAINS.SOLANA
      || Boolean(selectedAsset.chainId)
      || Boolean(selectedAsset.walletChainId)
    ),
  );
  const requiredChainId = selectedAsset?.chain === PAYMENT_CHAINS.ETHEREUM
    ? selectedAsset.chainId
    : null;
  const requiredWalletChainId = selectedAsset?.chain === PAYMENT_CHAINS.TRON
    ? selectedAsset.walletChainId
    : selectedAsset?.chain === PAYMENT_CHAINS.SOLANA
      ? selectedAsset.walletChainId
      : null;
  const isWrongNetwork = Boolean(
    (requiredChainId
      && walletProvider.address
      && walletProvider.chainId !== requiredChainId)
    || (requiredWalletChainId
      && selectedAsset?.chain === PAYMENT_CHAINS.TRON
      && tronWalletState.address
      && tronWalletState.walletChainId !== requiredWalletChainId),
  );

  async function requestNetworkSwitch() {
    if (selectedAsset?.chain === PAYMENT_CHAINS.TRON) {
      if (!requiredWalletChainId || !isWrongNetwork) {
        return;
      }

      setIsSwitchingNetwork(true);
      setFormError(null);
      try {
        await tronWalletAdapter.switchNetwork?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not switch TronLink to Tron Mainnet.';
        setFormError(message);
        toast.error('Could not switch network', { description: message });
      } finally {
        setIsSwitchingNetwork(false);
      }
      return;
    }

    if (!requiredChainId || !isWrongNetwork) {
      return;
    }

    setIsSwitchingNetwork(true);
    setFormError(null);
    try {
      const result = await marketingWallet.switchToChain(requiredChainId);
      if (!result.ok) {
        setFormError(result.message);
        if (result.code !== 'user_rejected') {
          toast.error('Could not switch network', { description: result.message });
        }
      }
    } finally {
      setIsSwitchingNetwork(false);
    }
  }

  useEffect(() => {
    if (selectedAsset?.chain !== PAYMENT_CHAINS.TRON || !tronWalletState.address || !requiredWalletChainId) {
      autoSwitchAttemptedWalletChainIdRef.current = null;
      return;
    }

    if (tronWalletState.walletChainId === requiredWalletChainId) {
      autoSwitchAttemptedWalletChainIdRef.current = null;
      return;
    }

    if (autoSwitchAttemptedWalletChainIdRef.current === requiredWalletChainId || isSwitchingNetwork) {
      return;
    }

    autoSwitchAttemptedWalletChainIdRef.current = requiredWalletChainId;
    void requestNetworkSwitch();
  }, [
    isSwitchingNetwork,
    requiredWalletChainId,
    selectedAsset?.chain,
    tronWalletState.address,
    tronWalletState.walletChainId,
  ]);

  useEffect(() => {
    if (!walletProvider.address || !requiredChainId) {
      autoSwitchAttemptedChainIdRef.current = null;
      return;
    }

    if (walletProvider.chainId === requiredChainId) {
      autoSwitchAttemptedChainIdRef.current = null;
      return;
    }

    if (autoSwitchAttemptedChainIdRef.current === requiredChainId || isSwitchingNetwork) {
      return;
    }

    autoSwitchAttemptedChainIdRef.current = requiredChainId;
    void requestNetworkSwitch();
  }, [
    isSwitchingNetwork,
    requiredChainId,
    walletProvider.address,
    walletProvider.chainId,
  ]);

  useEffect(() => {
    let canceled = false;

    async function syncExecutionReadiness() {
      if (selectedAsset?.chain !== PAYMENT_CHAINS.ETHEREUM) {
        setProviderExecutionState({
          executionReadiness: 'checking',
          unsupportedReason: null,
        });
        return;
      }

      if (!walletProvider.address || !selectedAsset.chainId) {
        setProviderExecutionState({
          executionReadiness: 'checking',
          unsupportedReason: null,
        });
        return;
      }

      const readiness = await getBuyExecutionReadiness({
        asset: selectedAsset.code,
        chain: selectedAsset.chain,
        selectedCheckoutMode: 'wallet',
        providerAccount: marketingWallet.providerAccount,
        requiredChainId: selectedAsset.chainId,
      });

      if (canceled) {
        return;
      }

      setProviderExecutionState({
        executionReadiness: readiness.status === 'ready'
          ? 'ready'
          : readiness.status === 'checking' || readiness.status === 'wallet_not_connected'
            ? 'checking'
            : 'unsupported',
        unsupportedReason: readiness.status === 'wrong_chain'
          ? 'wrong_chain'
          : 'reason' in readiness
            ? readiness.reason
            : null,
        walletConnectTopic: walletProvider.walletConnectTopic,
      });
    }

    void syncExecutionReadiness();

    return () => {
      canceled = true;
    };
  }, [
    marketingWallet.providerAccount,
    selectedAsset?.chainId,
    selectedAsset?.chain,
    selectedAsset?.code,
    setProviderExecutionState,
    walletProvider.address,
    walletProvider.walletConnectTopic,
  ]);

  const selectedWalletAddress = selectedAsset?.chain === PAYMENT_CHAINS.SOLANA
    ? solanaWalletState.address
    : selectedAsset?.chain === PAYMENT_CHAINS.TRON
      ? tronWalletState.address
      : walletProvider.address;

  useEffect(() => {
    if ((checkoutStage === 'choose_method' || checkoutStage === 'connecting_wallet') && selectedWalletAddress) {
      setCheckoutStage('wallet_ready');
    }

    if (
      (
        checkoutStage === 'wallet_ready'
        || checkoutStage === 'verifying_wallet'
        || checkoutStage === 'preparing_wallet_action'
        || checkoutStage === 'waiting_for_wallet_approval'
        || checkoutStage === 'submitting_tx_result'
      )
      && !selectedWalletAddress
    ) {
      setCheckoutStage(getInitialCheckoutStage({
        hasActivePayment: false,
        canUseWalletCheckout,
      }));
    }
  }, [canUseWalletCheckout, checkoutStage, selectedWalletAddress]);

  async function refreshStatus(intentId: string) {
    if (Date.now() < statusBackoffUntil) {
      return;
    }

    setIsCheckingStatus(true);
    try {
      const result = await paymentsService.getPaymentIntentStatus(intentId);
      setActivePayment({ intent: result.intent, payment: result.payment });
      setStatusError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.history(result.intent.senderAddress) }),
        queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.portfolio(result.intent.senderAddress) }),
      ]);
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

  function openCheckout() {
    if (!selectedAsset || !canSubmit) {
      return;
    }

    setFormError(null);
    if (activePayment) {
      setCheckoutStage('direct_instructions');
      return;
    }

    setCheckoutStage(getInitialCheckoutStage({
      hasActivePayment: Boolean(activePayment),
      canUseWalletCheckout,
    }));
  }

  function closeCheckout() {
    setCheckoutStage('closed');
    setFormError(null);
  }

  function useDirectSend() {
    const address = selectedAsset?.chain === PAYMENT_CHAINS.SOLANA
      ? solanaWalletState.address
      : selectedAsset?.chain === PAYMENT_CHAINS.TRON
        ? tronWalletState.address
        : walletProvider.address;
    if (address && !paymentWalletAddress.trim()) {
      setPaymentWalletAddress(address);
    }
    setFormError(null);
    setCheckoutStage(getInitialCheckoutStage({
      hasActivePayment: Boolean(activePayment),
      canUseWalletCheckout: false,
    }));
  }

  async function createDirectPayment() {
    if (!selectedAsset || !canSubmit) {
      return;
    }

    if (!paymentWalletAddress.trim()) {
      setFormError('Enter the wallet address you will pay from.');
      setCheckoutStage('direct_address');
      return;
    }

    const senderValidation = validateSenderAddress(selectedAsset.chain, paymentWalletAddress);
    if (senderValidation) {
      setFormError(senderValidation);
      setCheckoutStage('direct_address');
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
      setCheckoutStage('direct_instructions');
    } catch (error) {
      const details = extractAxiosError(error);
      setFormError(details.message || 'Could not start this payment.');
      setCheckoutStage('failed');
    }
  }

  async function verifyConnectedWallet() {
    if (selectedAsset?.chain === PAYMENT_CHAINS.TRON) {
      setFormError(null);
      setCheckoutStage('verifying_wallet');
      try {
        if (!tronWalletStateRef.current.address) {
          await tronWalletAdapter.connect();
        }
        await tronWalletAdapter.verify?.();
        setCheckoutStage('wallet_ready');
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Could not verify TronLink wallet.');
        setCheckoutStage('failed');
      }
      return;
    }

    if (selectedAsset?.chain === PAYMENT_CHAINS.SOLANA) {
      setFormError(null);
      setCheckoutStage('verifying_wallet');
      try {
        if (!solanaWalletStateRef.current.address) {
          await solanaWalletAdapter.connect();
        }
        await solanaWalletAdapter.verify?.();
        setCheckoutStage('wallet_ready');
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Could not verify Solana wallet.');
        setCheckoutStage('failed');
      }
      return;
    }

    if (!selectedAsset?.walletCheckoutEnabled || (!selectedAsset.chainId && !selectedAsset.walletChainId)) {
      useDirectSend();
      return;
    }

    if (!walletProvider.address) {
      setFormError('Connect a wallet before continuing.');
      setCheckoutStage('choose_method');
      return;
    }

    setFormError(null);
    setCheckoutStage('verifying_wallet');
    await marketingWallet.verifyWallet({ chainId: selectedAsset.chainId });
    const nextVerification = useMarketingWalletStore.getState().verification;
    setCheckoutStage(nextVerification.status === 'verified' ? 'wallet_ready' : 'failed');
  }

  async function submitSolanaWalletPayment() {
    if (!selectedAsset || selectedAsset.chain !== PAYMENT_CHAINS.SOLANA) {
      useDirectSend();
      return;
    }

    setFormError(null);
    setWalletTxResult(null);

    try {
      if (!solanaWalletStateRef.current.address) {
        setCheckoutStage('connecting_wallet');
        await solanaWalletAdapter.connect();
      }

      if (!solanaWalletStateRef.current.isVerified) {
        setCheckoutStage('verifying_wallet');
        await solanaWalletAdapter.verify?.();
      }

      const solanaAddress = solanaWalletStateRef.current.address;
      const walletChainId = solanaWalletStateRef.current.walletChainId;
      if (!solanaAddress || !walletChainId) {
        throw new Error('Connect MetaMask Solana before continuing.');
      }

      setCheckoutStage('preparing_wallet_action');
      const intent = await createPaymentIntent.mutateAsync({
        chain: selectedAsset.chain,
        asset: selectedAsset.code,
        tokenAmount: tokenAmountInput,
        senderAddress: solanaAddress,
      }).catch(error => {
        throw toCheckoutStepError('create_intent', PAYMENT_CHAINS.SOLANA, error);
      });
      setActivePayment({ intent, payment: null });

      let preparedWalletAction = await prepareWalletAction.mutateAsync({
        intentId: intent.id,
        payload: {
          chain: PAYMENT_CHAINS.SOLANA,
          senderAddress: solanaAddress,
          walletChainId,
        },
      }).catch(error => {
        throw toCheckoutStepError('prepare_wallet_action', PAYMENT_CHAINS.SOLANA, error);
      });

      setCheckoutStage('waiting_for_wallet_approval');
      let nextWalletTxResult: WalletTxResult;
      try {
        nextWalletTxResult = await solanaWalletAdapter.sendPreparedAction(preparedWalletAction);
      } catch (error) {
        if (error instanceof Error && error.message === 'Prepared Solana transaction expired') {
          setFormError('Your Solana transaction expired before approval. Preparing a fresh transaction...');
          setCheckoutStage('preparing_wallet_action');
          preparedWalletAction = await prepareWalletAction.mutateAsync({
            intentId: intent.id,
            payload: {
              chain: PAYMENT_CHAINS.SOLANA,
              senderAddress: solanaAddress,
              walletChainId,
            },
          }).catch(nextError => {
            throw toCheckoutStepError('prepare_wallet_action', PAYMENT_CHAINS.SOLANA, nextError);
          });
          setCheckoutStage('waiting_for_wallet_approval');
          nextWalletTxResult = await solanaWalletAdapter.sendPreparedAction(preparedWalletAction).catch(nextError => {
            throw toCheckoutStepError('wallet_approval', PAYMENT_CHAINS.SOLANA, nextError);
          });
        } else {
          throw toCheckoutStepError('wallet_approval', PAYMENT_CHAINS.SOLANA, error);
        }
      }

      if (nextWalletTxResult.chain !== PAYMENT_CHAINS.SOLANA) {
        throw new Error('Unsupported wallet transaction result for this checkout.');
      }
      setWalletTxResult(nextWalletTxResult);

      setCheckoutStage('submitting_tx_result');
      const status = await submitPaymentIntentTxResult.mutateAsync({
        intentId: intent.id,
        payload: {
          chain: nextWalletTxResult.chain,
          preparedActionId: nextWalletTxResult.preparedActionId,
          txIdKind: nextWalletTxResult.txIdKind,
          txId: nextWalletTxResult.txId,
        },
      }).catch(error => {
        throw toCheckoutStepError('submit_tx_result', PAYMENT_CHAINS.SOLANA, error);
      });
      setActivePayment({ intent: status.intent, payment: status.payment });
      setCheckoutStage('tracking');
    } catch (error) {
      const errorView = getCheckoutErrorMessage(error);

      setFormError(errorView.message);
      setCheckoutStage('failed');
      if (errorView.variant === 'warning') {
        toast.warning(errorView.title, { description: errorView.message });
      } else {
        toast.error(errorView.title, { description: errorView.message });
      }
    }
  }

  async function submitTronWalletPayment() {
    if (!selectedAsset || selectedAsset.chain !== PAYMENT_CHAINS.TRON) {
      useDirectSend();
      return;
    }

    setFormError(null);
    setWalletTxResult(null);

    try {
      if (!tronWalletStateRef.current.address) {
        setCheckoutStage('connecting_wallet');
        await tronWalletAdapter.connect();
      }

      if (!tronWalletStateRef.current.isVerified) {
        setCheckoutStage('verifying_wallet');
        await tronWalletAdapter.verify?.();
      }

      const tronAddress = tronWalletStateRef.current.address;
      const walletChainId = tronWalletStateRef.current.walletChainId;
      if (!tronAddress || !walletChainId) {
        throw new Error('Connect TronLink before continuing.');
      }

      if (walletChainId !== TRON_MAINNET_WALLET_CHAIN_ID) {
        throw new Error('Switch TronLink to Tron Mainnet before continuing.');
      }

      setCheckoutStage('preparing_wallet_action');
      const intent = await createPaymentIntent.mutateAsync({
        chain: selectedAsset.chain,
        asset: selectedAsset.code,
        tokenAmount: tokenAmountInput,
        senderAddress: tronAddress,
      }).catch(error => {
        throw toCheckoutStepError('create_intent', PAYMENT_CHAINS.TRON, error);
      });
      setActivePayment({ intent, payment: null });

      const preparedWalletAction = await prepareWalletAction.mutateAsync({
        intentId: intent.id,
        payload: {
          chain: PAYMENT_CHAINS.TRON,
          senderAddress: tronAddress,
          walletChainId,
        },
      }).catch(error => {
        throw toCheckoutStepError('prepare_wallet_action', PAYMENT_CHAINS.TRON, error);
      });

      setCheckoutStage('waiting_for_wallet_approval');
      const nextWalletTxResult = await tronWalletAdapter.sendPreparedAction(
        mapTronPreparedWalletAction(preparedWalletAction),
      ).catch(error => {
        throw toCheckoutStepError('wallet_approval', PAYMENT_CHAINS.TRON, error);
      });

      if (nextWalletTxResult.chain !== PAYMENT_CHAINS.TRON) {
        throw new Error('Unsupported wallet transaction result for this checkout.');
      }
      setWalletTxResult(nextWalletTxResult);

      setCheckoutStage('submitting_tx_result');
      const status = await submitPaymentIntentTxResult.mutateAsync({
        intentId: intent.id,
        payload: {
          chain: nextWalletTxResult.chain,
          preparedActionId: nextWalletTxResult.preparedActionId,
          txIdKind: nextWalletTxResult.txIdKind,
          txId: nextWalletTxResult.txId,
        },
      }).catch(error => {
        throw toCheckoutStepError('submit_tx_result', PAYMENT_CHAINS.TRON, error);
      });
      setActivePayment({ intent: status.intent, payment: status.payment });
      setCheckoutStage('tracking');
    } catch (error) {
      const errorView = getCheckoutErrorMessage(error);

      setFormError(errorView.message);
      setCheckoutStage('failed');
      if (errorView.variant === 'warning') {
        toast.warning(errorView.title, { description: errorView.message });
      } else {
        toast.error(errorView.title, { description: errorView.message });
      }
    }
  }

  async function submitWalletPayment() {
    if (selectedAsset?.chain === PAYMENT_CHAINS.TRON) {
      await submitTronWalletPayment();
      return;
    }

    if (selectedAsset?.chain === PAYMENT_CHAINS.SOLANA) {
      await submitSolanaWalletPayment();
      return;
    }

    if (!selectedAsset?.walletCheckoutEnabled || (!selectedAsset.chainId && !selectedAsset.walletChainId)) {
      useDirectSend();
      return;
    }

    if (!walletProvider.address || !marketingWallet.providerAccount.connector) {
      setFormError('Connect a wallet before continuing.');
      setCheckoutStage('choose_method');
      return;
    }

    const requiredChainId = selectedAsset.chainId;
    setFormError(null);
    setWalletTxResult(null);

    try {
      let verifiedWalletAddress = walletVerification.status === 'verified'
        ? walletVerification.walletAddress
        : null;

      if (!verifiedWalletAddress || normalizeWalletAddress(verifiedWalletAddress) !== normalizeWalletAddress(walletProvider.address)) {
        setCheckoutStage('verifying_wallet');
        await marketingWallet.verifyWallet({ chainId: selectedAsset.chainId });
        const nextVerification = useMarketingWalletStore.getState().verification;
        verifiedWalletAddress = nextVerification.status === 'verified'
          ? nextVerification.walletAddress
          : null;
      }

      if (!verifiedWalletAddress) {
        throw new Error(useMarketingWalletStore.getState().verification.error || 'Could not verify this wallet.');
      }

      const readiness = await getBuyExecutionReadiness({
        asset: selectedAsset.code,
        chain: selectedAsset.chain,
        selectedCheckoutMode: 'wallet',
        providerAccount: marketingWallet.providerAccount,
        requiredChainId: selectedAsset.chainId,
      });

      if (readiness.status !== 'ready') {
        throw new Error(describeBuyExecutionReadinessBlock(readiness));
      }

      setCheckoutStage('preparing_wallet_action');
      const intent = await createPaymentIntent.mutateAsync({
        chain: selectedAsset.chain,
        asset: selectedAsset.code,
        tokenAmount: tokenAmountInput,
        senderAddress: normalizeOptionalAddress(verifiedWalletAddress),
      });
      setActivePayment({ intent, payment: null });

      const preparedWalletAction = await prepareWalletAction.mutateAsync({
        intentId: intent.id,
        payload: {
          chain: PAYMENT_CHAINS.ETHEREUM,
          senderAddress: verifiedWalletAddress,
          walletChainId: walletProvider.chainId ?? selectedAsset.chainId,
        },
      });

      const walletAdapter = createEvmCheckoutWalletAdapter({
        status: {
          chain: 'ETHEREUM',
          address: walletProvider.address,
          chainId: walletProvider.chainId ?? selectedAsset.chainId,
          connectorName: walletProvider.connectorName ?? 'Ethereum wallet',
          isConnected: Boolean(walletProvider.address),
          isVerified: Boolean(verifiedWalletAddress),
          isReady: readiness.status === 'ready',
        },
        connector: marketingWallet.providerAccount.connector,
        connectedAddress: walletProvider.address,
        verifiedWalletAddress,
        connect: () => {
          if (walletProvider.connectorName) {
            marketingWallet.connectByName(walletProvider.connectorName, { chainId: requiredChainId });
          }
        },
        disconnect: marketingWallet.disconnectWallet,
        verify: () => marketingWallet.verifyWallet({ chainId: requiredChainId }),
      });

      setCheckoutStage('waiting_for_wallet_approval');
      const nextWalletTxResult = await walletAdapter.sendPreparedAction(preparedWalletAction);
      if (nextWalletTxResult.chain !== PAYMENT_CHAINS.ETHEREUM) {
        throw new Error('Unsupported wallet transaction result for this checkout.');
      }
      setWalletTxResult(nextWalletTxResult);

      setCheckoutStage('submitting_tx_result');
      const status = await submitPaymentIntentTxResult.mutateAsync({
        intentId: intent.id,
        payload: {
          chain: nextWalletTxResult.chain,
          preparedActionId: nextWalletTxResult.preparedActionId,
          txIdKind: nextWalletTxResult.txIdKind,
          txId: nextWalletTxResult.txId,
        },
      });
      setActivePayment({ intent: status.intent, payment: status.payment });
      setCheckoutStage('tracking');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not complete wallet checkout.');
      setCheckoutStage('failed');
    }
  }

  const paymentInstruction = activePayment
    ? buildPaymentInstructionSummary(activePayment, selectedChainLabel)
    : null;

  return {
    market: {
      currentTier: marketModel.currentTier,
      tokenPriceUsd: marketModel.tokenPriceUsd,
      listingReferenceUsd: marketModel.listingReferenceUsd,
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
      buyButtonLabel: isWrongNetwork
        ? 'Switch Network'
        : `Buy ${formatPlainNumber(tokenAmount, 0)} $FDN`,
      isWrongNetwork,
      isSwitchingNetwork,
      error: formError,
      canSubmit,
      scenarios: buildScenarioCards(tokenAmount, contributionUsd, marketModel.listingReferenceUsd),
    },
    payment: {
      instruction: paymentInstruction,
      isCreating: createPaymentIntent.isPending || prepareWalletAction.isPending || submitPaymentIntentTxResult.isPending,
      isCheckingStatus,
      statusError,
      walletTxResult,
    },
    wallet: {
      checkoutStage,
      paymentWalletAddress,
      paymentWalletError: formError ?? (checkoutStage === 'direct_address' ? validationError : null),
      canUseWalletCheckout,
      isWrongNetwork,
      isSwitchingNetwork,
      walletStatus: selectedAsset?.chain === PAYMENT_CHAINS.TRON
        ? {
            providerStatus: tronWalletState.isConnected ? 'connected' as const : 'disconnected' as const,
            address: tronWalletState.address,
            chainId: null,
            walletChainId: tronWalletState.walletChainId,
            connectorName: tronWalletState.address ? 'tronlink' : null,
            pendingConnectorName: checkoutStage === 'connecting_wallet' ? 'tronlink' : null,
            availableConnectorNames: isTronLinkAvailable() ? ['tronlink'] : [],
            executionReadiness: tronWalletState.isReady ? 'ready' as const : 'checking' as const,
            unsupportedReason: isTronLinkAvailable() ? null : 'missing_provider',
            connectionErrorMessage: tronWalletState.error,
            verificationStatus: tronWalletState.isVerified ? 'verified' as const : 'unverified' as const,
            verifiedWalletAddress: tronWalletState.isVerified ? tronWalletState.address : null,
            verificationError: tronWalletState.error,
            isDisconnecting: false,
            isVerifying: checkoutStage === 'verifying_wallet',
          }
        : selectedAsset?.chain === PAYMENT_CHAINS.SOLANA
        ? {
            providerStatus: solanaWalletState.isConnected ? 'connected' as const : 'disconnected' as const,
            address: solanaWalletState.address,
            chainId: null,
            walletChainId: solanaWalletState.walletChainId,
            connectorName: solanaWalletState.address ? 'metamask-solana' : null,
            pendingConnectorName: checkoutStage === 'connecting_wallet' ? 'metamask-solana' : null,
            availableConnectorNames: ['metamask-solana'],
            executionReadiness: solanaWalletState.isReady ? 'ready' as const : 'checking' as const,
            unsupportedReason: null,
            connectionErrorMessage: solanaWalletState.error,
            verificationStatus: solanaWalletState.isVerified ? 'verified' as const : 'unverified' as const,
            verifiedWalletAddress: solanaWalletState.isVerified ? solanaWalletState.address : null,
            verificationError: solanaWalletState.error,
            isDisconnecting: false,
            isVerifying: checkoutStage === 'verifying_wallet',
          }
        : {
            providerStatus: walletProvider.status,
            address: walletProvider.address,
            chainId: walletProvider.chainId,
            walletChainId: walletProvider.chainId ? String(walletProvider.chainId) : null,
            connectorName: walletProvider.connectorName,
            pendingConnectorName: walletProvider.pendingConnectorName,
            availableConnectorNames: walletProvider.availableConnectorNames,
            executionReadiness: walletProvider.executionReadiness,
            unsupportedReason: walletProvider.unsupportedReason,
            connectionErrorMessage: walletProvider.connectionErrorMessage,
            verificationStatus: walletVerification.status,
            verifiedWalletAddress: walletVerification.walletAddress,
            verificationError: walletVerification.error,
            isDisconnecting: marketingWallet.isDisconnecting,
            isVerifying: marketingWallet.isVerifying,
          },
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
      buy: openCheckout,
      closeCheckout,
      connectWallet(connectorName: string) {
        setFormError(null);
        setCheckoutStage('connecting_wallet');
        if (selectedAsset?.chain === PAYMENT_CHAINS.TRON) {
          void tronWalletAdapter.connect()
            .then(() => setCheckoutStage('wallet_ready'))
            .catch((error) => {
              setFormError(error instanceof Error ? error.message : 'Could not connect TronLink.');
              setCheckoutStage('failed');
            });
          return;
        }
        if (selectedAsset?.chain === PAYMENT_CHAINS.SOLANA) {
          void solanaWalletAdapter.connect()
            .then(() => setCheckoutStage('wallet_ready'))
            .catch((error) => {
              setFormError(error instanceof Error ? error.message : 'Could not connect MetaMask Solana.');
              setCheckoutStage('failed');
            });
          return;
        }
        marketingWallet.connectByName(connectorName, selectedAsset?.chainId ? { chainId: selectedAsset.chainId } : undefined);
      },
      disconnectWallet() {
        if (selectedAsset?.chain === PAYMENT_CHAINS.TRON) {
          void tronWalletAdapter.disconnect?.();
          return;
        }
        if (selectedAsset?.chain === PAYMENT_CHAINS.SOLANA) {
          void solanaWalletAdapter.disconnect?.();
          return;
        }
        void marketingWallet.disconnectWallet();
      },
      verifyWallet() {
        void verifyConnectedWallet();
      },
      startWalletPayment() {
        if (isWrongNetwork) {
          void requestNetworkSwitch();
          return;
        }
        void submitWalletPayment();
      },
      switchNetwork() {
        void requestNetworkSwitch();
      },
      useDirectSend,
      createDirectPayment() {
        void createDirectPayment();
      },
      startNewPayment() {
        setActivePayment(null);
        setStatusError(null);
        setFormError(null);
        setWalletTxResult(null);
        writeStoredActivePayment(null);
        setCheckoutStage(getInitialCheckoutStage({
          hasActivePayment: false,
          canUseWalletCheckout,
        }));
      },
      setPaymentWalletAddress(value: string) {
        setPaymentWalletAddress(value);
        setFormError(null);
      },
    },
  };
}

function mapTronPreparedWalletAction(action: IPreparedWalletAction): TronPreparedWalletAction {
  if (action.kind !== 'tron_transaction' || !('tron' in action)) {
    throw new Error('Unsupported TRON prepared wallet action.');
  }

  return {
    kind: 'tron_transaction',
    paymentIntentId: action.paymentIntentId,
    preparedActionId: action.preparedActionId,
    chain: 'TRON',
    walletChainId: action.walletChainId,
    walletNetworkId: 'tron:mainnet',
    contractAddress: action.tron.contractAddress,
    functionSelector: action.tron.functionSelector,
    recipientAddress: action.tron.recipientAddress,
    amountBaseUnits: action.tron.amountBaseUnits,
    feeLimitSun: action.tron.feeLimitSun,
    payerAddress: action.tron.payerAddress,
    payerAddressHex: action.tron.payerAddressHex,
    expiresAt: action.expiresAt,
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
    intentId: intent.id,
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
