'use client';

import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { useChain, useConnect, useLogout, useSigner, useSignerStatus, useUser } from '@account-kit/react';
import { useQueryClient } from '@tanstack/react-query';
import { createPublicClient, formatUnits, http, parseUnits } from 'viem';
import type { BuySnapshot } from '@/components/flowdex/buy-page-types';
import { buildBuyMarketModel } from '@/components/flowdex/buy-page-market';
import {
  buildWalletSupportRegistry,
  getApprovedDirectWalletDisplayNames,
  getBuyWalletPickerEntries,
  getWalletConnectCompatibleDisplayNames,
  getWalletConnectEntry,
  getWalletSupportSummary,
  getPrimaryWalletSupportCopy,
  getWalletSupportRuntime,
} from '@/constants/wallet-support';
import { formatCurrency } from '@/components/flowdex/utils';
import { useSimulateTransaction, useTrackTransaction } from '@/dal/app/transactions/transactions.services';
import { useLogoutWalletSession, useWalletSession } from '@/dal/app/wallet-auth/wallet-auth.services';
import { useWalletSessionSync } from '@/hooks/use-wallet-session-sync';
import { useWalletVerification } from '@/hooks/use-wallet-verification';
import { extractAxiosError } from '@/lib/axios';
import { ROUTES } from '@/routes';
import type { BuyConnectionState, BuyIssueReason, BuyViewModelInput } from '../types/buy-view-model';
import { buildBuyViewModel, inferConnectionIssueReason, isUserRejectedError, normalizeWalletAddress } from '../utils/buy-view-model';
import {
  buildSupportedAssetOptions,
  getChainLabel,
  getChainLabelFromId,
  SUPPORTED_NATIVE_CHAIN_CONFIG,
} from '../utils/supported-asset-options';
import { WalletBuyShell } from './wallet-buy-shell';

type BrowserWalletSigner = {
  getAddress: () => Promise<`0x${string}`>;
  signMessage: (message: string) => Promise<`0x${string}`>;
  signTransaction: (transaction: Record<string, unknown>) => Promise<`0x${string}`>;
};

type ConnectionAttemptState = {
  status: 'idle' | 'connecting' | 'failed';
  connectorName: string | null;
  issueReason: BuyIssueReason | null;
  message: string | null;
  startedAt: number | null;
};

type SubmissionState =
  | { phase: 'idle' }
  | { phase: 'simulate-pending' }
  | { phase: 'simulate-failed'; message: string | null }
  | { phase: 'send-pending'; simulationId: string }
  | { phase: 'send-canceled'; simulationId: string | null; message: string | null }
  | { phase: 'send-failed'; simulationId: string | null; message: string | null }
  | { phase: 'track-pending'; simulationId: string; txHash: string }
  | { phase: 'track-failed'; simulationId: string; txHash: string; message: string | null }
  | { phase: 'receipt-ready'; txHash: string; publicId: string };

type WalletTrayButtonModel = {
  id: string;
  label: string;
  caption: string;
  mode: 'direct' | 'fallback';
  disabled?: boolean;
  busy?: boolean;
  onClick: () => void;
};

function normalizeConnectorName(name: string | null | undefined) {
  const normalized = (name ?? '').trim().toLowerCase().replace(/\s+/g, '');
  if (normalized === 'wallet_connect' || normalized === 'walletconnect') {
    return 'walletconnect';
  }

  return normalized;
}

function getRuntimeConnectorName(connector: unknown) {
  if (!connector) {
    return '';
  }

  if (typeof connector === 'function') {
    return 'walletconnect';
  }

  if (typeof connector === 'object') {
    const connectorName = 'name' in connector && typeof connector.name === 'string'
      ? connector.name
      : null;
    const connectorId = 'id' in connector && typeof connector.id === 'string'
      ? connector.id
      : null;

    return normalizeConnectorName(connectorName ?? connectorId ?? null);
  }

  return '';
}

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

function getPublicClient(chainId: number) {
  if (chainId === SUPPORTED_NATIVE_CHAIN_CONFIG.BASE_SEPOLIA.chainId) {
    return createPublicClient({
      chain: SUPPORTED_NATIVE_CHAIN_CONFIG.BASE_SEPOLIA.chain,
      transport: http(),
    });
  }

  return createPublicClient({
    chain: SUPPORTED_NATIVE_CHAIN_CONFIG.ETH_SEPOLIA.chain,
    transport: http(),
  });
}

async function prepareContributionTransaction(input: {
  account: `0x${string}`;
  chainId: number;
  request: {
    to: string;
    value: string;
    data: string;
  };
}) {
  if (input.chainId === SUPPORTED_NATIVE_CHAIN_CONFIG.BASE_SEPOLIA.chainId) {
    const client = createPublicClient({
      chain: SUPPORTED_NATIVE_CHAIN_CONFIG.BASE_SEPOLIA.chain,
      transport: http(),
    });

    return client.prepareTransactionRequest({
      account: input.account,
      to: input.request.to as `0x${string}`,
      value: BigInt(input.request.value),
      data: input.request.data as `0x${string}`,
      chain: SUPPORTED_NATIVE_CHAIN_CONFIG.BASE_SEPOLIA.chain,
    });
  }

  const client = createPublicClient({
    chain: SUPPORTED_NATIVE_CHAIN_CONFIG.ETH_SEPOLIA.chain,
    transport: http(),
  });

  return client.prepareTransactionRequest({
    account: input.account,
    to: input.request.to as `0x${string}`,
    value: BigInt(input.request.value),
    data: input.request.data as `0x${string}`,
    chain: SUPPORTED_NATIVE_CHAIN_CONFIG.ETH_SEPOLIA.chain,
  });
}

function getSubmissionErrorMessage(state: SubmissionState) {
  switch (state.phase) {
    case 'simulate-failed':
    case 'send-canceled':
    case 'send-failed':
    case 'track-failed':
      return state.message;
    default:
      return null;
  }
}

export function WalletBuyPageClient(props: {
  snapshot: BuySnapshot;
}) {
  const market = buildBuyMarketModel(props.snapshot);
  const supportedAssets = useMemo(() => buildSupportedAssetOptions(props.snapshot), [props.snapshot]);
  const [selectedAssetId, setSelectedAssetId] = useState(supportedAssets[0]?.id ?? '');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [manualChainSwitchHelp, setManualChainSwitchHelp] = useState<string | null>(null);
  const [lastSubmittedTxHash, setLastSubmittedTxHash] = useState<string | null>(null);
  const [connectionAttempt, setConnectionAttempt] = useState<ConnectionAttemptState>({
    status: 'idle',
    connectorName: null,
    issueReason: null,
    message: null,
    startedAt: null,
  });
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    phase: 'idle',
  });

  const queryClient = useQueryClient();
  const signerStatus = useSignerStatus();
  const signer = useSigner() as BrowserWalletSigner | null;
  const user = useUser();
  const connectWallet = useConnect({
    onMutate: ({ connector }) => {
      setConnectionAttempt({
        status: 'connecting',
        connectorName: getRuntimeConnectorName(connector),
        issueReason: null,
        message: null,
        startedAt: Date.now(),
      });
    },
    onError: (error, { connector }) => {
      const connectorName = getRuntimeConnectorName(connector);
      setConnectionAttempt({
        status: 'failed',
        connectorName,
        issueReason: inferConnectionIssueReason({
          connectorName,
          walletConnectEnabled: walletConnectEnabledRef.current,
          error,
        }),
        message: error.message,
        startedAt: null,
      });
    },
    onSuccess: (_data, { connector }) => {
      setConnectionAttempt({
        status: 'idle',
        connectorName: getRuntimeConnectorName(connector),
        issueReason: null,
        message: null,
        startedAt: null,
      });
    },
  });
  const { chain, setChain, isSettingChain } = useChain();
  const { logout: disconnectWallet, isLoggingOut } = useLogout();
  const walletSessionQuery = useWalletSession();
  const logoutWalletSession = useLogoutWalletSession();
  const simulateTransaction = useSimulateTransaction();
  const trackTransaction = useTrackTransaction();
  const walletVerification = useWalletVerification();

  const connectedWalletAddress = user?.address ?? null;
  const providerChainId = chain?.id ?? null;
  const walletSession = walletSessionQuery.data;
  const sessionWalletAddress = walletSession?.walletAddressNormalized ?? null;
  const normalizedConnectedWallet = normalizeWalletAddress(connectedWalletAddress);
  const normalizedSessionWallet = normalizeWalletAddress(sessionWalletAddress);
  const isWalletConnected = Boolean(signerStatus.isConnected && connectedWalletAddress);

  const walletSupportRegistry = useMemo(() => {
    const runtime = getWalletSupportRuntime();
    return buildWalletSupportRegistry({
      walletConnectEnabled: runtime.walletConnectEnabled,
    });
  }, []);
  const walletConnectEnabled = useMemo(
    () => getWalletConnectEntry(walletSupportRegistry)?.releaseTier === 'fallback',
    [walletSupportRegistry],
  );
  const walletConnectEnabledRef = useRef(walletConnectEnabled);
  walletConnectEnabledRef.current = walletConnectEnabled;

  const primaryWalletSupportCopy = useMemo(
    () => getPrimaryWalletSupportCopy(walletSupportRegistry),
    [walletSupportRegistry],
  );
  const walletSupportSummary = useMemo(
    () => getWalletSupportSummary(walletSupportRegistry),
    [walletSupportRegistry],
  );
  const approvedDirectWalletDisplayNames = useMemo(
    () => getApprovedDirectWalletDisplayNames(walletSupportRegistry),
    [walletSupportRegistry],
  );
  const walletConnectCompatibleDisplayNames = useMemo(
    () => getWalletConnectCompatibleDisplayNames(walletSupportRegistry),
    [walletSupportRegistry],
  );
  useWalletSessionSync({
    connectedWalletAddress,
    connectedSignerReference: signer,
    sessionWalletAddress,
    isWalletConnected,
  });

  const selectedAsset = supportedAssets.find(asset => asset.id === selectedAssetId) ?? null;
  const amountNumber = Number(amountDisplay);
  const estimatedContributionUsd = selectedAsset && Number.isFinite(amountNumber)
    ? amountNumber * selectedAsset.usdPrice
    : 0;
  const estimatedTokens = amountNumber > 0 && market.tokenPriceUsd > 0
    ? estimatedContributionUsd / market.tokenPriceUsd
    : 0;

  const isWalletVerified = Boolean(
    normalizedConnectedWallet
    && normalizedSessionWallet
    && normalizedConnectedWallet === normalizedSessionWallet,
  );
  const needsChainVerification = Boolean(
    isWalletVerified
    && selectedAsset
    && walletSession?.lastVerifiedChainId
    && walletSession.lastVerifiedChainId !== selectedAsset.chainId,
  );
  const providerChainMismatch = Boolean(
    isWalletConnected
    && selectedAsset
    && providerChainId
    && providerChainId !== selectedAsset.chainId,
  );
  const hasContributionOption = Boolean(selectedAsset);
  const latestExplorerUrl = selectedAsset
    ? getExplorerUrl(selectedAsset.chainId, lastSubmittedTxHash)
    : null;
  const verifiedChainLabel = getChainLabelFromId(walletSession?.lastVerifiedChainId ?? null);
  const selectedChainLabel = selectedAsset ? getChainLabel(selectedAsset.chain) : 'No chain selected';

  const walletStatusLabel = !isWalletConnected
    ? 'Not connected'
    : !isWalletVerified
        ? needsChainVerification
            ? 'Re-verify chain'
            : 'Verification required'
        : providerChainMismatch
            ? 'Switch network'
            : 'Verified';

  const resetContributionFlow = useEffectEvent(() => {
    setSubmissionState({ phase: 'idle' });
    setLastSubmittedTxHash(null);
    setManualChainSwitchHelp(null);
    simulateTransaction.reset();
    trackTransaction.reset();
  });

  const clearConnectionIssue = useEffectEvent(() => {
    setConnectionAttempt(current => current.status === 'failed'
      ? { status: 'idle', connectorName: null, issueReason: null, message: null, startedAt: null }
      : current);
  });

  useEffect(() => {
    if (isWalletConnected) {
      clearConnectionIssue();
    }
  }, [clearConnectionIssue, isWalletConnected]);

  useEffect(() => {
    if (!isWalletConnected) {
      walletVerification.reset();
      resetContributionFlow();
    }
  }, [isWalletConnected, resetContributionFlow, walletVerification]);

  useEffect(() => {
    if (connectionAttempt.status !== 'connecting' || connectWallet.isPending || isWalletConnected) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setConnectionAttempt(current => {
        if (current.status !== 'connecting') {
          return current;
        }

        const issueReason = current.connectorName === 'walletconnect'
          ? 'walletConnectCanceled'
          : 'walletConnectionFailed';

        return {
          status: 'failed',
          connectorName: current.connectorName,
          issueReason,
          message: current.connectorName === 'walletconnect'
            ? 'WalletConnect was closed before the connection finished.'
            : 'The selected wallet did not finish connecting.',
          startedAt: null,
        };
      });
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [connectWallet.isPending, connectionAttempt.status, isWalletConnected]);

  useEffect(() => {
    resetContributionFlow();
  }, [providerChainId, resetContributionFlow, selectedAsset?.chainId]);

  async function handleConnectByName(connectorName: string) {
    const normalizedConnectorName = normalizeConnectorName(connectorName);
    const connector = connectWallet.connectors.find(
      candidate => getRuntimeConnectorName(candidate) === normalizedConnectorName,
    );

    if (!connector) {
      setConnectionAttempt({
        status: 'failed',
        connectorName: normalizedConnectorName,
        issueReason: normalizedConnectorName === 'walletconnect' ? 'walletConnectUnavailable' : 'walletConnectionFailed',
        message: normalizedConnectorName === 'walletconnect'
          ? 'WalletConnect is not available right now.'
          : 'This wallet is not available in the current browser.',
        startedAt: null,
      });
      return;
    }

    walletVerification.reset();
    resetContributionFlow();
    connectWallet.connect({
      connector,
      chainId: selectedAsset?.chainId ?? SUPPORTED_NATIVE_CHAIN_CONFIG.BASE_SEPOLIA.chainId,
    });
  }

  async function handleVerifyWallet() {
    if (!signer || !selectedAsset) {
      return;
    }

    clearConnectionIssue();
    walletVerification.reset();
    await walletVerification.verifyWallet({
      signer,
      chainId: selectedAsset.chainId,
    });
  }

  async function handleSwitchNetwork() {
    if (!selectedAsset) {
      return;
    }

    try {
      setManualChainSwitchHelp(null);
      setChain({
        chain: SUPPORTED_NATIVE_CHAIN_CONFIG[selectedAsset.chain].chain,
      });
    } catch {
      setManualChainSwitchHelp(
        `Automatic switching was not available. Open the wallet and switch to ${selectedChainLabel}, then return here before submitting.`,
      );
    }
  }

  async function handleDisconnect() {
    disconnectWallet(undefined);
    logoutWalletSession.mutate(undefined);
    queryClient.removeQueries({ queryKey: ['wallet', 'transactions'] });
    queryClient.removeQueries({ queryKey: ['wallet-auth', 'session'] });
    walletVerification.reset();
    setConnectionAttempt({
      status: 'idle',
      connectorName: null,
      issueReason: null,
      message: null,
      startedAt: null,
    });
    resetContributionFlow();
  }

  async function handleRetryTracking() {
    if (submissionState.phase !== 'track-failed') {
      return;
    }

    setSubmissionState({
      phase: 'track-pending',
      simulationId: submissionState.simulationId,
      txHash: submissionState.txHash,
    });

    try {
      const tracked = await trackTransaction.mutateAsync({
        simulationId: submissionState.simulationId,
        txHash: submissionState.txHash,
      });

      queryClient.removeQueries({ queryKey: ['wallet', 'transactions'] });
      setSubmissionState({
        phase: 'receipt-ready',
        txHash: submissionState.txHash,
        publicId: tracked.publicId,
      });
      window.setTimeout(() => {
        window.location.assign(ROUTES.USER.transactionDetail(tracked.publicId));
      }, 120);
    } catch (error) {
      const details = extractAxiosError(error);
      setSubmissionState({
        phase: 'track-failed',
        simulationId: submissionState.simulationId,
        txHash: submissionState.txHash,
        message: details.message || 'Could not track the contribution receipt.',
      });
    }
  }

  async function handleSubmitContribution() {
    if (!signer || !selectedAsset) {
      return;
    }

    const amountBaseUnits = parseUnits(amountDisplay, selectedAsset.decimals).toString();

    clearConnectionIssue();
    resetContributionFlow();
    setSubmissionState({ phase: 'simulate-pending' });

    let simulationResult: Awaited<ReturnType<typeof simulateTransaction.mutateAsync>>;
    try {
      simulationResult = await simulateTransaction.mutateAsync({
        chainId: selectedAsset.chainId,
        assetType: 'native',
        assetCode: selectedAsset.code,
        assetDecimals: selectedAsset.decimals,
        amountBaseUnits,
        amountDisplay,
      });
    } catch (error) {
      const details = extractAxiosError(error);
      setSubmissionState({
        phase: 'simulate-failed',
        message: details.message || 'FlowDex could not validate this contribution request.',
      });
      return;
    }

    if (!simulationResult.allowed || !simulationResult.request || !simulationResult.simulationId) {
      setSubmissionState({
        phase: 'simulate-failed',
        message: simulationResult.reason ?? 'The contribution was blocked by the server-side simulation.',
      });
      return;
    }

    setSubmissionState({
      phase: 'send-pending',
      simulationId: simulationResult.simulationId,
    });

    let txHash: `0x${string}`;
    try {
      const account = await signer.getAddress();
      const publicClient = getPublicClient(selectedAsset.chainId);
      const preparedTransaction = await prepareContributionTransaction({
        account,
        chainId: selectedAsset.chainId,
        request: simulationResult.request,
      });
      const signedTransaction = await signer.signTransaction(preparedTransaction as Record<string, unknown>);
      txHash = await publicClient.sendRawTransaction({
        serializedTransaction: signedTransaction,
      });
    } catch (error) {
      const issuePhase = isUserRejectedError(error) ? 'send-canceled' : 'send-failed';
      setSubmissionState({
        phase: issuePhase,
        simulationId: simulationResult.simulationId,
        message: issuePhase === 'send-canceled'
          ? 'The wallet signature request was canceled before the transaction was broadcast.'
          : extractAxiosError(error).message || 'The transaction could not be broadcast from the connected wallet.',
      });
      return;
    }

    setLastSubmittedTxHash(txHash);
    setSubmissionState({
      phase: 'track-pending',
      simulationId: simulationResult.simulationId,
      txHash,
    });

    try {
      const tracked = await trackTransaction.mutateAsync({
        simulationId: simulationResult.simulationId,
        txHash,
      });

      queryClient.removeQueries({ queryKey: ['wallet', 'transactions'] });
      setSubmissionState({
        phase: 'receipt-ready',
        txHash,
        publicId: tracked.publicId,
      });
      window.setTimeout(() => {
        window.location.assign(ROUTES.USER.transactionDetail(tracked.publicId));
      }, 120);
    } catch (error) {
      const details = extractAxiosError(error);
      setSubmissionState({
        phase: 'track-failed',
        simulationId: simulationResult.simulationId,
        txHash,
        message: details.message || 'The transaction was sent, but the receipt could not be created yet.',
      });
    }
  }

  const connectionState: BuyConnectionState = isWalletConnected
    ? 'connected'
    : connectWallet.isPending || connectionAttempt.status === 'connecting'
        ? 'connecting'
        : connectionAttempt.status === 'failed'
            ? 'failed'
            : 'disconnected';

  const verificationErrorMessage = walletVerification.error
    ? extractAxiosError(walletVerification.error).message || walletVerification.error.message
    : null;
  const verificationState = walletSessionQuery.isLoading && isWalletConnected
    ? 'checking'
    : isWalletConnected && normalizedConnectedWallet && normalizedSessionWallet && normalizedConnectedWallet !== normalizedSessionWallet
        ? 'mismatch'
        : walletVerification.isPending
            ? 'verifying'
            : verificationErrorMessage
                ? 'failed'
                : !isWalletVerified || needsChainVerification
                    ? 'unverified'
                    : 'verified';

  const networkState = isSettingChain
    ? 'switch-pending'
    : providerChainMismatch && manualChainSwitchHelp
        ? 'switch-failed-manual'
        : providerChainMismatch
            ? 'wrong'
            : 'correct';

  const contributionState = !hasContributionOption
    ? 'no-valid-option'
    : submissionState.phase;

  const issueReason = connectionState === 'failed'
    ? connectionAttempt.issueReason
    : verificationState === 'failed'
      ? 'verificationFailed'
      : verificationState === 'mismatch'
        ? 'sessionWalletMismatch'
        : networkState === 'switch-failed-manual'
          ? 'chainSwitchFailed'
          : networkState === 'wrong'
            ? 'wrongChain'
            : contributionState === 'no-valid-option'
              ? 'noValidContributionOption'
              : contributionState === 'simulate-failed'
                ? 'simulateFailed'
                : contributionState === 'send-canceled'
                  ? 'sendCanceled'
                  : contributionState === 'send-failed'
                    ? 'sendFailed'
                    : contributionState === 'track-failed'
                      ? 'trackFailed'
                      : null;

  const viewModel = buildBuyViewModel({
    connectionState,
    verificationState,
    networkState,
    contributionState,
    issueReason,
    primaryWalletSupportCopy,
    selectedAssetCode: selectedAsset?.code ?? null,
    selectedChainLabel,
    walletConnectEnabled,
    needsChainVerification,
    manualChainSwitchHelp,
    connectedWalletAddress,
    sessionWalletAddress,
    contributionErrorMessage: connectionAttempt.message
      ?? verificationErrorMessage
      ?? getSubmissionErrorMessage(submissionState)
      ?? null,
  } satisfies BuyViewModelInput);

  const canSubmit = Boolean(
    selectedAsset
    && signer
    && isWalletVerified
    && !needsChainVerification
    && !providerChainMismatch
    && amountDisplay
    && Number.isFinite(amountNumber)
    && amountNumber > 0
    && amountNumber >= selectedAsset.minAmount
    && submissionState.phase === 'idle',
  );

  const connectorMap = useMemo(() => {
    return new Map(
      connectWallet.connectors.map(connector => [getRuntimeConnectorName(connector), connector]),
    );
  }, [connectWallet.connectors]);

  const walletButtons = useMemo<WalletTrayButtonModel[]>(() => {
    return getBuyWalletPickerEntries(walletSupportRegistry).map(entry => {
      const normalized = normalizeConnectorName(entry.accountKitName);
      const connector = connectorMap.get(normalized);

      return {
        id: entry.id,
        label: entry.displayName,
        caption: entry.releaseTier === 'fallback'
          ? 'Open WalletConnect to choose another supported wallet.'
          : 'Connect here and continue to checkout.',
        mode: entry.releaseTier === 'fallback' ? 'fallback' : 'direct',
        busy: connectionState === 'connecting' && connectionAttempt.connectorName === normalized,
        disabled: !connector || connectionState === 'connecting',
        onClick: () => handleConnectByName(normalized),
      };
    });
  }, [connectionAttempt.connectorName, connectionState, connectorMap, walletSupportRegistry]);

  const primaryActionDisabled = viewModel.dominantActionId === 'verifyWallet'
    ? !selectedAsset || !signer || walletVerification.isPending
    : viewModel.dominantActionId === 'switchNetwork'
      ? !selectedAsset || isSettingChain
      : viewModel.dominantActionId === 'submitContribution'
        ? !canSubmit
        : viewModel.dominantActionId === 'retryTracking'
          ? submissionState.phase !== 'track-failed'
          : viewModel.dominantActionId === 'retryConnection'
            ? !connectionAttempt.connectorName || connectionState === 'connecting'
            : true;

  const secondaryActionDisabled = viewModel.secondaryActionId === 'disconnectWallet'
    ? isLoggingOut || logoutWalletSession.isPending
    : false;

  const actionHandlers: Partial<Record<NonNullable<typeof viewModel.dominantActionId | typeof viewModel.secondaryActionId>, () => void | Promise<void>>> = {
    verifyWallet: handleVerifyWallet,
    switchNetwork: handleSwitchNetwork,
    submitContribution: handleSubmitContribution,
    retryTracking: handleRetryTracking,
    retryConnection: () => {
      const connectorName = connectionAttempt.connectorName ?? (walletConnectEnabled ? 'walletconnect' : 'metamask');
      return handleConnectByName(connectorName);
    },
    viewReceipts: () => {
      window.location.assign(ROUTES.USER.TRANSACTIONS);
    },
    disconnectWallet: handleDisconnect,
  };

  const handleAction = (actionId: typeof viewModel.dominantActionId | typeof viewModel.secondaryActionId) => {
    if (!actionId) {
      return;
    }

    void actionHandlers[actionId]?.();
  };

  return (
    <WalletBuyShell
      viewModel={viewModel}
      walletStatusLabel={walletStatusLabel}
      connectedWalletAddress={connectedWalletAddress}
      sessionWalletChecksum={walletSession?.walletAddressChecksum ?? null}
      verifiedChainLabel={verifiedChainLabel}
      selectedChainLabel={selectedChainLabel}
      selectedAsset={selectedAsset}
      supportedAssets={supportedAssets}
      selectedAssetId={selectedAssetId}
      onAssetChange={(value) => {
        setSelectedAssetId(value);
        walletVerification.reset();
        resetContributionFlow();
      }}
      amountDisplay={amountDisplay}
      onAmountChange={(value) => {
        setAmountDisplay(value);
        if (submissionState.phase !== 'idle') {
          setSubmissionState({ phase: 'idle' });
        }
        setLastSubmittedTxHash(null);
      }}
      contributionEnabled={Boolean(isWalletConnected && selectedAsset)}
      estimatedContributionUsdDisplay={estimatedContributionUsd > 0 ? formatCurrency(estimatedContributionUsd, 2) : '$0.00'}
      estimatedTokensDisplay={estimatedTokens > 0 ? formatUnits(parseUnits(estimatedTokens.toFixed(6), 6), 6) : '0'}
      latestExplorerUrl={latestExplorerUrl}
      walletSupportSummary={walletSupportSummary}
      approvedDirectWalletDisplayNames={approvedDirectWalletDisplayNames}
      walletConnectCompatibleDisplayNames={walletConnectCompatibleDisplayNames}
      walletConnectEnabled={walletConnectEnabled}
      walletButtons={walletButtons}
      primaryActionDisabled={primaryActionDisabled}
      secondaryActionDisabled={secondaryActionDisabled}
      onAction={handleAction}
      currentTier={market.currentTier}
      tokenPriceDisplay={formatCurrency(market.tokenPriceUsd, 4)}
      raisedDisplay={formatCurrency(market.fundsRaisedUsd, 0)}
      raisedProgressPercent={market.raisedProgressPercent}
      sourceUpdatedAt={market.sourceUpdatedAt}
      listingReferenceDisplay={formatCurrency(market.listingReferenceUsd, 2)}
    />
  );
}
