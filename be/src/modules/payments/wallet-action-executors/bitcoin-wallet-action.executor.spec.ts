import { BitcoinWalletActionExecutor } from './bitcoin-wallet-action.executor';
import { PaymentAsset, PaymentChain, PaymentIntentStatus, PaymentWalletTxIdKind } from '../payments.types';
import type { PaymentIntentEntity } from '../entities/payment-intent.entity';

function buildIntent(): PaymentIntentEntity {
  return {
    id: 'bitcoin-intent-id',
    chain: PaymentChain.BITCOIN,
    asset: PaymentAsset.BTC,
    tokenAmount: '100',
    tokenPriceUsd: '0.01',
    usdAmount: '1',
    quoteCurrency: 'USD',
    quotePriceUsd: '65000',
    quotedAt: new Date(),
    quoteExpiresAt: new Date(Date.now() + 60_000),
    expectedAmountBaseUnits: '10000',
    senderAddress: 'bc1qsenderwalletaddress0000000000000000000000',
    requestIp: null,
    checkoutTokenHash: null,
    receiverAddress: 'bc1qrecipientaddress0000000000000000000000',
    solanaReference: null,
    ethCreatedBlockNumber: null,
    tronCreatedBlockNumber: null,
    btcDerivationIndex: 1,
    btcDerivationPath: "m/84'/0'/0'/0/1",
    status: PaymentIntentStatus.WAITING,
    expiresAt: new Date(Date.now() + 60_000),
    lastCheckedAt: null,
    lastCheckResult: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('BitcoinWalletActionExecutor', () => {
  it('builds a mainnet sats transfer for compatible Bitcoin wallets', async () => {
    const repository = {
      create: jest.fn(value => ({ id: 'bitcoin-action-id', ...value })),
      save: jest.fn(async value => value),
    };
    const executor = new BitcoinWalletActionExecutor(repository as never);
    const intent = buildIntent();

    const result = await executor.prepare({
      intent,
      senderAddress: intent.senderAddress!,
      dto: { chain: PaymentChain.BITCOIN, senderAddress: intent.senderAddress!, walletChainId: 'mainnet' },
    });

    expect(result).toMatchObject({
      kind: 'bitcoin_transfer',
      chain: PaymentChain.BITCOIN,
      walletChainId: 'mainnet',
      bitcoin: { network: 'mainnet', recipientAddress: intent.receiverAddress, amountSats: intent.expectedAmountBaseUnits },
    });
  });

  it('only accepts a 32-byte Bitcoin transaction id', () => {
    const executor = new BitcoinWalletActionExecutor({} as never);

    expect(() => executor.assertTxId(PaymentWalletTxIdKind.BTC_TX_HASH, 'a'.repeat(64))).not.toThrow();
    expect(() => executor.assertTxId(PaymentWalletTxIdKind.BTC_TX_HASH, 'not-a-txid')).toThrow();
  });
});
