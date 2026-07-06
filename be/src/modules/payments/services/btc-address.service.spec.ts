import { env } from '../../../infrastructure/config/env';
import { BtcAddressService } from './btc-address.service';

describe('BtcAddressService', () => {
  const originalBtcPaymentsEnabled = env.btcPaymentsEnabled;
  const originalBtcTreasuryExtendedPublicKey = env.btcTreasuryExtendedPublicKey;

  afterEach(() => {
    env.btcPaymentsEnabled = originalBtcPaymentsEnabled;
    env.btcTreasuryExtendedPublicKey = originalBtcTreasuryExtendedPublicKey;
  });

  it('throws a clear configuration error when the extended public key checksum is invalid', () => {
    env.btcPaymentsEnabled = true;
    env.btcTreasuryExtendedPublicKey =
      'xpub6CWtEdkZShdT3gkrVGxSWwNS31KhdozhNhs4kqrv5JjFL9sVP1V6sJGHJWEEAUpMN2Lzq9uQtANYWXobEXT1snRaHv46Na6WwfAWUSC9gw';

    expect(() => new BtcAddressService().onModuleInit()).toThrow(
      'BTC_TREASURY_EXTENDED_PUBLIC_KEY is not a valid Base58Check extended public key: Invalid checksum',
    );
  });
});
