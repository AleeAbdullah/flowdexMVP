import type {
  BuyActionId,
  BuyContributionState,
  BuyInlineAlert,
  BuyIssueReason,
  BuyUiTone,
  BuyViewModel,
  BuyViewModelInput,
} from '../types/buy-view-model';

function createAlert(
  id: string,
  title: string,
  description: string,
  tone: BuyUiTone,
): BuyInlineAlert {
  return {
    id,
    title,
    description,
    tone,
  };
}

function getContributionFailureAlert(
  issueReason: BuyIssueReason,
  message: string | null,
): BuyInlineAlert {
  const fallbackMessage = message ?? 'Adjust the contribution inputs and try again.';

  switch (issueReason) {
    case 'simulateFailed':
      return createAlert(
        'simulate-failed',
        'Couldn’t prepare the order',
        fallbackMessage,
        'danger',
      );
    case 'sendCanceled':
      return createAlert(
        'send-canceled',
        'Transaction canceled',
        'No funds moved. You can try again whenever you’re ready.',
        'warning',
      );
    case 'sendFailed':
      return createAlert(
        'send-failed',
        'Couldn’t send the transaction',
        fallbackMessage,
        'danger',
      );
    case 'trackFailed':
      return createAlert(
        'track-failed',
        'Couldn’t load the receipt',
        fallbackMessage,
        'danger',
      );
    default:
      return createAlert(
        'contribution-failed',
        'Something needs attention',
        fallbackMessage,
        'danger',
      );
  }
}

function getContributionPendingState(
  contributionState: BuyContributionState,
): Pick<BuyViewModel, 'title' | 'description' | 'status'> {
  switch (contributionState) {
    case 'simulate-pending':
      return {
        title: 'Preparing order',
        description: 'Checking the amount and getting the transaction ready.',
        status: 'PREPARING',
      };
    case 'send-pending':
      return {
        title: 'Confirm in wallet',
        description: 'Approve the transaction in your wallet to continue.',
        status: 'SIGN',
      };
    case 'track-pending':
      return {
        title: 'Finishing up',
        description: 'Your transaction was sent. We’re creating the receipt now.',
        status: 'TRACKING',
      };
    default:
      return {
        title: 'Processing purchase',
        description: 'Your purchase is moving through confirmation and receipt creation.',
        status: 'SUBMITTING',
      };
  }
}

export function normalizeWalletAddress(address: string | null | undefined) {
  return address?.trim().toLowerCase() ?? null;
}

export function isUserRejectedError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lowered = message.toLowerCase();
  return lowered.includes('rejected')
    || lowered.includes('cancel')
    || lowered.includes('closed modal')
    || lowered.includes('denied')
    || lowered.includes('declined');
}

export function inferConnectionIssueReason(input: {
  connectorName: string;
  walletConnectEnabled: boolean;
  error: unknown;
}): BuyIssueReason {
  const connectorName = input.connectorName.trim().toLowerCase();
  if (connectorName === 'walletconnect' || connectorName === 'wallet_connect') {
    if (!input.walletConnectEnabled) {
      return 'walletConnectUnavailable';
    }

    return isUserRejectedError(input.error)
      ? 'walletConnectCanceled'
      : 'walletConnectionFailed';
  }

  return 'walletConnectionFailed';
}

export function buildBuyViewModel(input: BuyViewModelInput): BuyViewModel {
  const dominantAction = (
    id: BuyActionId | null,
    label: string | null,
  ) => ({
    dominantActionId: id,
    dominantActionLabel: label,
  });

  const secondaryAction = (
    id: BuyActionId | null,
    label: string | null,
  ) => ({
    secondaryActionId: id,
    secondaryActionLabel: label,
  });

  if (input.verificationState === 'checking') {
    return {
      step: 'connectWallet',
      issueReason: null,
      tone: 'info',
      status: 'CHECKING',
      title: 'Getting things ready',
      description: 'Checking your wallet status.',
      alerts: [],
      showWalletTray: false,
      showContributionForm: false,
      showContributionPlaceholder: true,
      showSupportDisclosure: false,
      isBusy: true,
      ...dominantAction(null, null),
      ...secondaryAction(null, null),
    };
  }

  if (input.connectionState === 'disconnected') {
    return {
      step: 'connectWallet',
      issueReason: input.issueReason,
      tone: input.issueReason ? 'warning' : 'default',
      status: input.issueReason ? 'ATTENTION' : 'PENDING',
      title: input.issueReason === 'walletConnectCanceled'
        ? 'Connection canceled'
        : 'Connect wallet',
      description: input.issueReason === 'walletConnectCanceled'
        ? 'Choose a wallet to continue.'
        : input.primaryWalletSupportCopy,
      alerts: input.issueReason === 'walletConnectCanceled'
        ? [
            createAlert(
              'walletconnect-canceled',
              'Connection canceled',
              'The wallet picker closed before the connection finished.',
              'warning',
            ),
          ]
        : [],
      showWalletTray: true,
      showContributionForm: false,
      showContributionPlaceholder: true,
      showSupportDisclosure: true,
      isBusy: false,
      ...dominantAction(null, null),
      ...secondaryAction(null, null),
    };
  }

  if (input.connectionState === 'failed') {
    const isWalletConnectIssue = input.issueReason === 'walletConnectCanceled'
      || input.issueReason === 'walletConnectUnavailable'
      || input.issueReason === 'walletConnectionFailed';

    return {
      step: 'recoverFromIssue',
      issueReason: input.issueReason,
      tone: input.issueReason === 'walletConnectCanceled' ? 'warning' : 'danger',
      status: input.issueReason === 'walletConnectCanceled' ? 'CANCELED' : 'FAILED',
      title: input.issueReason === 'walletConnectUnavailable'
        ? 'WalletConnect unavailable'
        : input.issueReason === 'walletConnectCanceled'
          ? 'Connection canceled'
          : 'Couldn’t connect wallet',
      description: input.issueReason === 'walletConnectUnavailable'
        ? 'Use MetaMask or Coinbase Wallet to continue.'
        : input.issueReason === 'walletConnectCanceled'
          ? 'Choose a wallet to continue.'
          : 'Try again or choose another wallet.',
      alerts: [
        createAlert(
          'connection-failed',
          input.issueReason === 'walletConnectCanceled' ? 'Connection canceled' : 'Connection issue',
          input.contributionErrorMessage
            ?? (
              isWalletConnectIssue
                ? 'The wallet picker closed before a connection was established.'
                : 'The selected wallet did not finish the connection request.'
            ),
          input.issueReason === 'walletConnectCanceled' ? 'warning' : 'danger',
        ),
      ],
      showWalletTray: true,
      showContributionForm: false,
      showContributionPlaceholder: true,
      showSupportDisclosure: true,
      isBusy: false,
      ...dominantAction(
        input.issueReason === 'walletConnectUnavailable' ? null : 'retryConnection',
        input.issueReason === 'walletConnectUnavailable' ? null : 'Try again',
      ),
      ...secondaryAction(null, null),
    };
  }

  if (input.connectionState === 'connecting') {
    return {
      step: 'connectWallet',
      issueReason: null,
      tone: 'info',
      status: 'CONNECTING',
      title: 'Open your wallet',
      description: 'Approve the connection to continue.',
      alerts: [],
      showWalletTray: true,
      showContributionForm: false,
      showContributionPlaceholder: true,
      showSupportDisclosure: true,
      isBusy: true,
      ...dominantAction(null, null),
      ...secondaryAction(null, null),
    };
  }

  if (input.verificationState === 'mismatch') {
    return {
      step: 'recoverFromIssue',
      issueReason: 'sessionWalletMismatch',
      tone: 'danger',
      status: 'MISMATCH',
      title: 'Verify this wallet',
      description: 'The connected wallet is different from the one currently in use.',
      alerts: [
        createAlert(
          'wallet-mismatch',
          'Wallet changed',
          'Reconnect or verify this wallet to keep going.',
          'danger',
        ),
      ],
      showWalletTray: false,
      showContributionForm: true,
      showContributionPlaceholder: false,
      showSupportDisclosure: false,
      isBusy: false,
      ...dominantAction('verifyWallet', 'Verify wallet'),
      ...secondaryAction('disconnectWallet', 'Disconnect wallet'),
    };
  }

  if (input.verificationState === 'failed') {
    return {
      step: 'recoverFromIssue',
      issueReason: 'verificationFailed',
      tone: 'danger',
      status: 'FAILED',
      title: 'Couldn’t verify wallet',
      description: 'Try again to continue.',
      alerts: [
        createAlert(
          'verify-failed',
          'Verification failed',
          input.contributionErrorMessage ?? 'We couldn’t confirm the signature from this wallet.',
          'danger',
        ),
      ],
      showWalletTray: false,
      showContributionForm: true,
      showContributionPlaceholder: false,
      showSupportDisclosure: false,
      isBusy: false,
      ...dominantAction('verifyWallet', 'Retry verification'),
      ...secondaryAction('disconnectWallet', 'Disconnect wallet'),
    };
  }

  if (input.verificationState === 'verifying') {
    return {
      step: 'verifyWallet',
      issueReason: null,
      tone: 'info',
      status: 'VERIFYING',
      title: input.needsChainVerification ? 'Verifying network' : 'Verifying wallet',
      description: input.needsChainVerification
        ? `Approve the check for ${input.selectedChainLabel} to continue.`
        : 'Approve the verification request in your wallet. No funds move during this step.',
      alerts: [],
      showWalletTray: false,
      showContributionForm: true,
      showContributionPlaceholder: false,
      showSupportDisclosure: false,
      isBusy: true,
      ...dominantAction(null, null),
      ...secondaryAction('disconnectWallet', 'Disconnect wallet'),
    };
  }

  if (input.verificationState === 'unverified') {
    return {
      step: 'verifyWallet',
      issueReason: null,
      tone: 'warning',
      status: 'VERIFY',
      title: input.needsChainVerification ? 'Verify network' : 'Verify wallet',
      description: input.needsChainVerification
        ? `Verify on ${input.selectedChainLabel} to continue.`
        : 'Approve a quick signature to continue.',
      alerts: [],
      showWalletTray: false,
      showContributionForm: true,
      showContributionPlaceholder: false,
      showSupportDisclosure: false,
      isBusy: false,
      ...dominantAction('verifyWallet', input.needsChainVerification ? 'Verify network' : 'Verify wallet'),
      ...secondaryAction('disconnectWallet', 'Disconnect wallet'),
    };
  }

  if (input.networkState === 'switch-pending') {
    return {
      step: 'switchNetwork',
      issueReason: 'wrongChain',
      tone: 'warning',
      status: 'SWITCHING',
      title: 'Switching network',
      description: `Keep your wallet open while it switches to ${input.selectedChainLabel}.`,
      alerts: [],
      showWalletTray: false,
      showContributionForm: true,
      showContributionPlaceholder: false,
      showSupportDisclosure: false,
      isBusy: true,
      ...dominantAction(null, null),
      ...secondaryAction('disconnectWallet', 'Disconnect wallet'),
    };
  }

  if (input.networkState === 'switch-failed-manual') {
    return {
      step: 'recoverFromIssue',
      issueReason: 'chainSwitchFailed',
      tone: 'warning',
      status: 'ACTION NEEDED',
      title: 'Switch network manually',
      description: `Open your wallet, switch to ${input.selectedChainLabel}, then come back here.`,
      alerts: [
        createAlert(
          'manual-chain-switch',
          'Manual network change required',
          input.manualChainSwitchHelp ?? `Switch to ${input.selectedChainLabel} in your wallet before you continue.`,
          'warning',
        ),
      ],
      showWalletTray: false,
      showContributionForm: true,
      showContributionPlaceholder: false,
      showSupportDisclosure: false,
      isBusy: false,
      ...dominantAction('switchNetwork', `Switch to ${input.selectedChainLabel}`),
      ...secondaryAction('disconnectWallet', 'Disconnect wallet'),
    };
  }

  if (input.networkState === 'wrong') {
    return {
      step: 'switchNetwork',
      issueReason: 'wrongChain',
      tone: 'warning',
      status: 'WRONG CHAIN',
      title: 'Switch network',
      description: `Switch to ${input.selectedChainLabel} to continue.`,
      alerts: [
        createAlert(
          'wrong-chain',
          'Wrong network',
          `Switch to ${input.selectedChainLabel} before continuing.`,
          'warning',
        ),
      ],
      showWalletTray: false,
      showContributionForm: true,
      showContributionPlaceholder: false,
      showSupportDisclosure: false,
      isBusy: false,
      ...dominantAction('switchNetwork', `Switch to ${input.selectedChainLabel}`),
      ...secondaryAction('disconnectWallet', 'Disconnect wallet'),
    };
  }

  if (input.contributionState === 'no-valid-option') {
    return {
      step: 'recoverFromIssue',
      issueReason: 'noValidContributionOption',
      tone: 'warning',
      status: 'UNAVAILABLE',
      title: 'Unavailable right now',
      description: 'This payment route is not available at the moment.',
      alerts: [
        createAlert(
          'no-valid-option',
          'This option is unavailable',
          'Try another asset or come back in a moment.',
          'warning',
        ),
      ],
      showWalletTray: false,
      showContributionForm: true,
      showContributionPlaceholder: false,
      showSupportDisclosure: false,
      isBusy: false,
      ...dominantAction(null, null),
      ...secondaryAction('viewReceipts', 'View receipts'),
    };
  }

  if (
    input.contributionState === 'simulate-pending'
    || input.contributionState === 'send-pending'
    || input.contributionState === 'track-pending'
  ) {
    const pendingState = getContributionPendingState(input.contributionState);
    return {
      step: 'submittingContribution',
      issueReason: null,
      tone: 'info',
      status: pendingState.status,
      title: pendingState.title,
      description: pendingState.description,
      alerts: [],
      showWalletTray: false,
      showContributionForm: true,
      showContributionPlaceholder: false,
      showSupportDisclosure: false,
      isBusy: true,
      ...dominantAction(null, null),
      ...secondaryAction('viewReceipts', 'View receipts'),
    };
  }

  if (
    input.contributionState === 'simulate-failed'
    || input.contributionState === 'send-canceled'
    || input.contributionState === 'send-failed'
    || input.contributionState === 'track-failed'
  ) {
    const issueReason = (
      input.contributionState === 'simulate-failed'
        ? 'simulateFailed'
        : input.contributionState === 'send-canceled'
          ? 'sendCanceled'
          : input.contributionState === 'send-failed'
            ? 'sendFailed'
            : 'trackFailed'
    ) satisfies BuyIssueReason;

    return {
      step: 'recoverFromIssue',
      issueReason,
      tone: issueReason === 'sendCanceled' ? 'warning' : 'danger',
      status: issueReason === 'sendCanceled' ? 'CANCELED' : 'FAILED',
      title: issueReason === 'trackFailed'
        ? 'Receipt delayed'
        : issueReason === 'sendCanceled'
          ? 'Transaction canceled'
          : 'Something went wrong',
      description: issueReason === 'trackFailed'
        ? 'Your transaction may still complete. Try loading the receipt again.'
        : issueReason === 'sendCanceled'
          ? 'No funds moved. You can try again whenever you’re ready.'
          : 'Check the details and try again.',
      alerts: [getContributionFailureAlert(issueReason, input.contributionErrorMessage)],
      showWalletTray: false,
      showContributionForm: true,
      showContributionPlaceholder: false,
      showSupportDisclosure: false,
      isBusy: false,
      ...dominantAction(
        issueReason === 'trackFailed' ? 'retryTracking' : 'submitContribution',
        issueReason === 'trackFailed' ? 'Try again' : 'Try again',
      ),
      ...secondaryAction('viewReceipts', 'View receipts'),
    };
  }

  if (input.contributionState === 'receipt-ready') {
    return {
      step: 'receiptReady',
      issueReason: null,
      tone: 'success',
      status: 'RECEIPT READY',
      title: 'Opening receipt',
      description: 'Your purchase was submitted successfully.',
      alerts: [],
      showWalletTray: false,
      showContributionForm: true,
      showContributionPlaceholder: false,
      showSupportDisclosure: false,
      isBusy: true,
      ...dominantAction(null, null),
      ...secondaryAction('viewReceipts', 'View receipts'),
    };
  }

  return {
    step: 'readyToContribute',
    issueReason: null,
    tone: 'success',
    status: 'READY',
    title: 'Review order',
    description: `Check the amount, review the estimate, and complete your purchase on ${input.selectedChainLabel}.`,
    alerts: [],
    showWalletTray: false,
    showContributionForm: true,
    showContributionPlaceholder: false,
    showSupportDisclosure: false,
    isBusy: false,
    ...dominantAction('submitContribution', input.selectedAssetCode ? `Complete purchase` : 'Complete purchase'),
    ...secondaryAction('viewReceipts', 'View receipts'),
  };
}
