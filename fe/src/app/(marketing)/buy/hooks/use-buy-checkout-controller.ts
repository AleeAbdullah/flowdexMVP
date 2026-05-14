'use client';

import { useChain } from '@account-kit/react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { formatUnits, parseUnits } from 'viem';
import type { BuySnapshot } from '@/components/flowdex/buy-page-types';
import { buildBuyMarketModel } from '@/components/flowdex/buy-page-market';
import { formatCurrency } from '@/components/flowdex/utils';
import {
  buildWalletSupportRegistry,
  getApprovedDirectWalletDisplayNames,
  getBuyWalletPickerEntries,
  getWalletConnectEntry,
  getWalletSupportRuntime,
  getWalletSupportSummary,
  getPrimaryWalletSupportCopy,
} from '@/constants/wallet-support';
import { useSimulateTransaction, useTrackTransaction } from '@/dal/app/transactions/transactions.services';
import { describeTransactionSimulationReason } from '@/dal/app/transactions/transactions.utils';
import { extractAxiosError } from '@/lib/axios';
import { ROUTES } from '@/routes';
import { useMarketingWalletStore } from '@/hooks/use-marketing-wallet-store';
import { normalizeMarketingWalletConnectorName, useMarketingWalletSync } from '@/hooks/use-marketing-wallet-sync';
import { buildBuyViewModel } from '../utils/buy-view-model';
import { deriveBuyFlowState } from '../utils/derive-buy-flow-state';
import { describeUnsupportedWalletReason, getBuyExecutionReadiness } from '../utils/get-buy-execution-readiness';
import { sendBuyTransaction } from '../utils/send-buy-transaction';
import {
  buildSupportedAssetOptions,
  getChainLabel,
  getChainLabelFromId,
  resolvePreferredSupportedAssetId,
  SUPPORTED_NATIVE_CHAIN_CONFIG,
} from '../utils/supported-asset-options';
import type { BuyActionId } from '../types/buy-view-model';

function getExplorerUrl(chainId: number, txHash: string | null) {
  if (!txHash) {
    return null;
  }

  if (chainId === SUPPORTED_NATIVE_CHAIN_CONFIG.BASE_SEPOLIA.chainId) {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  }

  if (chainId === SUPPORTED_NATIVE_CHAIN_CONFIG.ETH_SEPOLIA.chainId) {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  }

  return null;
}

export function useBuyCheckoutController(snapshot: BuySnapshot) {
  const market = buildBuyMarketModel(snapshot);
  const supportedAssets = useMemo(() => buildSupportedAssetOptions(snapshot), [snapshot]);
  const queryClient = useQueryClient();
  const { setChain, isSettingChain } = useChain();
  const marketingWallet = useMarketingWalletSync();
  const simulateTransaction = useSimulateTransaction();
  const trackTransaction = useTrackTransaction();

  const provider = useMarketingWalletStore((state) => state.provider);
  const verification = useMarketingWalletStore((state) => state.verification);
  const checkout = useMarketingWalletStore((state) => state.checkout);
  const setProviderExecutionState = useMarketingWalletStore((state) => state.setProviderExecutionState);
  const setCheckoutSelectedAssetId = useMarketingWalletStore((state) => state.setCheckoutSelectedAssetId);
  const setCheckoutAmountDisplay = useMarketingWalletStore((state) => state.setCheckoutAmountDisplay);
  const setCheckoutSubmissionState = useMarketingWalletStore((state) => state.setCheckoutSubmissionState);
  const clearCheckoutLifecycle = useMarketingWalletStore((state) => state.clearCheckoutLifecycle);
  const manualSelectedAssetIdRef = useRef<string | null>(null);
  const manualSelectionIsCurrent = Boolean(
    manualSelectedAssetIdRef.current
    && checkout.selectedAssetId === manualSelectedAssetIdRef.current
    && supportedAssets.some((asset) => asset.id === manualSelectedAssetIdRef.current),
  );
  const checkoutInProgress = checkout.submission !== 'idle';

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

    if (manualSelectedAssetIdRef.current && manualSelectedAssetIdRef.current !== preferredAssetId) {
      manualSelectedAssetIdRef.current = null;
    }

    setCheckoutSelectedAssetId(preferredAssetId);
  }, [checkout.selectedAssetId, preferredAssetId, setCheckoutSelectedAssetId]);

  const selectedAsset = supportedAssets.find((asset) => asset.id === (checkout.selectedAssetId ?? preferredAssetId)) ?? null;

  useEffect(() => {
    let canceled = false;

    async function syncExecutionReadiness() {
      if (!selectedAsset?.chainId) {
        setProviderExecutionState({
          executionReadiness: 'checking',
          unsupportedReason: null,
        });
        return;
      }

      const readiness = await getBuyExecutionReadiness({
        providerAccount: marketingWallet.providerAccount,
        requiredChainId: selectedAsset.chainId,
      });

      if (canceled) {
        return;
      }

      if (readiness.status === 'ready') {
        setProviderExecutionState({
          executionReadiness: 'ready',
          unsupportedReason: null,
        });
        return;
      }

      if (readiness.status === 'unsupported') {
        setProviderExecutionState({
          executionReadiness: 'unsupported',
          unsupportedReason: readiness.reason,
        });
        return;
      }

      setProviderExecutionState({
        executionReadiness: 'checking',
        unsupportedReason: null,
      });
    }

    void syncExecutionReadiness();

    return () => {
      canceled = true;
    };
  }, [marketingWallet.providerAccount, selectedAsset?.chainId, setProviderExecutionState]);

  const walletSupportRegistry = useMemo(() => {
    const runtime = getWalletSupportRuntime();
    return buildWalletSupportRegistry({
      walletConnectEnabled: runtime.walletConnectEnabled,
    });
  }, []);
  const walletSupportSummary = useMemo(
    () => getWalletSupportSummary(walletSupportRegistry),
    [walletSupportRegistry],
  );
  const primaryWalletSupportCopy = useMemo(
    () => getPrimaryWalletSupportCopy(walletSupportRegistry),
    [walletSupportRegistry],
  );
  const approvedDirectWalletDisplayNames = useMemo(
    () => getApprovedDirectWalletDisplayNames(walletSupportRegistry),
    [walletSupportRegistry],
  );
  const walletConnectEnabled = useMemo(
    () => getWalletConnectEntry(walletSupportRegistry)?.releaseTier === 'fallback',
    [walletSupportRegistry],
  );
  const walletButtons = useMemo(() => {
    const availableConnectorNames = new Set(provider.availableConnectorNames);
    return getBuyWalletPickerEntries(walletSupportRegistry).map((entry) => {
      const normalizedConnectorName = normalizeMarketingWalletConnectorName(entry.accountKitName);
      return {
        id: entry.id,
        label: entry.displayName,
        caption: entry.releaseTier === 'fallback'
          ? 'Connect with WalletConnect. Compatibility is checked after the wallet approves the session.'
          : 'Connect here and continue to checkout.',
        mode: entry.releaseTier === 'fallback' ? 'session-gated' as const : 'direct' as const,
        busy: provider.status === 'checking' && provider.pendingConnectorName === normalizedConnectorName,
        disabled: !availableConnectorNames.has(normalizedConnectorName) || provider.status === 'checking',
        onClick: () => {
          clearCheckoutLifecycle();
          marketingWallet.clearConnectionIssue();
          marketingWallet.connectByName(normalizedConnectorName, {
            chainId: selectedAsset?.chainId ?? SUPPORTED_NATIVE_CHAIN_CONFIG.BASE_SEPOLIA.chainId,
          });
        },
      };
    });
  }, [
    clearCheckoutLifecycle,
    marketingWallet,
    provider.availableConnectorNames,
    provider.pendingConnectorName,
    provider.status,
    selectedAsset?.chainId,
    walletSupportRegistry,
  ]);

  const amountNumber = Number(checkout.amountDisplay);
  const estimatedContributionUsd = selectedAsset && Number.isFinite(amountNumber)
    ? amountNumber * selectedAsset.usdPrice
    : 0;
  const estimatedTokens = amountNumber > 0 && market.tokenPriceUsd > 0
    ? estimatedContributionUsd / market.tokenPriceUsd
    : 0;
  const selectedChainLabel = selectedAsset ? getChainLabel(selectedAsset.chain) : 'No chain selected';
  const verifiedChainLabel = getChainLabelFromId(verification.chainId);
  const walletChainLabel = getChainLabelFromId(provider.chainId);
  const walletStatusLabel = provider.status !== 'connected'
    ? 'Not connected'
    : verification.status !== 'verified'
      ? 'Verification required'
      : selectedAsset && provider.chainId !== selectedAsset.chainId
        ? 'Switch network'
        : 'Verified';
  const latestExplorerUrl = selectedAsset
    ? getExplorerUrl(selectedAsset.chainId, checkout.txHash)
    : null;

  const providerChainMismatch = Boolean(
    provider.status === 'connected'
    && selectedAsset
    && provider.chainId
    && provider.chainId !== selectedAsset.chainId,
  );
  const hasContributionOption = Boolean(selectedAsset);
  const { flowState, issueReason } = deriveBuyFlowState({
    provider,
    verification,
    checkout,
    providerChainMismatch,
  });

  const contributionErrorMessage = provider.executionReadiness === 'unsupported'
    ? provider.unsupportedReason
      ? describeUnsupportedWalletReason(provider.unsupportedReason)
      : provider.connectionErrorMessage
    : provider.connectionErrorMessage
      ?? verification.error
      ?? checkout.errorMessage;

  const viewModel = buildBuyViewModel({
    flowState,
    submissionState: checkout.submission,
    issueReason,
    primaryWalletSupportCopy,
    selectedAssetCode: selectedAsset?.code ?? null,
    selectedChainLabel,
    contributionErrorMessage: contributionErrorMessage ?? null,
  });

  const canSubmit = Boolean(
    selectedAsset
    && hasContributionOption
    && provider.status === 'connected'
    && provider.executionReadiness === 'ready'
    && verification.status === 'verified'
    && verification.walletAddress
    && marketingWallet.providerAccount.connector
    && !providerChainMismatch
    && checkout.amountDisplay
    && Number.isFinite(amountNumber)
    && amountNumber > 0
    && amountNumber >= selectedAsset.minAmount
    && checkout.submission === 'idle',
  );

  async function handleVerifyWallet() {
    if (!selectedAsset || provider.executionReadiness !== 'ready' || providerChainMismatch) {
      return;
    }

    marketingWallet.clearConnectionIssue();
    clearCheckoutLifecycle();
    await marketingWallet.verifyWallet({
      chainId: selectedAsset.chainId,
    });
  }

  async function handleSwitchNetwork() {
    if (!selectedAsset) {
      return;
    }

    try {
      clearCheckoutLifecycle();
      await setChain({
        chain: SUPPORTED_NATIVE_CHAIN_CONFIG[selectedAsset.chain].chain,
      });
    } catch {
      setCheckoutSubmissionState({
        submission: 'idle',
        errorReason: 'wrong_chain',
        errorMessage: `Automatic switching was not available. Open the wallet and switch to ${selectedChainLabel}, then return here before submitting.`,
      });
    }
  }

  function handleAssetChange(assetId: string) {
    manualSelectedAssetIdRef.current = assetId;
    setCheckoutSelectedAssetId(assetId);
  }

  async function handleRetryTracking() {
    if (checkout.submission !== 'failed' || checkout.errorReason !== 'track_failed' || !checkout.simulation?.simulationId || !checkout.txHash) {
      return;
    }

    setCheckoutSubmissionState({
      submission: 'tracking',
      txHash: checkout.txHash,
      simulation: checkout.simulation,
      errorReason: null,
      errorMessage: null,
    });

    try {
      const tracked = await trackTransaction.mutateAsync({
        simulationId: checkout.simulation.simulationId!,
        txHash: checkout.txHash,
      });

      queryClient.removeQueries({ queryKey: ['wallet', 'transactions'] });
      setCheckoutSubmissionState({
        submission: 'success',
        txHash: checkout.txHash,
        receiptPublicId: tracked.publicId,
        simulation: checkout.simulation,
      });
      window.setTimeout(() => {
        window.location.assign(ROUTES.USER.transactionDetail(tracked.publicId));
      }, 120);
    } catch (error) {
      const details = extractAxiosError(error);
      setCheckoutSubmissionState({
        submission: 'failed',
        txHash: checkout.txHash,
        simulation: checkout.simulation,
        errorReason: 'track_failed',
        errorMessage: details.message || 'Could not track the contribution receipt.',
      });
    }
  }

  async function handleSubmitContribution() {
    if (
      !selectedAsset
      || provider.executionReadiness !== 'ready'
      || provider.status !== 'connected'
      || !provider.address
      || !verification.walletAddress
      || verification.status !== 'verified'
      || !marketingWallet.providerAccount.connector
    ) {
      return;
    }

    const amountBaseUnits = parseUnits(checkout.amountDisplay, selectedAsset.decimals).toString();

    marketingWallet.clearConnectionIssue();
    setCheckoutSubmissionState({
      submission: 'simulating',
      simulation: null,
      txHash: null,
      receiptPublicId: null,
      errorReason: null,
      errorMessage: null,
    });

    let simulationResult: Awaited<ReturnType<typeof simulateTransaction.mutateAsync>>;
    try {
      simulationResult = await simulateTransaction.mutateAsync({
        chainId: selectedAsset.chainId,
        assetType: 'native',
        assetCode: selectedAsset.code,
        assetDecimals: selectedAsset.decimals,
        amountBaseUnits,
        amountDisplay: checkout.amountDisplay,
      });
    } catch (error) {
      const details = extractAxiosError(error);
      setCheckoutSubmissionState({
        submission: 'failed',
        errorReason: 'simulate_failed',
        errorMessage: details.message || 'FlowDex could not validate this contribution request.',
      });
      return;
    }

    if (!simulationResult.allowed || !simulationResult.request || !simulationResult.simulationId) {
      setCheckoutSubmissionState({
        submission: 'failed',
        simulation: simulationResult,
        errorReason: 'simulate_failed',
        errorMessage: describeTransactionSimulationReason(simulationResult.reason),
      });
      return;
    }

    setCheckoutSubmissionState({
      submission: 'awaiting_wallet_approval',
      simulation: simulationResult,
      errorReason: null,
      errorMessage: null,
    });

    const sendResult = await sendBuyTransaction({
      connector: marketingWallet.providerAccount.connector,
      connectedAddress: provider.address,
      verifiedWalletAddress: verification.walletAddress,
      request: simulationResult.request,
    });

    if ('error' in sendResult) {
      if (sendResult.error.reason === 'unsupported_method') {
        setProviderExecutionState({
          executionReadiness: 'unsupported',
          unsupportedReason: provider.connectorKind === 'walletconnect'
            ? 'missing_walletconnect_eth_sendTransaction'
            : 'unsupported_injected_provider',
        });
        setCheckoutSubmissionState({
          submission: 'idle',
          simulation: null,
          txHash: null,
          receiptPublicId: null,
          errorReason: 'unsupported_wallet',
          errorMessage: sendResult.error.message,
        });
        return;
      }

      setCheckoutSubmissionState({
        submission: 'failed',
        simulation: simulationResult,
        errorReason: sendResult.error.reason === 'user_rejected' ? 'send_canceled' : 'send_failed',
        errorMessage: sendResult.error.reason === 'user_rejected'
          ? sendResult.error.message
          : sendResult.error.message || 'The transaction could not be broadcast from the connected wallet.',
      });
      return;
    }

    setCheckoutSubmissionState({
      submission: 'tracking',
      simulation: simulationResult,
      txHash: sendResult.txHash,
      errorReason: null,
      errorMessage: null,
    });

    try {
      const tracked = await trackTransaction.mutateAsync({
        simulationId: simulationResult.simulationId,
        txHash: sendResult.txHash,
      });

      queryClient.removeQueries({ queryKey: ['wallet', 'transactions'] });
      setCheckoutSubmissionState({
        submission: 'success',
        simulation: simulationResult,
        txHash: sendResult.txHash,
        receiptPublicId: tracked.publicId,
      });
      window.setTimeout(() => {
        window.location.assign(ROUTES.USER.transactionDetail(tracked.publicId));
      }, 120);
    } catch (error) {
      const details = extractAxiosError(error);
      setCheckoutSubmissionState({
        submission: 'failed',
        simulation: simulationResult,
        txHash: sendResult.txHash,
        errorReason: 'track_failed',
        errorMessage: details.message || 'The transaction was sent, but the receipt could not be created yet.',
      });
    }
  }

  const primaryActionDisabled = viewModel.dominantActionId === 'verifyWallet'
    ? !selectedAsset || provider.status !== 'connected' || marketingWallet.isVerifying || provider.executionReadiness !== 'ready' || providerChainMismatch
    : viewModel.dominantActionId === 'switchNetwork'
      ? !selectedAsset || isSettingChain
      : viewModel.dominantActionId === 'submitContribution'
        ? !canSubmit
        : viewModel.dominantActionId === 'retryTracking'
          ? checkout.submission !== 'failed' || checkout.errorReason !== 'track_failed'
          : true;

  const secondaryActionDisabled = viewModel.secondaryActionId === 'disconnectWallet'
    ? marketingWallet.isDisconnecting
    : false;

  const actionHandlers = {
    verifyWallet: handleVerifyWallet,
    switchNetwork: handleSwitchNetwork,
    submitContribution: handleSubmitContribution,
    retryTracking: handleRetryTracking,
    viewReceipts: () => {
      window.location.assign(ROUTES.USER.TRANSACTIONS);
    },
    disconnectWallet: marketingWallet.disconnectWallet,
  };

  return {
    viewModel,
    walletStatusLabel,
    connectedWalletAddress: provider.address,
    sessionWalletChecksum: verification.walletAddress,
    verifiedChainLabel,
    walletChainLabel,
    selectedChainLabel,
    selectedAsset,
    supportedAssets,
    selectedAssetId: checkout.selectedAssetId ?? preferredAssetId ?? '',
    onAssetChange: handleAssetChange,
    amountDisplay: checkout.amountDisplay,
    onAmountChange: setCheckoutAmountDisplay,
    contributionEnabled: Boolean(provider.status === 'connected' && selectedAsset),
    estimatedContributionUsdDisplay: estimatedContributionUsd > 0 ? formatCurrency(estimatedContributionUsd, 2) : '$0.00',
    estimatedTokensDisplay: estimatedTokens > 0 ? formatUnits(parseUnits(estimatedTokens.toFixed(6), 6), 6) : '0',
    latestExplorerUrl,
    walletSupportSummary,
    approvedDirectWalletDisplayNames,
    walletConnectEnabled,
    walletButtons,
    primaryActionDisabled,
    secondaryActionDisabled,
    onAction(actionId: BuyActionId | null) {
      if (!actionId) {
        return;
      }

      void actionHandlers[actionId]?.();
    },
    currentTier: market.currentTier,
    tokenPriceDisplay: formatCurrency(market.tokenPriceUsd, 4),
    raisedDisplay: formatCurrency(market.fundsRaisedUsd, 0),
    raisedProgressPercent: market.raisedProgressPercent,
    sourceUpdatedAt: market.sourceUpdatedAt,
    listingReferenceDisplay: formatCurrency(market.listingReferenceUsd, 2),
  };
}
