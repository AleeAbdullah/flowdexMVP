import { BadRequestException, Injectable } from '@nestjs/common';

import { PaymentChain } from '../payments.types';
import { EthereumWalletActionExecutor } from './ethereum-wallet-action.executor';
import { SolanaWalletActionExecutor } from './solana-wallet-action.executor';
import { TronWalletActionExecutor } from './tron-wallet-action.executor';
import type { WalletActionExecutor } from './wallet-action-executor.types';

@Injectable()
export class WalletActionExecutorRegistry {
  private readonly executors: Map<PaymentChain, WalletActionExecutor>;

  constructor(
    ethereumWalletActionExecutor: EthereumWalletActionExecutor,
    solanaWalletActionExecutor: SolanaWalletActionExecutor,
    tronWalletActionExecutor: TronWalletActionExecutor,
  ) {
    this.executors = new Map<PaymentChain, WalletActionExecutor>([
      [PaymentChain.ETHEREUM, ethereumWalletActionExecutor],
      [PaymentChain.SOLANA, solanaWalletActionExecutor],
      [PaymentChain.TRON, tronWalletActionExecutor],
    ]);
  }

  get(chain: PaymentChain): WalletActionExecutor {
    const executor = this.executors.get(chain);
    if (!executor) {
      throw new BadRequestException('Unsupported wallet action chain');
    }

    return executor;
  }
}
