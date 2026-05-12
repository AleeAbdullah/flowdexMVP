import type { BuyViewModelInput, SupportedAssetOption } from '../types/buy-view-model';

export type BuyFixtureId =
  | 'disconnected'
  | 'walletconnect-unavailable'
  | 'walletconnect-canceled'
  | 'session-checking'
  | 'verify-wallet'
  | 'verify-pending'
  | 'verify-failed'
  | 'wallet-mismatch'
  | 'wrong-chain'
  | 'switch-pending'
  | 'manual-chain-switch'
  | 'no-valid-option'
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
  mismatchConnected: '0x583031d1113ad414f02576bd6afabfb302140225',
  mismatchSessionChecksum: '0x583031D1113aD414F02576BD6afaBfb302140225',
} as const;

function baseInput(): BuyViewModelInput {
  return {
    connectionState: 'connected',
    verificationState: 'verified',
    networkState: 'correct',
    contributionState: 'idle',
    issueReason: null,
    primaryWalletSupportCopy: 'Connect a supported EVM wallet or use WalletConnect for additional EVM wallets.',
    selectedAssetCode: baseAsset.code,
    selectedChainLabel: 'Base Sepolia',
    walletConnectEnabled: true,
    needsChainVerification: false,
    manualChainSwitchHelp: null,
    connectedWalletAddress: baseAddresses.connected,
    sessionWalletAddress: baseAddresses.connected,
    contributionErrorMessage: null,
  };
}

type BuyFixtureOverrides = Omit<Partial<BuyFixtureDefinition>, 'input'> & {
  input?: Partial<BuyViewModelInput>;
};

function createFixture(
  id: BuyFixtureId,
  overrides: BuyFixtureOverrides,
): BuyFixtureDefinition {
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
    walletConnectEnabled: overrides.walletConnectEnabled ?? input.walletConnectEnabled,
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
      connectionState: 'disconnected',
      verificationState: 'unverified',
      connectedWalletAddress: null,
      sessionWalletAddress: null,
    },
  }),
  createFixture('walletconnect-unavailable', {
    label: 'WalletConnect unavailable',
    description: 'Environment without WalletConnect configured.',
    walletStatusLabel: 'Not connected',
    connectedWalletAddress: null,
    sessionWalletChecksum: null,
    verifiedChainLabel: null,
    contributionEnabled: false,
    walletConnectEnabled: false,
    input: {
      connectionState: 'failed',
      verificationState: 'unverified',
      issueReason: 'walletConnectUnavailable',
      walletConnectEnabled: false,
      primaryWalletSupportCopy: 'Connect a supported EVM wallet to continue.',
      connectedWalletAddress: null,
      sessionWalletAddress: null,
      contributionErrorMessage: 'WalletConnect is not configured for this environment.',
    },
  }),
  createFixture('walletconnect-canceled', {
    label: 'WalletConnect canceled',
    description: 'User closed the WalletConnect flow before session creation.',
    walletStatusLabel: 'Not connected',
    connectedWalletAddress: null,
    sessionWalletChecksum: null,
    verifiedChainLabel: null,
    contributionEnabled: false,
    input: {
      connectionState: 'failed',
      verificationState: 'unverified',
      issueReason: 'walletConnectCanceled',
      connectedWalletAddress: null,
      sessionWalletAddress: null,
      contributionErrorMessage: 'The wallet picker closed before a session was established.',
    },
  }),
  createFixture('session-checking', {
    label: 'Session checking',
    description: 'Connected wallet while the access check is still loading.',
    walletStatusLabel: 'Checking session',
    contributionEnabled: false,
    input: {
      verificationState: 'checking',
    },
  }),
  createFixture('verify-wallet', {
    label: 'Verify wallet',
    description: 'Connected wallet needs challenge verification.',
    walletStatusLabel: 'Verification required',
    sessionWalletChecksum: null,
    verifiedChainLabel: null,
    input: {
      verificationState: 'unverified',
      sessionWalletAddress: null,
    },
  }),
  createFixture('verify-pending', {
    label: 'Verify pending',
    description: 'Wallet signature challenge in progress.',
    walletStatusLabel: 'Verification required',
    sessionWalletChecksum: null,
    verifiedChainLabel: null,
    input: {
      verificationState: 'verifying',
      sessionWalletAddress: null,
    },
  }),
  createFixture('verify-failed', {
    label: 'Verify failed',
    description: 'Challenge signature validation failed.',
    walletStatusLabel: 'Verification required',
    sessionWalletChecksum: null,
    verifiedChainLabel: null,
    input: {
      verificationState: 'failed',
      sessionWalletAddress: null,
      contributionErrorMessage: 'The signed challenge did not match the connected wallet.',
    },
  }),
  createFixture('wallet-mismatch', {
    label: 'Wallet mismatch',
    description: 'Session wallet and provider wallet disagree.',
    walletStatusLabel: 'Wallet mismatch',
    connectedWalletAddress: baseAddresses.mismatchConnected,
    sessionWalletChecksum: baseAddresses.sessionChecksum,
    input: {
      verificationState: 'mismatch',
      connectedWalletAddress: baseAddresses.mismatchConnected,
      sessionWalletAddress: baseAddresses.connected,
    },
  }),
  createFixture('wrong-chain', {
    label: 'Wrong chain',
    description: 'Verified wallet connected to the wrong chain.',
    walletStatusLabel: 'Switch network',
    verifiedChainLabel: 'Base Sepolia',
    input: {
      networkState: 'wrong',
      selectedChainLabel: 'Ethereum Sepolia',
      selectedAssetCode: 'ETH',
    },
  }),
  createFixture('switch-pending', {
    label: 'Switch pending',
    description: 'Programmatic chain switch in progress.',
    walletStatusLabel: 'Switching network',
    verifiedChainLabel: 'Base Sepolia',
    input: {
      networkState: 'switch-pending',
      selectedChainLabel: 'Ethereum Sepolia',
    },
  }),
  createFixture('manual-chain-switch', {
    label: 'Manual chain switch',
    description: 'Programmatic switching failed; user must switch in wallet.',
    walletStatusLabel: 'Manual switch required',
    verifiedChainLabel: 'Base Sepolia',
    input: {
      networkState: 'switch-failed-manual',
      selectedChainLabel: 'Ethereum Sepolia',
      manualChainSwitchHelp: 'Open the wallet and switch to Ethereum Sepolia before retrying.',
    },
  }),
  createFixture('no-valid-option', {
    label: 'No valid option',
    description: 'No supported public native route is available.',
    walletStatusLabel: 'Contribution unavailable',
    contributionEnabled: false,
    selectedAsset: null,
    amountDisplay: '',
    input: {
      contributionState: 'no-valid-option',
      selectedAssetCode: null,
      selectedChainLabel: 'No chain selected',
    },
  }),
  createFixture('simulate-pending', {
    label: 'Simulate pending',
    description: 'Server-side simulation is running.',
    walletStatusLabel: 'Submitting',
    input: {
      contributionState: 'simulate-pending',
    },
  }),
  createFixture('simulate-failed', {
    label: 'Simulate failed',
    description: 'Server-side simulation rejected the contribution.',
    walletStatusLabel: 'Contribution blocked',
    input: {
      contributionState: 'simulate-failed',
      contributionErrorMessage: 'The expected treasury recipient did not match the configured route.',
    },
  }),
  createFixture('send-pending', {
    label: 'Send pending',
    description: 'Awaiting wallet signature and broadcast.',
    walletStatusLabel: 'Awaiting signature',
    latestExplorerUrl: 'https://sepolia.basescan.org/tx/0x123',
    input: {
      contributionState: 'send-pending',
    },
  }),
  createFixture('send-canceled', {
    label: 'Send canceled',
    description: 'User rejected or canceled the wallet signature.',
    walletStatusLabel: 'Signature canceled',
    input: {
      contributionState: 'send-canceled',
      contributionErrorMessage: 'The wallet signature request was canceled before the transaction was broadcast.',
    },
  }),
  createFixture('send-failed', {
    label: 'Send failed',
    description: 'Transaction failed before broadcast.',
    walletStatusLabel: 'Send failed',
    input: {
      contributionState: 'send-failed',
      contributionErrorMessage: 'The connected wallet could not broadcast the transaction.',
    },
  }),
  createFixture('track-pending', {
    label: 'Track pending',
    description: 'Transaction sent; receipt tracking is pending.',
    walletStatusLabel: 'Tracking receipt',
    latestExplorerUrl: 'https://sepolia.basescan.org/tx/0x456',
    input: {
      contributionState: 'track-pending',
    },
  }),
  createFixture('track-failed', {
    label: 'Track failed',
    description: 'Transaction sent but receipt creation failed.',
    walletStatusLabel: 'Receipt retry needed',
    latestExplorerUrl: 'https://sepolia.basescan.org/tx/0x789',
    input: {
      contributionState: 'track-failed',
      contributionErrorMessage: 'The transaction was sent, but the receipt has not been finalized yet.',
    },
  }),
  createFixture('receipt-ready', {
    label: 'Receipt ready',
    description: 'Receipt was created and redirect is imminent.',
    walletStatusLabel: 'Receipt ready',
    latestExplorerUrl: 'https://sepolia.basescan.org/tx/0xabc',
    input: {
      contributionState: 'receipt-ready',
    },
  }),
];

export function getBuyFixtureById(id: string | null | undefined) {
  return buyStateFixtures.find(fixture => fixture.id === id) ?? buyStateFixtures[0];
}
