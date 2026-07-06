import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as bip32Factory from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';
import * as bs58checkModule from 'bs58check';
import * as ecc from 'tiny-secp256k1';

import { env } from '../../../infrastructure/config/env';

const bip32 = bip32Factory.BIP32Factory(ecc);
const MAINNET_ZPUB_VERSION = 0x04b24746;
const MAINNET_XPUB_VERSION = 0x0488b21e;
const bs58check = bs58checkModule.default ?? bs58checkModule;

@Injectable()
export class BtcAddressService implements OnModuleInit {
  private readonly logger = new Logger(BtcAddressService.name);
  private accountNode: ReturnType<typeof bip32.fromBase58> | null = null;

  onModuleInit(): void {
    if (!env.btcPaymentsEnabled) {
      this.logger.warn('BTC payments are disabled.');
      return;
    }

    this.validateConfig();
  }

  deriveReceiveAddress(index: number): { address: string; derivationPath: string; derivationIndex: number } {
    const node = this.getAccountNode();
    const child = node.derive(0).derive(index);

    if (!child.publicKey) {
      throw new Error('BTC public child derivation failed');
    }

    const payment = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(child.publicKey),
      network: bitcoin.networks.bitcoin,
    });

    if (!payment.address || !payment.address.startsWith('bc1q')) {
      throw new Error('BTC derivation did not produce a mainnet native SegWit address');
    }

    return {
      address: payment.address,
      derivationPath: `m/84'/0'/0'/0/${index}`,
      derivationIndex: index,
    };
  }

  private validateConfig(): void {
    const configured = env.btcTreasuryExtendedPublicKey.trim();
    if (!configured) {
      throw new Error('Missing required environment variable: BTC_TREASURY_EXTENDED_PUBLIC_KEY');
    }

    this.accountNode = this.parseExtendedPublicKey(configured);
    const probe = this.deriveReceiveAddress(0);
    if (!probe.address.startsWith('bc1q')) {
      throw new Error('BTC_TREASURY_EXTENDED_PUBLIC_KEY must derive bc1q native SegWit mainnet addresses');
    }

    this.logger.log('Validated BTC treasury extended public key configuration.');
  }

  private getAccountNode(): ReturnType<typeof bip32.fromBase58> {
    if (!this.accountNode) {
      this.validateConfig();
    }

    if (!this.accountNode) {
      throw new Error('BTC account public key is not configured');
    }

    return this.accountNode;
  }

  private parseExtendedPublicKey(key: string): ReturnType<typeof bip32.fromBase58> {
    const node = this.decodeExtendedPublicKey(key);
    if (!node.publicKey || node.privateKey) {
      throw new Error('BTC_TREASURY_EXTENDED_PUBLIC_KEY must be a public account key');
    }

    return node;
  }

  private decodeExtendedPublicKey(key: string): ReturnType<typeof bip32.fromBase58> {
    try {
      return bip32.fromBase58(this.normalizeToXpub(key), bitcoin.networks.bitcoin);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('BTC_TREASURY_EXTENDED_PUBLIC_KEY')) {
        throw error;
      }

      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(
        `BTC_TREASURY_EXTENDED_PUBLIC_KEY is not a valid Base58Check extended public key: ${reason}`,
      );
    }
  }

  private normalizeToXpub(key: string): string {
    if (key.startsWith('xpub')) {
      return key;
    }

    if (!key.startsWith('zpub')) {
      throw new Error('BTC_TREASURY_EXTENDED_PUBLIC_KEY must be an xpub or zpub');
    }

    const payload = Buffer.from(bs58check.decode(key));
    const version = payload.readUInt32BE(0);
    if (version !== MAINNET_ZPUB_VERSION) {
      throw new Error('BTC_TREASURY_EXTENDED_PUBLIC_KEY must be a mainnet zpub');
    }

    payload.writeUInt32BE(MAINNET_XPUB_VERSION, 0);
    return bs58check.encode(payload);
  }
}
