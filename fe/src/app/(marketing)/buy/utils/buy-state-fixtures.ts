import type { BuyViewModelInput, SupportedAssetOption } from '../types/buy-view-model';

export type BuyFixtureId =
  | 'disconnected'
  | 'connection-failed'
  | 'connection-canceled'
  | 'checking-wallet'
  | 'verify-wallet'
  | 'verify-failed'
  | 'wrong-chain'
  | 'unsupported-wallet'
  | 'simulate-pending'
  | 'simulate-failed'
  | 'send-pending'
  | 'send-canceled'
  | 'send-failed'
  | 'track-pending'
  | 'track-failed'
  | 'receipt-ready';

export type BuyFixtureDefinition = {
  id: BuyFixtureId;
  label: string;
  description: string;
  walletStatusLabel: string;
  connectedWalletAddress: string | null;
  sessionWalletChecksum: string | null;
  verifiedChainLabel: string | null;
  selectedAsset: SupportedAssetOption | null;
  amountDisplay: string;
  estimatedContributionUsdDisplay: string;
  estimatedTokensDisplay: string;
  latestExplorerUrl: string | null;
  contributionEnabled: boolean;
  walletConnectEnabled: boolean;
  input: BuyViewModelInput;
};

const baseAsset: SupportedAssetOption = {
  id: 'ETH:BASE_SEPOLIA',
  code: 'ETH',
  label: 'Ethereum',
  chain: 'BASE_SEPOLIA',
  chainId: 84532,
  decimals: 18,
  minAmount: 0.01,
  usdPrice: 2500,
  minConfirmations: 2,
};

const baseAddresses = {
  connected: '0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db',
  sessionChecksum: '0x4b0897b0513FdC7C541B6d9D7E929C4E5364D2dB',
} as const;

function baseInput(): BuyViewModelInput {
  return {
    flowState: 'ready',
    submissionState: 'idle',
    issueReason: null,
    primaryWalletSupportCopy: 'Choose a wallet to continue.',
    selectedAssetCode: baseAsset.code,
    selectedChainLabel: 'Base Sepolia',
    contributionErrorMessage: null,
  };
}

type BuyFixtureOverrides = Omit<Partial<BuyFixtureDefinition>, 'input'> & {
  input?: Partial<BuyViewModelInput>;
};

function createFixture(id: BuyFixtureId, overrides: BuyFixtureOverrides): BuyFixtureDefinition {
  const input = {
    ...baseInput(),
    ...overrides.input,
  };

  return {
    id,
    label: overrides.label ?? id,
    description: overrides.description ?? '',
    walletStatusLabel: overrides.walletStatusLabel ?? 'Verified',
    connectedWalletAddress: overrides.connectedWalletAddress !== undefined
      ? overrides.connectedWalletAddress
      : baseAddresses.connected,
    sessionWalletChecksum: overrides.sessionWalletChecksum !== undefined
      ? overrides.sessionWalletChecksum
      : baseAddresses.sessionChecksum,
    verifiedChainLabel: overrides.verifiedChainLabel !== undefined
      ? overrides.verifiedChainLabel
      : 'Base Sepolia',
    selectedAsset: overrides.selectedAsset === undefined ? baseAsset : overrides.selectedAsset,
    amountDisplay: overrides.amountDisplay ?? '0.25',
    estimatedContributionUsdDisplay: overrides.estimatedContributionUsdDisplay ?? '$625.00',
    estimatedTokensDisplay: overrides.estimatedTokensDisplay ?? '625000',
    latestExplorerUrl: overrides.latestExplorerUrl !== undefined ? overrides.latestExplorerUrl : null,
    contributionEnabled: overrides.contributionEnabled ?? true,
    walletConnectEnabled: overrides.walletConnectEnabled ?? true,
    input,
  };
}

export const buyStateFixtures: BuyFixtureDefinition[] = [
  createFixture('disconnected', {
    label: 'Disconnected',
    description: 'Default retail entry state with wallet tray visible.',
    walletStatusLabel: 'Not connected',
    connectedWalletAddress: null,
    sessionWalletChecksum: null,
    verifiedChainLabel: null,
    contributionEnabled: false,
    amountDisplay: '',
    estimatedContributionUsdDisplay: '$0.00',
    estimatedTokensDisplay: '0',
    input: {
      flowState: 'disconnected',
    },
  }),
  createFixture('connection-failed', {
    label: 'Connection failed',
    description: 'Provider connection failed before checkout started.',
    walletStatusLabel: 'Not connected',
    connectedWalletAddress: null,
    sessionWalletChecksum: null,
    verifiedChainLabel: null,
    contributionEnabled: false,
    input: {
      flowState: 'disconnected',
      issueReason: 'connectionFailed',
      contributionErrorMessage: 'Connector already connected.',
    },
  }),
  createFixture('connection-canceled', {
    label: 'Connection canceled',
    description: 'User closed the wallet connection request.',
    walletStatusLabel: 'Not connected',
    connectedWalletAddress: null,
    sessionWalletChecksum: null,
    verifiedChainLabel: null,
    contributionEnabled: false,
    input: {
      flowState: 'disconnected',
      issueReason: 'connectionCanceled',
      contributionErrorMessage: 'The wallet picker closed before the connection finished.',
    },
  }),
  createFixture('checking-wallet', {
    label: 'Checking wallet',
    description: 'Wallet capability or provider state is still resolving.',
    walletStatusLabel: 'Checking wallet',
    contributionEnabled: false,
    input: {
      flowState: 'checking_wallet',
    },
  }),
  createFixture('verify-wallet', {
    label: 'Verify wallet',
    description: 'Connected wallet needs challenge verification.',
    walletStatusLabel: 'Verification required',
    sessionWalletChecksum: null,
    verifiedChainLabel: null,
    input: {
      flowState: 'unverified',
    },
  }),
  createFixture('verify-failed', {
    label: 'Verify failed',
    description: 'Challenge signature validation failed.',
    walletStatusLabel: 'Verification required',
    sessionWalletChecksum: null,
    verifiedChainLabel: null,
    input: {
      flowState: 'unverified',
      issueReason: 'verificationFailed',
      contributionErrorMessage: 'The signed challenge did not match the connected wallet.',
    },
  }),
  createFixture('wrong-chain', {
    label: 'Wrong chain',
    description: 'Verified wallet connected to the wrong chain.',
    walletStatusLabel: 'Switch network',
    verifiedChainLabel: 'Base Sepolia',
    input: {
      flowState: 'wrong_chain',
      issueReason: 'wrongChain',
      selectedChainLabel: 'Ethereum Sepolia',
    },
  }),
  createFixture('unsupported-wallet', {
    label: 'Unsupported wallet',
    description: 'Wallet is connected, but checkout cannot continue on this route.',
    walletStatusLabel: 'Verification required',
    input: {
      flowState: 'unsupported_wallet',
      issueReason: 'unsupportedWallet',
      contributionErrorMessage: 'This wallet session is missing the approved methods or account permissions required for checkout.',
    },
  }),
  createFixture('simulate-pending', {
    label: 'Simulating',
    description: 'Contribution simulation is in progress.',
    input: {
      flowState: 'submitting',
      submissionState: 'simulating',
    },
  }),
  createFixture('simulate-failed', {
    label: 'Simulation failed',
    description: 'Contribution validation was rejected before wallet approval.',
    input: {
      flowState: 'failed',
      issueReason: 'simulateFailed',
      submissionState: 'failed',
      contributionErrorMessage: 'The transaction would revert on chain.',
    },
  }),
  createFixture('send-pending', {
    label: 'Awaiting wallet approval',
    description: 'The wallet has not approved the transaction yet.',
    input: {
      flowState: 'submitting',
      submissionState: 'awaiting_wallet_approval',
    },
  }),
  createFixture('send-canceled', {
    label: 'Send canceled',
    description: 'User rejected the transaction in the wallet.',
    input: {
      flowState: 'failed',
      issueReason: 'sendCanceled',
      submissionState: 'failed',
      contributionErrorMessage: 'The transaction request was canceled in the wallet.',
    },
  }),
  createFixture('send-failed', {
    label: 'Send failed',
    description: 'Wallet send RPC failed after simulation.',
    input: {
      flowState: 'failed',
      issueReason: 'sendFailed',
      submissionState: 'failed',
      contributionErrorMessage: 'The wallet returned an RPC error while sending the transaction.',
    },
  }),
  createFixture('track-pending', {
    label: 'Tracking receipt',
    description: 'Transaction hash exists and receipt tracking is running.',
    latestExplorerUrl: 'https://sepolia.basescan.org/tx/0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    input: {
      flowState: 'submitting',
      submissionState: 'tracking',
    },
  }),
  createFixture('track-failed', {
    label: 'Receipt tracking failed',
    description: 'The transaction was sent, but receipt creation is retryable.',
    latestExplorerUrl: 'https://sepolia.basescan.org/tx/0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    input: {
      flowState: 'failed',
      issueReason: 'trackFailed',
      submissionState: 'failed',
      contributionErrorMessage: 'Receipt tracking timed out.',
    },
  }),
  createFixture('receipt-ready', {
    label: 'Receipt ready',
    description: 'The transaction and receipt flow completed successfully.',
    latestExplorerUrl: 'https://sepolia.basescan.org/tx/0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    input: {
      flowState: 'success',
      submissionState: 'success',
    },
  }),
];

export function getBuyFixtureById(id: string) {
  return buyStateFixtures.find((fixture) => fixture.id === id) ?? buyStateFixtures[0];
}
