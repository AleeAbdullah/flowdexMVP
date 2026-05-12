import { describe, expect, it } from 'vitest';
import type { BuyViewModelInput } from '../types/buy-view-model';
import { buildBuyViewModel } from './buy-view-model';

function baseInput(): BuyViewModelInput {
  return {
    connectionState: 'connected',
    verificationState: 'verified',
    networkState: 'correct',
    contributionState: 'idle',
    issueReason: null,
    primaryWalletSupportCopy: 'Choose a wallet to continue.',
    selectedAssetCode: 'ETH',
    selectedChainLabel: 'Base Sepolia',
    walletConnectEnabled: true,
    needsChainVerification: false,
    manualChainSwitchHelp: null,
    connectedWalletAddress: '0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db',
    sessionWalletAddress: '0x4b0897b0513fdc7c541b6d9d7e929c4e5364d2db',
    contributionErrorMessage: null,
  };
}

describe('buildBuyViewModel', () => {
  it('maps disconnected state to connect wallet shell', () => {
    const model = buildBuyViewModel({
      ...baseInput(),
      connectionState: 'disconnected',
      verificationState: 'unverified',
      connectedWalletAddress: null,
      sessionWalletAddress: null,
    });

    expect(model.step).toBe('connectWallet');
    expect(model.showWalletTray).toBe(true);
    expect(model.title).toBe('Connect wallet');
  });

  it('maps connected but unverified state to verify shell', () => {
    const model = buildBuyViewModel({
      ...baseInput(),
      verificationState: 'unverified',
      sessionWalletAddress: null,
    });

    expect(model.step).toBe('verifyWallet');
    expect(model.dominantActionId).toBe('verifyWallet');
    expect(model.dominantActionLabel).toBe('Verify wallet');
  });

  it('maps wrong chain to switch network shell', () => {
    const model = buildBuyViewModel({
      ...baseInput(),
      networkState: 'wrong',
      selectedChainLabel: 'Ethereum Sepolia',
    });

    expect(model.step).toBe('switchNetwork');
    expect(model.issueReason).toBe('wrongChain');
    expect(model.dominantActionLabel).toBe('Switch to Ethereum Sepolia');
  });

  it('maps ready state to contribution shell', () => {
    const model = buildBuyViewModel(baseInput());

    expect(model.step).toBe('readyToContribute');
    expect(model.dominantActionId).toBe('submitContribution');
    expect(model.dominantActionLabel).toBe('Contribute with ETH');
  });

  it('maps pending contribution states to submitting shell', () => {
    const model = buildBuyViewModel({
      ...baseInput(),
      contributionState: 'track-pending',
    });

    expect(model.step).toBe('submittingContribution');
    expect(model.status).toBe('TRACKING');
    expect(model.isBusy).toBe(true);
  });

  it('maps wallet mismatch to recover shell', () => {
    const model = buildBuyViewModel({
      ...baseInput(),
      verificationState: 'mismatch',
      connectedWalletAddress: '0x583031d1113ad414f02576bd6afabfb302140225',
    });

    expect(model.step).toBe('recoverFromIssue');
    expect(model.issueReason).toBe('sessionWalletMismatch');
    expect(model.dominantActionId).toBe('verifyWallet');
  });

  it('maps tracking failure to recover shell with retry', () => {
    const model = buildBuyViewModel({
      ...baseInput(),
      contributionState: 'track-failed',
      contributionErrorMessage: 'Receipt tracking timed out.',
    });

    expect(model.step).toBe('recoverFromIssue');
    expect(model.issueReason).toBe('trackFailed');
    expect(model.dominantActionId).toBe('retryTracking');
  });

  it('maps receipt ready to transient success shell', () => {
    const model = buildBuyViewModel({
      ...baseInput(),
      contributionState: 'receipt-ready',
    });

    expect(model.step).toBe('receiptReady');
    expect(model.status).toBe('RECEIPT READY');
    expect(model.isBusy).toBe(true);
  });
});
