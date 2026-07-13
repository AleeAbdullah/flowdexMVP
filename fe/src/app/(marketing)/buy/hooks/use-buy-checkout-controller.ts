'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { BuySnapshot } from '@/components/flowdex/buy-page-types';
import { buildBuyMarketModel } from '@/components/flowdex/buy-page-market';
import { formatCompact, formatCurrency, formatDateTime, formatPlainNumber } from '@/components/flowdex/utils';
import {
  paymentsQueryKeys,
  paymentsService,
  useCreatePaymentIntent,
  usePaymentCheckoutCapabilities,
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
import { usePricing } from '@/dal/market/pricing/pricing.services';
import { usePresaleConfig, usePresaleStats, usePresaleTiers } from '@/dal/market/presale/presale.services';
import { extractAxiosError } from '@/lib/axios';
import { TRON_MAINNET_WALLET_CHAIN_ID } from '../constants/tronlink';
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
import { getCheckoutErrorMessage, toCheckoutStepError } from '../utils/get-checkout-error-message';
import {
  readStoredActivePayment,
  readStoredWalletCheckoutRecovery,
  writeStoredActivePayment,
  writeStoredWalletCheckoutRecovery,
} from '../utils/buy-payment-storage';
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
import {
  createXverseCheckoutWalletAdapter,
  initialXverseCheckoutWalletState,
  isXverseAvailable,
} from '../wallet-adapters/xverse-checkout-wallet-adapter';

const DEFAULT_BUY_AMOUNT = '1.7544';
const PAYMENT_STATUS_POLL_INTERVAL_MS = 12_000;
const PAYMENT_STATUS_RATE_LIMIT_BACKOFF_MS = 30_000;

export function useBuyCheckoutController() {
  const pricing = usePricing();
  const presaleStats = usePresaleStats();
  const presaleTiers = usePresaleTiers();
  const presaleConfig = usePresaleConfig();
  const checkoutCapabilities = usePaymentCheckoutCapabilities();
  const snapshot: BuySnapshot = pricing.data && presaleStats.data && presaleTiers.data && presaleConfig.data
    ? {
        pricing: pricing.data,
        presaleStats: presaleStats.data,
        presaleTiers: presaleTiers.data,
        presaleConfig: presaleConfig.data,
      }
    : null;
  const marketModel = buildBuyMarketModel(snapshot);
  const supportedAssets = useMemo(
    () => checkoutCapabilities.data ? buildSupportedAssetOptions(snapshot, checkoutCapabilities.data.items) : [],
    [checkoutCapabilities.data, snapshot],
  );
  const queryClient = useQueryClient();
  const createPaymentIntent = useCreatePaymentIntent();
  const prepareWalletAction = usePreparePaymentWalletAction();
  const submitPaymentIntentTxResult = useSubmitPaymentIntentTxResult();
  const marketingWallet = useMarketingWalletSync();
  const walletProvider = useMarketingWalletStore((state: MarketingWalletStore) => state.provider);
  const walletVerification = useMarketingWalletStore((state: MarketingWalletStore) => state.verification);

  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [amountDisplay, setAmountDisplay] = useState(DEFAULT_BUY_AMOUNT);
  const [activePayment, setActivePayment] = useState<ActivePaymentView | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusBackoffUntil, setStatusBackoffUntil] = useState(0);
  const [checkout, dispatch] = useReducer(walletCheckoutReducer, initialWalletCheckoutState);
  const [solanaWalletState, setSolanaWalletState] = useState(initialSolanaCheckoutWalletAdapterState);
  const [tronWalletState, setTronWalletState] = useState(initialTronCheckoutWalletAdapterState);
  const [xverseWalletState, setXverseWalletState] = useState(initialXverseCheckoutWalletState);
  const solanaWalletStateRef = useRef(solanaWalletState);
  const tronWalletStateRef = useRef(tronWalletState);
  const xverseWalletStateRef = useRef(xverseWalletState);

  useEffect(() => {
    solanaWalletStateRef.current = solanaWalletState;
  }, [solanaWalletState]);
  useEffect(() => {
    tronWalletStateRef.current = tronWalletState;
  }, [tronWalletState]);
  useEffect(() => {
    xverseWalletStateRef.current = xverseWalletState;
  }, [xverseWalletState]);

  const solanaWalletAdapter = useMemo(() => createSolanaMetaMaskCheckoutWalletAdapter({
    getState: () => solanaWalletStateRef.current,
    setState: state => {
      solanaWalletStateRef.current = state;
      setSolanaWalletState(state);
    },
  }), []);
  const tronWalletAdapter = useMemo(() => createTronLinkCheckoutWalletAdapter({
    getState: () => tronWalletStateRef.current,
    setState: state => {
      tronWalletStateRef.current = state;
      setTronWalletState(state);
    },
  }), []);
  const xverseWalletAdapter = useMemo(() => createXverseCheckoutWalletAdapter({
    getState: () => xverseWalletStateRef.current,
    setState: state => {
      xverseWalletStateRef.current = state;
      setXverseWalletState(state);
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
      checkout.session && !PAYMENT_TERMINAL_STATUSES.has(checkout.session.intent.status)
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
  const canSubmit = Boolean(selectedAsset && !createPaymentIntent.isPending && contributionUsd > 0 && tokenAmountInput);
  const selectedChainLabel = selectedAsset ? getChainLabel(selectedAsset.chain) : 'Wallet';
  const requiredChainId = selectedAsset?.chain === PAYMENT_CHAINS.ETHEREUM ? selectedAsset.chainId : null;
  const isWrongNetwork = Boolean(
    (requiredChainId && walletProvider.address && walletProvider.chainId !== requiredChainId)
    || (selectedAsset?.chain === PAYMENT_CHAINS.TRON
      && tronWalletState.address
      && tronWalletState.walletChainId !== TRON_MAINNET_WALLET_CHAIN_ID),
  );
  const selectedWalletAddress = selectedAsset?.chain === PAYMENT_CHAINS.BITCOIN
    ? xverseWalletState.address
    : selectedAsset?.chain === PAYMENT_CHAINS.SOLANA
      ? solanaWalletState.address
      : selectedAsset?.chain === PAYMENT_CHAINS.TRON
        ? tronWalletState.address
        : walletProvider.address;

  useEffect(() => {
    if (checkout.stage === 'connecting_wallet' && selectedWalletAddress) {
      dispatch({ type: 'WALLET_READY' });
    }
  }, [checkout.stage, selectedWalletAddress]);

  async function refreshStatus(intentId: string) {
    if (Date.now() < statusBackoffUntil) {
      return;
    }

    setIsCheckingStatus(true);
    try {
      const status = await paymentsService.getPaymentIntentStatus(intentId);
      setActivePayment({ intent: status.intent, payment: status.payment });
      dispatch({ type: 'STATUS_UPDATED', status });
      setStatusError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.history(status.intent.senderAddress) }),
        queryClient.invalidateQueries({ queryKey: paymentsQueryKeys.portfolio(status.intent.senderAddress) }),
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
    const interval = window.setInterval(() => void refreshStatus(activePayment.intent.id), PAYMENT_STATUS_POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [activePayment?.intent.id, activePayment?.intent.status, statusBackoffUntil]);

  async function requestNetworkSwitch() {
    if (selectedAsset?.chain === PAYMENT_CHAINS.TRON) {
      await tronWalletAdapter.switchNetwork?.();
      return;
    }
    if (requiredChainId) {
      const result = await marketingWallet.switchToChain(requiredChainId);
      if (!result.ok) {
        throw new Error(result.message);
      }
    }
  }

  async function runWalletCheckout(input: {
    senderAddress: string;
    walletChainId?: string | number;
    send: (action: IPreparedWalletAction) => Promise<WalletTxResult>;
  }) {
    if (!selectedAsset) {
      throw new Error('Choose a payment asset first.');
    }

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
    const txResult = await input.send(prepared).catch(error => {
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
        dispatch({ type: 'CONNECTING' });
        const address = xverseWalletStateRef.current.address ?? await xverseWalletAdapter.connect();
        dispatch({ type: 'WALLET_READY' });
        await runWalletCheckout({
          senderAddress: address,
          walletChainId: 'mainnet',
          send: action => xverseWalletAdapter.sendPreparedAction(mapBitcoinPreparedWalletAction(action)),
        });
        return;
      }

      if (selectedAsset.chain === PAYMENT_CHAINS.TRON) {
        dispatch({ type: 'CONNECTING' });
        if (!tronWalletStateRef.current.address) {
          await tronWalletAdapter.connect();
        }
        if (tronWalletStateRef.current.walletChainId !== TRON_MAINNET_WALLET_CHAIN_ID) {
          await tronWalletAdapter.switchNetwork?.();
        }
        const address = tronWalletStateRef.current.address;
        if (!address) {
          throw new Error('Connect TronLink before continuing.');
        }
        dispatch({ type: 'WALLET_READY' });
        await runWalletCheckout({
          senderAddress: address,
          walletChainId: TRON_MAINNET_WALLET_CHAIN_ID,
          send: action => tronWalletAdapter.sendPreparedAction(mapTronPreparedWalletAction(action)),
        });
        return;
      }

      if (selectedAsset.chain === PAYMENT_CHAINS.SOLANA) {
        dispatch({ type: 'CONNECTING' });
        if (!solanaWalletStateRef.current.address) {
          await solanaWalletAdapter.connect();
        }
        const address = solanaWalletStateRef.current.address;
        const walletChainId = solanaWalletStateRef.current.walletChainId;
        if (!address || !walletChainId) {
          throw new Error('Connect MetaMask Solana before continuing.');
        }
        dispatch({ type: 'WALLET_READY' });
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
      dispatch({ type: 'CONNECTING' });
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
      dispatch({ type: 'WALLET_READY' });
      await runWalletCheckout({
        senderAddress: verifiedWalletAddress,
        walletChainId: walletProvider.chainId ?? requiredChainId,
        send: action => walletAdapter.sendPreparedAction(mapEvmPreparedWalletAction(action)),
      });
    } catch (error) {
      const errorView = getCheckoutErrorMessage(error);
      dispatch({ type: 'FAILED', error: errorView.message });
      toast.error(errorView.title, { description: errorView.message });
    }
  }

  const paymentInstruction = activePayment
    ? buildPaymentInstructionSummary(activePayment, selectedChainLabel)
    : null;
  const checkoutStage = checkout.stage as BuyCheckoutStage;

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
      buyButtonLabel: isWrongNetwork ? 'Switch Network' : `Buy ${formatPlainNumber(tokenAmount, 0)} $FDN`,
      isWrongNetwork,
      isSwitchingNetwork: false,
      error: checkout.error,
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
      checkoutStage,
      paymentWalletError: checkout.error,
      canUseWalletCheckout: Boolean(selectedAsset?.walletCheckoutEnabled),
      isWrongNetwork,
      isSwitchingNetwork: false,
      walletStatus: selectedAsset?.chain === PAYMENT_CHAINS.BITCOIN
        ? {
            providerStatus: xverseWalletState.isConnected ? 'connected' as const : 'disconnected' as const,
            address: xverseWalletState.address,
            chainId: null,
            walletChainId: xverseWalletState.address ? 'mainnet' : null,
            connectorName: xverseWalletState.address ? 'xverse' : null,
            pendingConnectorName: checkout.stage === 'connecting_wallet' ? 'xverse' : null,
            availableConnectorNames: isXverseAvailable() ? ['xverse'] : [],
            executionReadiness: xverseWalletState.address ? 'ready' as const : 'checking' as const,
            unsupportedReason: isXverseAvailable() ? null : 'missing_provider' as const,
            connectionErrorMessage: xverseWalletState.error,
            verificationStatus: xverseWalletState.address ? 'verified' as const : 'unverified' as const,
            verifiedWalletAddress: xverseWalletState.address,
            verificationError: xverseWalletState.error,
            isDisconnecting: false,
            isVerifying: false,
          }
        : selectedAsset?.chain === PAYMENT_CHAINS.TRON
          ? {
              providerStatus: tronWalletState.isConnected ? 'connected' as const : 'disconnected' as const,
              address: tronWalletState.address,
              chainId: null,
              walletChainId: tronWalletState.walletChainId,
              connectorName: tronWalletState.address ? 'tronlink' : null,
              pendingConnectorName: checkout.stage === 'connecting_wallet' ? 'tronlink' : null,
              availableConnectorNames: isTronLinkAvailable() ? ['tronlink'] : [],
              executionReadiness: tronWalletState.isReady ? 'ready' as const : 'checking' as const,
              unsupportedReason: isTronLinkAvailable() ? null : 'missing_provider' as const,
              connectionErrorMessage: tronWalletState.error,
              verificationStatus: tronWalletState.address ? 'verified' as const : 'unverified' as const,
              verifiedWalletAddress: tronWalletState.address,
              verificationError: tronWalletState.error,
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
        dispatch({ type: 'OPEN' });
      },
      closeCheckout() {
        dispatch({ type: 'CLOSE' });
      },
      connectWallet(connectorName: string) {
        dispatch({ type: 'CONNECTING' });
        if (selectedAsset?.chain === PAYMENT_CHAINS.BITCOIN) {
          void xverseWalletAdapter.connect().then(() => dispatch({ type: 'WALLET_READY' })).catch(error => dispatch({ type: 'FAILED', error: error instanceof Error ? error.message : 'Could not connect Xverse.' }));
          return;
        }
        if (selectedAsset?.chain === PAYMENT_CHAINS.TRON) {
          void tronWalletAdapter.connect().then(() => dispatch({ type: 'WALLET_READY' })).catch(error => dispatch({ type: 'FAILED', error: error instanceof Error ? error.message : 'Could not connect TronLink.' }));
          return;
        }
        if (selectedAsset?.chain === PAYMENT_CHAINS.SOLANA) {
          void solanaWalletAdapter.connect().then(() => dispatch({ type: 'WALLET_READY' })).catch(error => dispatch({ type: 'FAILED', error: error instanceof Error ? error.message : 'Could not connect MetaMask Solana.' }));
          return;
        }
        marketingWallet.connectByName(connectorName, requiredChainId ? { chainId: requiredChainId } : undefined);
      },
      disconnectWallet() {
        if (selectedAsset?.chain === PAYMENT_CHAINS.BITCOIN) {
          xverseWalletAdapter.disconnect();
          return;
        }
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
        void startWalletPayment();
      },
      startWalletPayment() {
        void startWalletPayment();
      },
      switchNetwork() {
        void requestNetworkSwitch().catch(error => dispatch({ type: 'FAILED', error: error instanceof Error ? error.message : 'Could not switch network.' }));
      },
      startNewPayment() {
        setActivePayment(null);
        setStatusError(null);
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
