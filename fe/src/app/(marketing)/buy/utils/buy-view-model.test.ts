import { describe, expect, it } from 'vitest';
import type { BuyViewModelInput } from '../types/buy-view-model';
import { buildBuyViewModel } from './buy-view-model';

function baseInput(): BuyViewModelInput {
  return {
    flowState: 'ready',
    submissionState: 'idle',
    issueReason: null,
    primaryWalletSupportCopy: 'Choose a wallet to continue.',
    selectedAssetCode: 'ETH',
    selectedChainLabel: 'Base Sepolia',
    contributionErrorMessage: null,
  };
}

describe('buildBuyViewModel', () => {
  it('maps disconnected state to the wallet tray', () => {
    const model = buildBuyViewModel({
      ...baseInput(),
      flowState: 'disconnected',
    });

    expect(model.state).toBe('disconnected');
    expect(model.showWalletTray).toBe(true);
    expect(model.title).toBe('Connect wallet');
  });

  it('maps connection cancellation to a warning disconnected shell', () => {
    const model = buildBuyViewModel({
      ...baseInput(),
      flowState: 'disconnected',
      issueReason: 'connectionCanceled',
      contributionErrorMessage: 'The wallet picker closed before the connection finished.',
    });

    expect(model.status).toBe('CANCELED');
    expect(model.tone).toBe('warning');
    expect(model.alerts[0]?.title).toBe('Connection canceled');
  });

  it('maps connection failure to a danger disconnected shell', () => {
    const model = buildBuyViewModel({
      ...baseInput(),
      flowState: 'disconnected',
      issueReason: 'connectionFailed',
      contributionErrorMessage: 'Connector already connected.',
    });

    expect(model.status).toBe('FAILED');
    expect(model.tone).toBe('danger');
    expect(model.title).toBe('Couldn’t connect wallet');
  });

  it('maps unverified state to verify wallet shell', () => {
    const model = buildBuyViewModel({
      ...baseInput(),
      flowState: 'unverified',
    });

    expect(model.state).toBe('unverified');
    expect(model.dominantActionId).toBe('verifyWallet');
    expect(model.dominantActionLabel).toBe('Verify wallet');
  });

  it('maps verification failures to retry verification', () => {
    const model = buildBuyViewModel({
      ...baseInput(),
      flowState: 'unverified',
      issueReason: 'verificationFailed',
      contributionErrorMessage: 'The signed challenge did not match the connected wallet.',
    });

    expect(model.status).toBe('FAILED');
    expect(model.dominantActionLabel).toBe('Retry verification');
    expect(model.alerts[0]?.title).toBe('Verification failed');
  });

  it('maps wrong chain to switch network shell', () => {
    const model = buildBuyViewModel({
      ...baseInput(),
      flowState: 'wrong_chain',
      issueReason: 'wrongChain',
      selectedChainLabel: 'Ethereum Sepolia',
    });

    expect(model.state).toBe('wrong_chain');
    expect(model.dominantActionLabel).toBe('Switch to Ethereum Sepolia');
    expect(model.description).toContain('wallet network and selected payment network');
    expect(model.alerts[0]?.title).toBe('Wrong network');
  });

  it('maps unsupported wallets to a disconnect-only recovery shell', () => {
    const model = buildBuyViewModel({
      ...baseInput(),
      flowState: 'unsupported_wallet',
      issueReason: 'unsupportedWallet',
      contributionErrorMessage: 'This wallet session did not approve eth_sendTransaction.',
    });

    expect(model.status).toBe('UNSUPPORTED');
    expect(model.secondaryActionId).toBe('disconnectWallet');
    expect(model.dominantActionId).toBeNull();
  });

  it('maps ready state to contribution shell', () => {
    const model = buildBuyViewModel(baseInput());

    expect(model.state).toBe('ready');
    expect(model.dominantActionId).toBe('submitContribution');
    expect(model.dominantActionLabel).toBe('Complete purchase');
  });

  it('maps submission states to the busy submission shell', () => {
    const model = buildBuyViewModel({
      ...baseInput(),
      flowState: 'submitting',
      submissionState: 'tracking',
    });

    expect(model.status).toBe('TRACKING');
    expect(model.isBusy).toBe(true);
  });

  it('maps track failures to retry tracking', () => {
    const model = buildBuyViewModel({
      ...baseInput(),
      flowState: 'failed',
      submissionState: 'failed',
      issueReason: 'trackFailed',
      contributionErrorMessage: 'Receipt tracking timed out.',
    });

    expect(model.dominantActionId).toBe('retryTracking');
    expect(model.alerts[0]?.title).toBe('Couldn’t load the receipt');
  });

  it('maps send cancellations to a warning failure state', () => {
    const model = buildBuyViewModel({
      ...baseInput(),
      flowState: 'failed',
      submissionState: 'failed',
      issueReason: 'sendCanceled',
    });

    expect(model.status).toBe('CANCELED');
    expect(model.tone).toBe('warning');
  });

  it('maps success to the transient receipt state', () => {
    const model = buildBuyViewModel({
      ...baseInput(),
      flowState: 'success',
      submissionState: 'success',
    });

    expect(model.state).toBe('success');
    expect(model.isBusy).toBe(true);
    expect(model.title).toBe('Opening receipt');
  });
});
