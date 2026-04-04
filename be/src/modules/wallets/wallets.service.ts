import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getAddress, verifyMessage } from 'ethers';
import { TronWeb, utils as tronUtils } from 'tronweb';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { AuthContext } from '../../common/decorators/current-auth.decorator';
import { Chain, IntentStatus } from '../../common/enums/domain.enums';
import { PurchaseIntentEntity } from '../purchase-intents/entities/purchase-intent.entity';
import { UsersService } from '../users/users.service';
import { WalletDto } from './dto/wallets.dto';
import { WalletChallengeEntity } from './entities/wallet-challenge.entity';
import { WalletEntity } from './entities/wallet.entity';

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);
  private readonly tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
  });

  constructor(
    @InjectRepository(WalletEntity)
    private readonly walletsRepository: Repository<WalletEntity>,
    @InjectRepository(WalletChallengeEntity)
    private readonly walletChallengesRepository: Repository<WalletChallengeEntity>,
    @InjectRepository(PurchaseIntentEntity)
    private readonly purchaseIntentsRepository: Repository<PurchaseIntentEntity>,
    private readonly usersService: UsersService,
  ) {}

  async createChallenge(auth: AuthContext, chain: Chain, address: string): Promise<{
    challengeId: string;
    message: string;
    expiresAt: Date;
  }> {
    await this.usersService.syncAndRequireActive(auth);

    const addressNormalized = this.normalizeAddress(chain, address);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const nonce = uuidv4();
    const message = [
      'FlowDex wallet verification',
      `Address: ${addressNormalized}`,
      `Nonce: ${nonce}`,
      `User: ${auth.sub}`,
    ].join('\n');

    const challenge = this.walletChallengesRepository.create({
      userId: auth.sub,
      chain,
      addressRaw: address,
      addressNormalized,
      message,
      nonce,
      expiresAt,
    });

    const saved = await this.walletChallengesRepository.save(challenge);
    this.logger.log(`Created ${chain} wallet challenge ${saved.id} for user ${auth.sub}.`);

    return {
      challengeId: saved.id,
      message: saved.message,
      expiresAt: saved.expiresAt,
    };
  }

  async verify(auth: AuthContext, challengeId: string, signature: string): Promise<WalletDto> {
    await this.usersService.syncAndRequireActive(auth);

    const challenge = await this.walletChallengesRepository.findOne({
      where: { id: challengeId, userId: auth.sub },
    });

    if (!challenge) {
      throw new NotFoundException('Wallet challenge not found');
    }

    if (challenge.usedAt) {
      throw new ConflictException('Wallet challenge already used');
    }

    if (challenge.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Wallet challenge has expired');
    }

    const recoveredAddress = await this.verifySignature(
      challenge.chain,
      challenge.message,
      signature,
    );
    const normalizedRecovered = this.normalizeAddress(challenge.chain, recoveredAddress);

    if (normalizedRecovered !== challenge.addressNormalized) {
      throw new BadRequestException('Signature does not match the challenge address');
    }

    const existing = await this.walletsRepository.findOne({
      where: {
        chain: challenge.chain,
        addressNormalized: challenge.addressNormalized,
      },
    });

    if (existing && existing.userId !== auth.sub) {
      throw new ConflictException('Wallet already linked to another user');
    }

    const isPrimary =
      (await this.walletsRepository.count({
        where: { userId: auth.sub, chain: challenge.chain, isPrimary: true },
      })) === 0;

    const wallet =
      existing ??
      this.walletsRepository.create({
        userId: auth.sub,
        chain: challenge.chain,
        addressRaw: challenge.addressRaw,
        addressNormalized: challenge.addressNormalized,
        isPrimary,
      });

    wallet.addressRaw = challenge.addressRaw;
    wallet.addressNormalized = challenge.addressNormalized;
    wallet.verifiedAt = new Date();
    if (isPrimary) {
      wallet.isPrimary = true;
    }

    challenge.usedAt = new Date();
    await this.walletChallengesRepository.save(challenge);

    const saved = await this.walletsRepository.save(wallet);
    this.logger.log(`Verified wallet ${saved.id} (${saved.chain}) for user ${auth.sub}.`);
    return this.toDto(saved);
  }

  async listForActiveUser(auth: AuthContext): Promise<WalletDto[]> {
    await this.usersService.syncAndRequireActive(auth);
    return this.listForUser(auth.sub);
  }

  async listForUser(userId: string): Promise<WalletDto[]> {
    const wallets = await this.walletsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return wallets.map((wallet) => this.toDto(wallet));
  }

  async removeForAuth(auth: AuthContext, walletId: string): Promise<void> {
    await this.usersService.syncAndRequireActive(auth);

    const userId = auth.sub;
    const wallet = await this.walletsRepository.findOne({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const linkedIntents = await this.purchaseIntentsRepository.count({
      where: [
        { walletId, status: IntentStatus.PENDING },
        { walletId, status: IntentStatus.MATCHED },
        { walletId, status: IntentStatus.CONFIRMING },
        { walletId, status: IntentStatus.CONFIRMED },
        { walletId, status: IntentStatus.REFUNDED },
      ],
    });

    if (linkedIntents > 0) {
      throw new ConflictException('Wallet cannot be removed after linked transaction activity');
    }

    await this.walletsRepository.delete({ id: walletId, userId });
    this.logger.log(`Removed wallet ${walletId} for user ${userId}.`);
  }

  private toDto(wallet: WalletEntity): WalletDto {
    return {
      id: wallet.id,
      chain: wallet.chain,
      address: wallet.addressNormalized,
      isPrimary: wallet.isPrimary,
      verifiedAt: wallet.verifiedAt,
    };
  }

  private normalizeAddress(chain: Chain, address: string): string {
    const value = address.trim();

    if (chain === Chain.ETH || chain === Chain.ERC20) {
      return getAddress(value);
    }

    if (!tronUtils.address.isAddress(value)) {
      throw new BadRequestException('Invalid TRON address');
    }

    return tronUtils.address.fromHex(tronUtils.address.toHex(value));
  }

  private async verifySignature(
    chain: Chain,
    message: string,
    signature: string,
  ): Promise<string> {
    if (chain === Chain.ETH || chain === Chain.ERC20) {
      return verifyMessage(message, signature);
    }

    return this.tronWeb.trx.verifyMessageV2(message, signature);
  }
}
