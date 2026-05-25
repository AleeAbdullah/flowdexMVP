import type {
  BuyActionId,
  BuyInlineAlert,
  BuyIssueReason,
  BuySubmissionState,
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

function createActions(
  dominantActionId: BuyActionId | null,
  dominantActionLabel: string | null,
  secondaryActionId: BuyActionId | null,
  secondaryActionLabel: string | null,
) {
  return {
    dominantActionId,
    dominantActionLabel,
    secondaryActionId,
    secondaryActionLabel,
  };
}

function getSubmittingCopy(submissionState: BuySubmissionState) {
  switch (submissionState) {
    case 'simulating':
      return {
        status: 'PREPARING',
        title: 'Preparing order',
        description: 'Checking the amount and getting the transaction ready.',
      };
    case 'awaiting_wallet_approval':
      return {
        status: 'SIGN',
        title: 'Confirm in wallet',
        description: 'Approve the transaction in your wallet to continue.',
      };
    case 'tracking':
      return {
        status: 'TRACKING',
        title: 'Finishing up',
        description: 'Your transaction was sent. We’re creating the receipt now.',
      };
    default:
      return {
        status: 'SUBMITTING',
        title: 'Processing purchase',
        description: 'Your purchase is moving through confirmation and receipt creation.',
      };
  }
}

function getFailureAlert(
  issueReason: BuyIssueReason | null,
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
    case 'verificationFailed':
      return createAlert(
        'verification-failed',
        'Verification failed',
        fallbackMessage,
        'danger',
      );
    case 'wrongChain':
      return createAlert(
        'wrong-chain',
        'Wrong network',
        `Switch to ${fallbackMessage} before continuing.`,
        'warning',
      );
    case 'unsupportedWallet':
      return createAlert(
        'unsupported-wallet',
        'Wallet unsupported',
        fallbackMessage,
        'danger',
      );
    case 'connectionCanceled':
      return createAlert(
        'connection-canceled',
        'Connection canceled',
        fallbackMessage,
        'warning',
      );
    default:
      return createAlert(
        'buy-flow-failed',
        'Something needs attention',
        fallbackMessage,
        'danger',
      );
  }
}

export function normalizeWalletAddress(address: string | null | undefined) {
  return address?.trim().toLowerCase() ?? null;
}

export function buildBuyViewModel(input: BuyViewModelInput): BuyViewModel {
  if (input.flowState === 'checking_wallet') {
    return {
      state: 'checking_wallet',
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
      ...createActions(null, null, null, null),
    };
  }

  if (input.flowState === 'disconnected') {
    const isCanceled = input.issueReason === 'connectionCanceled';
    const isConnectionFailure = input.issueReason === 'connectionFailed';
    return {
      state: 'disconnected',
      issueReason: input.issueReason,
      tone: isCanceled ? 'warning' : isConnectionFailure ? 'danger' : 'default',
      status: isCanceled ? 'CANCELED' : isConnectionFailure ? 'FAILED' : 'PENDING',
      title: isCanceled ? 'Connection canceled' : isConnectionFailure ? 'Couldn’t connect wallet' : 'Connect wallet',
      description: isCanceled
        ? 'Choose a wallet to continue.'
        : isConnectionFailure
          ? 'Try again or choose another wallet.'
          : input.primaryWalletSupportCopy,
      alerts: input.issueReason
        ? [getFailureAlert(input.issueReason, input.contributionErrorMessage)]
        : [],
      showWalletTray: true,
      showContributionForm: false,
      showContributionPlaceholder: true,
      showSupportDisclosure: true,
      isBusy: false,
      ...createActions(null, null, null, null),
    };
  }

  if (input.flowState === 'unsupported_wallet') {
    return {
      state: 'unsupported_wallet',
      issueReason: 'unsupportedWallet',
      tone: 'danger',
      status: 'UNSUPPORTED',
      title: 'This wallet can’t use checkout',
      description: 'Disconnect and choose a compatible wallet to continue.',
      alerts: [getFailureAlert('unsupportedWallet', input.contributionErrorMessage)],
      showWalletTray: false,
      showContributionForm: false,
      showContributionPlaceholder: true,
      showSupportDisclosure: false,
      isBusy: false,
      ...createActions(null, null, 'disconnectWallet', 'Disconnect wallet'),
    };
  }

  if (input.flowState === 'unverified') {
    return {
      state: 'unverified',
      issueReason: input.issueReason,
      tone: input.issueReason === 'verificationFailed' ? 'danger' : 'warning',
      status: input.issueReason === 'verificationFailed' ? 'FAILED' : 'VERIFY',
      title: input.issueReason === 'verificationFailed' ? 'Couldn’t verify wallet' : 'Verify wallet',
      description: input.issueReason === 'verificationFailed'
        ? 'Try again to continue.'
        : 'Approve a quick signature to continue. No funds move during this step.',
      alerts: input.issueReason === 'verificationFailed'
        ? [getFailureAlert('verificationFailed', input.contributionErrorMessage)]
        : [],
      showWalletTray: false,
      showContributionForm: true,
      showContributionPlaceholder: false,
      showSupportDisclosure: false,
      isBusy: false,
      ...createActions('verifyWallet', input.issueReason === 'verificationFailed' ? 'Retry verification' : 'Verify wallet', 'disconnectWallet', 'Disconnect wallet'),
    };
  }

  if (input.flowState === 'wrong_chain') {
    return {
      state: 'wrong_chain',
      issueReason: 'wrongChain',
      tone: 'warning',
      status: 'WRONG CHAIN',
      title: 'Switch network',
      description: `Your wallet network and selected chain are different. Switch to ${input.selectedChainLabel} to continue.`,
      alerts: [
        createAlert(
          'wrong-chain',
          'Wrong network',
          `The wallet can only complete this purchase after it is on ${input.selectedChainLabel}.`,
          'warning',
        ),
      ],
      showWalletTray: false,
      showContributionForm: true,
      showContributionPlaceholder: false,
      showSupportDisclosure: false,
      isBusy: false,
      ...createActions('switchNetwork', `Switch to ${input.selectedChainLabel}`, 'disconnectWallet', 'Disconnect wallet'),
    };
  }

  if (input.flowState === 'submitting') {
    const submittingCopy = getSubmittingCopy(input.submissionState);
    return {
      state: 'submitting',
      issueReason: null,
      tone: 'info',
      status: submittingCopy.status,
      title: submittingCopy.title,
      description: submittingCopy.description,
      alerts: [],
      showWalletTray: false,
      showContributionForm: true,
      showContributionPlaceholder: false,
      showSupportDisclosure: false,
      isBusy: true,
      ...createActions(null, null, 'viewReceipts', 'View receipts'),
    };
  }

  if (input.flowState === 'success') {
    return {
      state: 'success',
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
      ...createActions(null, null, 'viewReceipts', 'View receipts'),
    };
  }

  if (input.flowState === 'failed') {
    const retryAction = input.issueReason === 'trackFailed' ? 'retryTracking' : 'submitContribution';

    return {
      state: 'failed',
      issueReason: input.issueReason,
      tone: input.issueReason === 'sendCanceled' ? 'warning' : 'danger',
      status: input.issueReason === 'sendCanceled' ? 'CANCELED' : 'FAILED',
      title: input.issueReason === 'trackFailed'
        ? 'Receipt delayed'
        : input.issueReason === 'sendCanceled'
          ? 'Transaction canceled'
          : 'Something went wrong',
      description: input.issueReason === 'trackFailed'
        ? 'Your transaction may still complete. Try loading the receipt again.'
        : input.issueReason === 'sendCanceled'
          ? 'No funds moved. You can try again whenever you’re ready.'
          : 'Check the details and try again.',
      alerts: [getFailureAlert(input.issueReason, input.contributionErrorMessage)],
      showWalletTray: false,
      showContributionForm: true,
      showContributionPlaceholder: false,
      showSupportDisclosure: false,
      isBusy: false,
      ...createActions(retryAction, 'Try again', 'viewReceipts', 'View receipts'),
    };
  }

  return {
    state: 'ready',
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
    ...createActions('submitContribution', input.selectedAssetCode ? 'Complete purchase' : 'Complete purchase', 'viewReceipts', 'View receipts'),
  };
}
