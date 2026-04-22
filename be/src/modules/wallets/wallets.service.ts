import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getAddress } from 'ethers';
import { Repository } from 'typeorm';

import { AuthContext } from '../../common/decorators/current-auth.decorator';
import { Chain } from '../../common/enums/domain.enums';
import { LedgerTransactionEntity } from '../transactions/entities/ledger-transaction.entity';
import { UsersService } from '../users/users.service';
import { LinkWalletDto, WalletDto } from './dto/wallets.dto';
import { WalletEntity } from './entities/wallet.entity';

const SUPPORTED_NETWORKS = new Set(['ETH_SEPOLIA', 'BASE_SEPOLIA']);

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletsRepository: Repository<WalletEntity>,
    @InjectRepository(LedgerTransactionEntity)
    private readonly ledgerTransactionsRepository: Repository<LedgerTransactionEntity>,
    private readonly usersService: UsersService,
  ) {}

  async link(auth: AuthContext, input: LinkWalletDto): Promise<WalletDto> {
    await this.usersService.syncAndRequireActive(auth);

    if (!SUPPORTED_NETWORKS.has(input.network)) {
      throw new ConflictException('Unsupported wallet network');
    }

    const mappedChain = this.mapChainForNetwork(input.network);
    const addressNormalized = getAddress(input.address.trim());
    const existingByProviderWallet = await this.walletsRepository.findOne({
      where: { alchemyWalletId: input.alchemyWalletId },
    });

    if (existingByProviderWallet && existingByProviderWallet.userId !== auth.sub) {
      throw new ConflictException('Alchemy wallet is already linked to another user');
    }

    const existingByAddress = await this.walletsRepository.findOne({
      where: {
        chain: mappedChain,
        addressNormalized,
      },
    });

    if (existingByAddress && existingByAddress.userId !== auth.sub) {
      throw new ConflictException('Wallet address is already linked to another user');
    }

    const hasPrimaryInNetwork = (await this.walletsRepository.count({
      where: {
        userId: auth.sub,
        network: input.network,
        isPrimary: true,
      },
    })) > 0;

    const target = existingByProviderWallet
      ?? existingByAddress
      ?? this.walletsRepository.create({
        userId: auth.sub,
        chain: mappedChain,
        addressRaw: addressNormalized,
        addressNormalized,
        isPrimary: !hasPrimaryInNetwork,
      });

    target.userId = auth.sub;
    target.chain = mappedChain;
    target.addressRaw = input.address.trim();
    target.addressNormalized = addressNormalized;
    target.network = input.network;
    target.provider = input.provider?.trim() || 'ALCHEMY_EMBEDDED';
    target.alchemyAccountId = input.alchemyAccountId.trim();
    target.alchemyWalletId = input.alchemyWalletId.trim();
    target.verifiedAt = new Date();

    if (!hasPrimaryInNetwork) {
      target.isPrimary = true;
    }

    const saved = await this.walletsRepository.save(target);
    this.logger.log(`Linked wallet ${saved.id} (${saved.network}) for user ${auth.sub}.`);
    return this.toDto(saved);
  }

  async listForActiveUser(auth: AuthContext): Promise<WalletDto[]> {
    await this.usersService.syncAndRequireActive(auth);
    return this.listForUser(auth.sub);
  }

  async listForUser(userId: string): Promise<WalletDto[]> {
    const wallets = await this.walletsRepository.find({
      where: { userId },
      order: { isPrimary: 'DESC', createdAt: 'DESC' },
    });

    return wallets
      .filter(wallet => wallet.network && SUPPORTED_NETWORKS.has(wallet.network))
      .map(wallet => this.toDto(wallet));
  }

  async removeForAuth(auth: AuthContext, walletId: string): Promise<void> {
    await this.usersService.syncAndRequireActive(auth);

    const wallet = await this.walletsRepository.findOne({
      where: { id: walletId, userId: auth.sub },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const linkedTransactions = await this.ledgerTransactionsRepository.count({
      where: { walletId: wallet.id },
    });

    if (linkedTransactions > 0) {
      throw new ConflictException('Wallet cannot be removed after linked transaction activity');
    }

    await this.walletsRepository.delete({ id: wallet.id, userId: auth.sub });
    this.logger.log(`Removed wallet ${wallet.id} for user ${auth.sub}.`);
  }

  private toDto(wallet: WalletEntity): WalletDto {
    return {
      id: wallet.id,
      address: wallet.addressNormalized,
      network: wallet.network ?? 'ETH_SEPOLIA',
      provider: wallet.provider ?? 'ALCHEMY_EMBEDDED',
      alchemyAccountId: wallet.alchemyAccountId ?? '',
      alchemyWalletId: wallet.alchemyWalletId ?? '',
      isPrimary: wallet.isPrimary,
      verifiedAt: wallet.verifiedAt,
    };
  }

  private mapChainForNetwork(network: string): Chain {
    if (network === 'BASE_SEPOLIA') {
      return Chain.BASE_SEPOLIA;
    }

    return Chain.ETH_SEPOLIA;
  }
}
