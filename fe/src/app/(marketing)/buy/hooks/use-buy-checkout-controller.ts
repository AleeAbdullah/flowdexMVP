'use client';

import { useAuthModal } from '@account-kit/react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { toast } from 'sonner';
import { buildBuyMarketModel } from '@/components/flowdex/buy-page-market';
import { formatCompact, formatCurrency, formatDateTime, formatPlainNumber } from '@/components/flowdex/utils';
import {
  paymentsQueryKeys,
  paymentsService,
  useCreatePaymentIntent,
  usePaymentBuyConfig,
  usePreparePaymentWalletAction,
  useSubmitPaymentIntentTxResult,
} from '@/dal/app/payments/payments.services';
import {
  PAYMENT_CHAINS,
  PAYMENT_TERMINAL_STATUSES,
  type IPreparedBitcoinWalletAction,
  type IPreparedEvmWalletAction,
  type IPreparedSolanaWalletAction,
  type IPreparedWalletAction,
} from '@/dal/app/payments/payments.types';
import { useMarketingWalletStore, type MarketingWalletStore } from '@/hooks/use-marketing-wallet-store';
import { useMarketingWalletSync } from '@/hooks/use-marketing-wallet-sync';
import { extractAxiosError } from '@/lib/axios';
import {
  initialWalletCheckoutState,
  walletCheckoutReducer,
} from '../core/checkout-machine';
import type { ActivePaymentView, BuyCheckoutStage, PaymentInstructionSummary } from '../types/buy-view-model';
import type {
  BitcoinPreparedWalletAction,
  EvmPreparedWalletAction,
  SolanaPreparedWalletAction,
  TronPreparedWalletAction,
  WalletTxResult,
} from '../types/checkout-wallet.types';
import {
  formatCompactCurrency,
  formatPaymentAmount,
  formatTokenAmount,
  getChainLabel,
  getPaymentStatusCopy,
  normalizeWalletAddress,
} from '../utils/buy-display';
import {
  getCheckoutErrorMessage,
  isPostBroadcastCheckoutError,
  toCheckoutStepError,
} from '../utils/get-checkout-error-message';
import {
  readStoredActivePayment,
  readStoredWalletCheckoutRecovery,
  writeStoredActivePayment,
  writeStoredWalletCheckoutRecovery,
} from '../utils/buy-payment-storage';
import { buildSupportedAssetOptions } from '../utils/supported-asset-options';
import { getWalletConnectSessionCapabilities } from '../utils/walletconnect-session-capabilities';
import type { BuyWalletProvider, UnsupportedReason } from '../utils/buy-transaction.types';
import { createEvmCheckoutWalletAdapter } from '../wallet-adapters/checkout-wallet-adapter';
import { TRON_MAINNET_WALLET_CHAIN_ID } from '../constants/tron';
import { useReownCheckoutStore } from '../wallet-adapters/reown-checkout-store';
import {
  createSolanaMetaMaskCheckoutWalletAdapter,
  initialSolanaCheckoutWalletAdapterState,
} from '../wallet-adapters/solana-metamask-checkout-wallet-adapter';

const DEFAULT_BUY_AMOUNT = '1.7544';
const PAYMENT_STATUS_POLL_INTERVAL_MS = 12_000;
const PAYMENT_STATUS_RATE_LIMIT_BACKOFF_MS = 30_000;
const MAX_PAYMENT_STATUS_FAILURES = 3;

const evmCheckoutUnsupportedMessages: Record<UnsupportedReason, string> = {
  missing_provider: 'A compatible wallet provider is not available for checkout.',
  unsupported_injected_provider: 'This injected wallet cannot send this checkout transaction.',
  unsupported_walletconnect_session: 'This WalletConnect session is not approved for the active account and network.',
  inconclusive_walletconnect_session: 'Reconnect WalletConnect so FlowDex can verify its transaction permissions.',
  missing_walletconnect_eth_sendTransaction: 'This WalletConnect wallet did not approve transaction sending.',
  missing_switch_chain: 'This wallet cannot switch to the required checkout network.',
  wrong_chain: 'Switch to the required checkout network before continuing.',
  account_mismatch: 'The connected wallet account changed. Reconnect and verify it again.',
  provider_disconnected: 'The wallet disconnected before checkout could continue.',
};

export function useBuyCheckoutController() {
  const buyConfig = usePaymentBuyConfig();
  const marketModel = buildBuyMarketModel(buyConfig.data ?? null);
  const supportedAssets = useMemo(
    () => buyConfig.data ? buildSupportedAssetOptions(buyConfig.data, buyConfig.data.assets) : [],
    [buyConfig.data],
  );
  const queryClient = useQueryClient();
  const createPaymentIntent = useCreatePaymentIntent();
  const prepareWalletAction = usePreparePaymentWalletAction();
  const submitPaymentIntentTxResult = useSubmitPaymentIntentTxResult();
  const marketingWallet = useMarketingWalletSync();
  const { openAuthModal } = useAuthModal();
  const bitcoinWallet = useReownCheckoutStore(state => state.bitcoin);
  const tronWallet = useReownCheckoutStore(state => state.tron);
  const isReownRuntimeLoaded = useReownCheckoutStore(state => state.isRuntimeLoaded);
  const walletProvider = useMarketingWalletStore((state: MarketingWalletStore) => state.provider);
  const walletVerification = useMarketingWalletStore((state: MarketingWalletStore) => state.verification);

  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [amountDisplay, setAmountDisplay] = useState(DEFAULT_BUY_AMOUNT);
  const [activePayment, setActivePayment] = useState<ActivePaymentView | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusBackoffUntil, setStatusBackoffUntil] = useState(0);
  const [isStatusPollingStopped, setIsStatusPollingStopped] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  const [checkout, dispatch] = useReducer(walletCheckoutReducer, initialWalletCheckoutState);
  const [solanaWalletState, setSolanaWalletState] = useState(initialSolanaCheckoutWalletAdapterState);
  const solanaWalletStateRef = useRef(solanaWalletState);
  const statusFailureCountRef = useRef(0);
  const isStatusRequestInFlightRef = useRef(false);

  useEffect(() => {
    solanaWalletStateRef.current = solanaWalletState;
  }, [solanaWalletState]);

  const solanaWalletAdapter = useMemo(() => createSolanaMetaMaskCheckoutWalletAdapter({
    getState: () => solanaWalletStateRef.current,
    setState: state => {
      solanaWalletStateRef.current = state;
      setSolanaWalletState(state);
    },
  }), []);
  useEffect(() => {
    if (!selectedAssetId && supportedAssets[0]) {
      setSelectedAssetId(supportedAssets[0].id);
    }
  }, [selectedAssetId, supportedAssets]);
  useEffect(() => {
    setActivePayment(readStoredActivePayment());
    const recovery = readStoredWalletCheckoutRecovery();
    if (recovery) {
      dispatch({ type: 'RESTORE', session: recovery.session, txResult: recovery.txResult });
    }
  }, []);
  useEffect(() => {
    writeStoredActivePayment(activePayment);
  }, [activePayment]);
  useEffect(() => {
    writeStoredWalletCheckoutRecovery(
      checkout.session && checkout.txResult && !PAYMENT_TERMINAL_STATUSES.has(checkout.session.intent.status)
        ? { session: checkout.session, txResult: checkout.txResult }
        : null,
    );
  }, [checkout.session, checkout.txResult]);

  const selectedAsset = supportedAssets.find(asset => asset.id === selectedAssetId) ?? supportedAssets[0] ?? null;
  const assetAmount = Number(amountDisplay);
  const contributionUsd = selectedAsset && Number.isFinite(assetAmount) ? assetAmount * selectedAsset.usdPrice : 0;
  const tokenAmount = marketModel.tokenPriceUsd > 0 ? contributionUsd / marketModel.tokenPriceUsd : 0;
  const tokenAmountInput = formatTokenAmount(tokenAmount);
  const listingValue = tokenAmount * marketModel.listingReferenceUsd;
  const roiPercent = contributionUsd > 0 ? ((listingValue - contributionUsd) / contributionUsd) * 100 : 0;
  const remainingTokens = Math.max(0, marketModel.remainingRaiseUsd / Math.max(marketModel.tokenPriceUsd, 0.000001));
  const canSubmit = Boolean(
    buyConfig.data
    && selectedAsset
    && selectedAsset.usdPrice > 0
    && marketModel.tokenPriceUsd > 0
    && !createPaymentIntent.isPending
    && contributionUsd > 0
    && tokenAmountInput,
  );
  const selectedChainLabel = selectedAsset ? getChainLabel(selectedAsset.chain) : 'Wallet';
  const requiredChainId = selectedAsset?.chain === PAYMENT_CHAINS.ETHEREUM ? selectedAsset.chainId : null;
  const isWrongNetwork = Boolean(
    requiredChainId && walletProvider.address && walletProvider.chainId !== requiredChainId,
  );
  const selectedWalletAddress = selectedAsset?.chain === PAYMENT_CHAINS.BITCOIN
    ? bitcoinWallet.address
    : selectedAsset?.chain === PAYMENT_CHAINS.SOLANA
      ? solanaWalletState.address
      : selectedAsset?.chain === PAYMENT_CHAINS.TRON
        ? tronWallet.address
        : walletProvider.address;

  useEffect(() => {
    if (checkout.stage === 'connecting_wallet' && selectedWalletAddress) {
      dispatch({ type: 'WALLET_READY' });
    }
  }, [checkout.stage, selectedWalletAddress]);

  async function refreshStatus(intentId: string) {
    if (isStatusRequestInFlightRef.current || Date.now() < statusBackoffUntil) {
      return;
    }

    isStatusRequestInFlightRef.current = true;
    setIsCheckingStatus(true);
    try {
      const status = await paymentsService.getPaymentIntentStatus(intentId);
      setActivePayment({ intent: status.intent, payment: status.payment });
      dispatch({ type: 'STATUS_UPDATED', status });
      setStatusError(null);
      statusFailureCountRef.current = 0;
      setIsStatusPollingStopped(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.history(status.intent.senderAddress) }),
        queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.portfolio(status.intent.senderAddress) }),
      ]);
    } catch (error) {
      const details = extractAxiosError(error);
      statusFailureCountRef.current += 1;
      if (statusFailureCountRef.current >= MAX_PAYMENT_STATUS_FAILURES) {
        setIsStatusPollingStopped(true);
        setStatusError('Automatic status checks paused after repeated failures. Reload the page to try again.');
        return;
      }
      if (details.status === 429) {
        setStatusBackoffUntil(Date.now() + PAYMENT_STATUS_RATE_LIMIT_BACKOFF_MS);
        setStatusError('Payment status is updating slowly. Checking again shortly.');
      } else {
        setStatusError(details.message || 'Could not refresh payment status. Retrying shortly.');
      }
    } finally {
      isStatusRequestInFlightRef.current = false;
      setIsCheckingStatus(false);
    }
  }

  useEffect(() => {
    if (!activePayment || isStatusPollingStopped || PAYMENT_TERMINAL_STATUSES.has(activePayment.intent.status)) {
      return;
    }

    void refreshStatus(activePayment.intent.id);
    const interval = window.setInterval(() => void refreshStatus(activePayment.intent.id), PAYMENT_STATUS_POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [activePayment?.intent.id, activePayment?.intent.status, isStatusPollingStopped, statusBackoffUntil]);

  async function requestNetworkSwitch() {
    setIsSwitchingNetwork(true);
    try {
      if (requiredChainId) {
        const result = await marketingWallet.switchToChain(requiredChainId);
        if (!result.ok) {
          throw new Error(result.message);
        }
      }
    } finally {
      setIsSwitchingNetwork(false);
    }
  }

  async function assertEvmCheckoutProviderReady(requiredEvmChainId: number) {
    const connector = marketingWallet.providerAccount.connector;
    if (!connector) {
      throw new Error(evmCheckoutUnsupportedMessages.missing_provider);
    }

    const provider = await connector.getProvider().catch(() => null) as BuyWalletProvider | null;
    if (!provider || typeof provider.request !== 'function') {
      throw new Error(evmCheckoutUnsupportedMessages.missing_provider);
    }

    if (walletProvider.connectorKind !== 'walletconnect') {
      return;
    }

    const readiness = getWalletConnectSessionCapabilities({
      provider,
      activeAddress: walletProvider.address,
      activeChainId: walletProvider.chainId,
      requiredChainId: requiredEvmChainId,
    });

    if (readiness.status === 'checking') {
      throw new Error(evmCheckoutUnsupportedMessages.inconclusive_walletconnect_session);
    }

    if (readiness.status === 'unsupported') {
      throw new Error(evmCheckoutUnsupportedMessages[readiness.reason]);
    }
  }

  async function runWalletCheckout(input: {
    senderAddress: string;
    walletChainId?: string | number;
    send: (action: IPreparedWalletAction, checkoutToken: string) => Promise<WalletTxResult>;
  }) {
    if (!selectedAsset) {
      throw new Error('Choose a payment asset first.');
    }

    dispatch({ type: 'PREPARING' });
    const session = await createPaymentIntent.mutateAsync({
      chain: selectedAsset.chain,
      asset: selectedAsset.code,
      tokenAmount: tokenAmountInput,
      senderAddress: input.senderAddress,
    }).catch(error => {
      throw toCheckoutStepError('create_intent', selectedAsset.chain, error);
    });
    setActivePayment({ intent: session.intent, payment: null });
    dispatch({ type: 'SESSION_CREATED', session });

    const prepared = await prepareWalletAction.mutateAsync({
      intentId: session.intent.id,
      checkoutToken: session.checkoutToken,
      payload: {
        chain: selectedAsset.chain,
        senderAddress: input.senderAddress,
        walletChainId: input.walletChainId,
      },
    }).catch(error => {
      throw toCheckoutStepError('prepare_wallet_action', selectedAsset.chain, error);
    });

    dispatch({ type: 'AWAITING_APPROVAL' });
    const txResult = await input.send(prepared, session.checkoutToken).catch(error => {
      throw toCheckoutStepError('wallet_approval', selectedAsset.chain, error);
    });
    dispatch({ type: 'TX_BROADCAST', txResult });

    const status = await submitPaymentIntentTxResult.mutateAsync({
      intentId: session.intent.id,
      checkoutToken: session.checkoutToken,
      payload: {
        chain: txResult.chain,
        preparedActionId: txResult.preparedActionId,
        txIdKind: txResult.txIdKind,
        txId: txResult.txId,
      },
    }).catch(error => {
      throw toCheckoutStepError('submit_tx_result', selectedAsset.chain, error);
    });
    setActivePayment({ intent: status.intent, payment: status.payment });
    dispatch({ type: 'TRACKING', status });
  }

  async function connectSelectedWallet() {
    if (!selectedAsset) {
      return;
    }

    if (selectedAsset.chain === PAYMENT_CHAINS.BITCOIN) {
      dispatch({ type: 'CLOSE' });
      await bitcoinWallet.openSelector();
      return;
    }

    if (selectedAsset.chain === PAYMENT_CHAINS.ETHEREUM) {
      dispatch({ type: 'CLOSE' });
      openAuthModal();
      return;
    }

    dispatch({ type: 'CONNECTING' });
    if (selectedAsset.chain === PAYMENT_CHAINS.TRON) {
      dispatch({ type: 'CLOSE' });
      await tronWallet.openSelector();
      return;
    }

    if (selectedAsset.chain === PAYMENT_CHAINS.SOLANA) {
      await solanaWalletAdapter.connect();
      dispatch({ type: 'WALLET_READY' });
    }
  }

  async function startWalletPayment() {
    if (!selectedAsset || !canSubmit) {
      return;
    }

    try {
      if (checkout.session && checkout.txResult) {
        dispatch({ type: 'TX_BROADCAST', txResult: checkout.txResult });
        const status = await submitPaymentIntentTxResult.mutateAsync({
          intentId: checkout.session.intent.id,
          checkoutToken: checkout.session.checkoutToken,
          payload: {
            chain: checkout.txResult.chain,
            preparedActionId: checkout.txResult.preparedActionId,
            txIdKind: checkout.txResult.txIdKind,
            txId: checkout.txResult.txId,
          },
        });
        setActivePayment({ intent: status.intent, payment: status.payment });
        dispatch({ type: 'TRACKING', status });
        return;
      }

      if (isWrongNetwork) {
        await requestNetworkSwitch();
        return;
      }

      if (selectedAsset.chain === PAYMENT_CHAINS.BITCOIN) {
        const address = bitcoinWallet.address;
        if (!address) {
          throw new Error('Connect a Bitcoin wallet before continuing.');
        }
        if (!bitcoinWallet.isReady) {
          throw new Error('This Bitcoin wallet cannot send the prepared payment. Choose another wallet.');
        }
        await runWalletCheckout({
          senderAddress: address,
          walletChainId: 'mainnet',
          send: action => bitcoinWallet.sendPreparedAction(mapBitcoinPreparedWalletAction(action)),
        });
        return;
      }

      if (selectedAsset.chain === PAYMENT_CHAINS.TRON) {
        const address = tronWallet.address;
        if (!address) {
          throw new Error('Connect a supported TRON wallet before continuing.');
        }
        if (!tronWallet.isReady) {
          throw new Error('Choose TronLink, OKX, Trust Wallet, or MetaMask TRON for this payment.');
        }
        await runWalletCheckout({
          senderAddress: address,
          walletChainId: TRON_MAINNET_WALLET_CHAIN_ID,
          send: (action, checkoutToken) => tronWallet.sendPreparedAction(
            mapTronPreparedWalletAction(action),
            checkoutToken,
          ),
        });
        return;
      }

      if (selectedAsset.chain === PAYMENT_CHAINS.SOLANA) {
        const address = solanaWalletStateRef.current.address;
        const walletChainId = solanaWalletStateRef.current.walletChainId;
        if (!address || !walletChainId) {
          throw new Error('Connect MetaMask Solana before continuing.');
        }
        await runWalletCheckout({
          senderAddress: address,
          walletChainId,
          send: action => solanaWalletAdapter.sendPreparedAction(mapSolanaPreparedWalletAction(action)),
        });
        return;
      }

      if (!walletProvider.address || !marketingWallet.providerAccount.connector || !requiredChainId) {
        throw new Error('Connect an Ethereum wallet before continuing.');
      }
      await assertEvmCheckoutProviderReady(requiredChainId);
      let verifiedWalletAddress = walletVerification.status === 'verified'
        ? walletVerification.walletAddress
        : null;
      if (!verifiedWalletAddress || normalizeWalletAddress(verifiedWalletAddress) !== normalizeWalletAddress(walletProvider.address)) {
        await marketingWallet.verifyWallet({ chainId: requiredChainId });
        const verification = useMarketingWalletStore.getState().verification;
        verifiedWalletAddress = verification.status === 'verified' ? verification.walletAddress : null;
      }
      if (!verifiedWalletAddress) {
        throw new Error('Could not verify this Ethereum wallet.');
      }
      const walletAdapter = createEvmCheckoutWalletAdapter({
        status: {
          chain: 'ETHEREUM',
          address: walletProvider.address,
          chainId: walletProvider.chainId ?? requiredChainId,
          connectorName: walletProvider.connectorName ?? 'Ethereum wallet',
          isConnected: true,
          isVerified: true,
          isReady: true,
        },
        connector: marketingWallet.providerAccount.connector,
        connectedAddress: walletProvider.address,
        verifiedWalletAddress,
        connect: () => marketingWallet.connectByName(walletProvider.connectorName ?? 'metamask', { chainId: requiredChainId }),
        disconnect: marketingWallet.disconnectWallet,
        verify: () => marketingWallet.verifyWallet({ chainId: requiredChainId }),
      });
      await runWalletCheckout({
        senderAddress: verifiedWalletAddress,
        walletChainId: walletProvider.chainId ?? requiredChainId,
        send: action => walletAdapter.sendPreparedAction(mapEvmPreparedWalletAction(action)),
      });
    } catch (error) {
      const errorView = getCheckoutErrorMessage(error);
      if (!isPostBroadcastCheckoutError(error)) {
        setActivePayment(null);
        writeStoredActivePayment(null);
      }
      dispatch({ type: 'FAILED', error: errorView.message });
      toast.error(errorView.title, { description: errorView.message });
    }
  }

  const paymentInstruction = activePayment
    ? buildPaymentInstructionSummary(activePayment, selectedChainLabel)
    : null;
  const checkoutStage = checkout.stage as BuyCheckoutStage;
  const needsWalletConnection = !selectedWalletAddress
    || (selectedAsset?.chain === PAYMENT_CHAINS.BITCOIN && !bitcoinWallet.isReady)
    || (selectedAsset?.chain === PAYMENT_CHAINS.TRON && !tronWallet.isReady);
  const shouldLoadReown = selectedAsset?.chain === PAYMENT_CHAINS.BITCOIN
    || selectedAsset?.chain === PAYMENT_CHAINS.TRON;
  const isReownRuntimeLoading = Boolean(shouldLoadReown && !isReownRuntimeLoaded);
  const isPrimaryActionBusy = isReownRuntimeLoading
    || isSwitchingNetwork
    || checkoutStage === 'connecting_wallet'
    || checkoutStage === 'preparing_wallet_action'
    || checkoutStage === 'waiting_for_wallet_approval'
    || checkoutStage === 'submitting_tx_result'
    || createPaymentIntent.isPending
    || prepareWalletAction.isPending
    || submitPaymentIntentTxResult.isPending;
  const primaryActionLabel = isReownRuntimeLoading
    ? 'Loading wallet options'
    : buyConfig.isLoading
    ? 'Loading live pricing'
    : buyConfig.isError
      ? 'Live pricing unavailable'
      : isSwitchingNetwork
    ? 'Switching network'
    : checkoutStage === 'connecting_wallet'
      ? 'Connecting wallet'
      : checkoutStage === 'preparing_wallet_action'
        ? 'Preparing transaction'
        : checkoutStage === 'waiting_for_wallet_approval'
          ? 'Confirm in your wallet'
          : checkoutStage === 'submitting_tx_result'
            ? 'Recording transaction'
            : isWrongNetwork
              ? 'Switch network'
              : needsWalletConnection
                ? 'Connect wallet'
                : `Buy ${formatPlainNumber(tokenAmount, 0)} $FDN`;

  return {
    market: {
      isLoading: buyConfig.isLoading,
      hasError: buyConfig.isError,
      currentTier: marketModel.currentTier,
      tokenPriceUsd: marketModel.tokenPriceUsd,
      listingReferenceUsd: marketModel.listingReferenceUsd,
      raisedDisplay: buyConfig.data ? formatCurrency(marketModel.fundsRaisedUsd, 0) : '—',
      targetRaisedDisplay: marketModel.targetRaisedUsd > 0 ? formatCompactCurrency(marketModel.targetRaisedUsd) : '—',
      tokensSoldDisplay: buyConfig.data ? `${formatCompact(marketModel.tokensSold, 2)} FDN` : '—',
      remainingTokensDisplay: buyConfig.data ? formatCompact(remainingTokens, 2) : '—',
      tokenPriceDisplay: buyConfig.data ? formatCurrency(marketModel.tokenPriceUsd, 4) : '—',
      discountPercentDisplay: buyConfig.data ? `-${marketModel.discountPercent}%` : '—',
      nextTierPriceDisplay: marketModel.nextTierTokenPriceUsd
        ? formatCurrency(marketModel.nextTierTokenPriceUsd, 4)
        : buyConfig.data
          ? 'Final tier'
          : '—',
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
      primaryActionLabel,
      isPrimaryActionBusy,
      isWrongNetwork,
      isSwitchingNetwork,
      error: checkout.error ?? (buyConfig.isError ? 'Live pricing is temporarily unavailable. Please try again shortly.' : null),
      canSubmit,
      scenarios: buildScenarioCards(tokenAmount, contributionUsd, marketModel.listingReferenceUsd),
    },
    payment: {
      instruction: paymentInstruction,
      isCreating: createPaymentIntent.isPending || prepareWalletAction.isPending || submitPaymentIntentTxResult.isPending,
      isCheckingStatus,
      statusError,
      walletTxResult: checkout.txResult,
    },
    wallet: {
      shouldLoadReown: Boolean(shouldLoadReown),
      checkoutStage,
      paymentWalletError: checkout.error,
      canUseWalletCheckout: Boolean(selectedAsset?.walletCheckoutEnabled),
      isWrongNetwork,
      isSwitchingNetwork,
      walletStatus: selectedAsset?.chain === PAYMENT_CHAINS.BITCOIN
        ? {
            providerStatus: bitcoinWallet.isConnecting
              ? 'checking' as const
              : bitcoinWallet.isConnected
                ? 'connected' as const
                : 'disconnected' as const,
            address: bitcoinWallet.address,
            chainId: null,
            walletChainId: bitcoinWallet.address ? 'mainnet' : null,
            connectorName: bitcoinWallet.connectorName,
            pendingConnectorName: bitcoinWallet.isConnecting ? 'walletconnect' : null,
            availableConnectorNames: bitcoinWallet.isConfigured ? ['walletconnect'] : [],
            executionReadiness: bitcoinWallet.isReady
              ? 'ready' as const
              : bitcoinWallet.address
                ? 'unsupported' as const
                : 'checking' as const,
            unsupportedReason: !bitcoinWallet.isConfigured || (bitcoinWallet.address && !bitcoinWallet.isReady)
              ? 'missing_provider' as const
              : null,
            connectionErrorMessage: bitcoinWallet.isConfigured
              ? null
              : 'Bitcoin wallet connection is not configured.',
            verificationStatus: bitcoinWallet.address ? 'verified' as const : 'unverified' as const,
            verifiedWalletAddress: bitcoinWallet.address,
            verificationError: null,
            isDisconnecting: false,
            isVerifying: false,
          }
        : selectedAsset?.chain === PAYMENT_CHAINS.TRON
          ? {
              providerStatus: tronWallet.isConnecting
                ? 'checking' as const
                : tronWallet.isConnected
                  ? 'connected' as const
                  : 'disconnected' as const,
              address: tronWallet.address,
              chainId: null,
              walletChainId: tronWallet.walletChainId,
              connectorName: tronWallet.connectorName,
              pendingConnectorName: tronWallet.isConnecting ? 'TRON wallet' : null,
              availableConnectorNames: tronWallet.isConfigured
                ? ['TronLink', 'OKX Wallet', 'Trust Wallet', 'MetaMask TRON']
                : [],
              executionReadiness: tronWallet.isReady
                ? 'ready' as const
                : tronWallet.address
                  ? 'unsupported' as const
                  : 'checking' as const,
              unsupportedReason: !tronWallet.isConfigured || (tronWallet.address && !tronWallet.isReady)
                ? 'missing_provider' as const
                : null,
              connectionErrorMessage: tronWallet.isConfigured
                ? null
                : 'TRON wallet connection is not configured.',
              verificationStatus: tronWallet.address ? 'verified' as const : 'unverified' as const,
              verifiedWalletAddress: tronWallet.address,
              verificationError: null,
              isDisconnecting: false,
              isVerifying: false,
            }
          : selectedAsset?.chain === PAYMENT_CHAINS.SOLANA
            ? {
                providerStatus: solanaWalletState.isConnected ? 'connected' as const : 'disconnected' as const,
                address: solanaWalletState.address,
                chainId: null,
                walletChainId: solanaWalletState.walletChainId,
                connectorName: solanaWalletState.address ? 'metamask-solana' : null,
                pendingConnectorName: checkout.stage === 'connecting_wallet' ? 'metamask-solana' : null,
                availableConnectorNames: ['metamask-solana'],
                executionReadiness: solanaWalletState.isReady ? 'ready' as const : 'checking' as const,
                unsupportedReason: null,
                connectionErrorMessage: solanaWalletState.error,
                verificationStatus: solanaWalletState.isVerified ? 'verified' as const : 'unverified' as const,
                verifiedWalletAddress: solanaWalletState.isVerified ? solanaWalletState.address : null,
                verificationError: solanaWalletState.error,
                isDisconnecting: false,
                isVerifying: false,
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
        dispatch({ type: 'CLOSE' });
      },
      changeAmount(value: string) {
        setAmountDisplay(value.replace(/[^\d.]/gu, ''));
      },
      buy() {
        if (!selectedAsset || !canSubmit) {
          return;
        }
        if (checkout.session && checkout.txResult) {
          void startWalletPayment();
          return;
        }
        if (activePayment && !PAYMENT_TERMINAL_STATUSES.has(activePayment.intent.status)) {
          dispatch({ type: 'RESUME_TRACKING' });
          return;
        }
        if (isWrongNetwork) {
          void requestNetworkSwitch().catch(error => {
            const message = error instanceof Error ? error.message : 'Could not switch network.';
            dispatch({ type: 'FAILED', error: message });
            toast.error('Network switch failed', { description: message });
          });
          return;
        }
        if (needsWalletConnection) {
          void connectSelectedWallet().catch(error => {
            const message = error instanceof Error ? error.message : 'Could not connect this wallet.';
            dispatch({ type: 'FAILED', error: message });
          });
          return;
        }
        void startWalletPayment();
      },
      closeCheckout() {
        dispatch({ type: 'CLOSE' });
      },
      disconnectWallet() {
        if (selectedAsset?.chain === PAYMENT_CHAINS.BITCOIN) {
          void bitcoinWallet.disconnect();
          return;
        }
        if (selectedAsset?.chain === PAYMENT_CHAINS.TRON) {
          void tronWallet.disconnect();
          return;
        }
        if (selectedAsset?.chain === PAYMENT_CHAINS.SOLANA) {
          void solanaWalletAdapter.disconnect?.();
          return;
        }
        void marketingWallet.disconnectWallet();
      },
      startNewPayment() {
        setActivePayment(null);
        setStatusError(null);
        statusFailureCountRef.current = 0;
        setIsStatusPollingStopped(false);
        dispatch({ type: 'RESET' });
        writeStoredActivePayment(null);
        writeStoredWalletCheckoutRecovery(null);
      },
    },
  };
}

function mapEvmPreparedWalletAction(action: IPreparedWalletAction): EvmPreparedWalletAction {
  if (action.kind !== 'evm_transaction') {
    throw new Error('Unsupported Ethereum wallet action.');
  }
  const prepared = action as IPreparedEvmWalletAction;
  return { ...prepared };
}

function mapSolanaPreparedWalletAction(action: IPreparedWalletAction): SolanaPreparedWalletAction {
  if (action.kind !== 'solana_transaction') {
    throw new Error('Unsupported Solana wallet action.');
  }
  const prepared = action as IPreparedSolanaWalletAction;
  return { ...prepared };
}

function mapBitcoinPreparedWalletAction(action: IPreparedWalletAction): BitcoinPreparedWalletAction {
  if (action.kind !== 'bitcoin_transfer') {
    throw new Error('Unsupported Bitcoin wallet action.');
  }
  const prepared = action as IPreparedBitcoinWalletAction;
  return {
    kind: 'bitcoin_transfer',
    paymentIntentId: prepared.paymentIntentId,
    preparedActionId: prepared.preparedActionId,
    chain: 'BITCOIN',
    walletChainId: 'mainnet',
    recipientAddress: prepared.bitcoin.recipientAddress,
    amountSats: prepared.bitcoin.amountSats,
    expiresAt: prepared.expiresAt,
  };
}

function mapTronPreparedWalletAction(action: IPreparedWalletAction): TronPreparedWalletAction {
  if (action.kind !== 'tron_transaction') {
    throw new Error('Unsupported TRON wallet action.');
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
    unsignedTransaction: action.tron.unsignedTransaction,
    expiresAt: action.expiresAt,
  };
}

function buildPaymentInstructionSummary(activePayment: ActivePaymentView, fallbackNetworkLabel: string): PaymentInstructionSummary {
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
  return [
    { label: 'Listing', multiple: 1, cap: '$500M MCAP' },
    { label: '5x', multiple: 5, cap: '$2.5B MCAP' },
    { label: '10x', multiple: 10, cap: '$5B MCAP' },
    { label: '50x', multiple: 50, cap: '$25B MCAP' },
  ].map(scenario => {
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
