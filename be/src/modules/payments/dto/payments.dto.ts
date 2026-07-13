import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

import {
  PaymentAsset,
  PaymentChain,
  PaymentIntentStatus,
  PaymentStatus,
  PaymentWalletActionKind,
  PaymentWalletTxIdKind,
} from '../payments.types';

export class CreatePaymentIntentDto {
  @ApiProperty({ enum: PaymentChain })
  @IsEnum(PaymentChain)
  chain!: PaymentChain;

  @ApiProperty({ enum: PaymentAsset })
  @IsEnum(PaymentAsset)
  asset!: PaymentAsset;

  @ApiProperty({ example: '1000' })
  @IsString()
  @Matches(/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/)
  tokenAmount!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  senderAddress?: string;
}

export class PaymentHistoryQueryDto {
  @ApiProperty()
  @IsString()
  walletAddress!: string;
}

export class PaymentLeadersQueryDto {
  @ApiProperty({ required: false, minimum: 1, maximum: 50, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class PaymentInstructionsDto {
  @ApiProperty()
  chain!: PaymentChain;

  @ApiProperty()
  asset!: PaymentAsset;

  @ApiProperty()
  receiverAddress!: string;

  @ApiProperty()
  expectedAmountBaseUnits!: string;

  @ApiProperty({ nullable: true })
  paymentUri!: string | null;

  @ApiProperty({ nullable: true })
  solanaReference!: string | null;
}

export class PaymentIntentPublicDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  chain!: PaymentChain;

  @ApiProperty()
  asset!: PaymentAsset;

  @ApiProperty()
  tokenAmount!: string;

  @ApiProperty()
  usdAmount!: string;

  @ApiProperty()
  expectedAmountBaseUnits!: string;

  @ApiProperty({ nullable: true })
  senderAddress!: string | null;

  @ApiProperty()
  receiverAddress!: string;

  @ApiProperty()
  status!: PaymentIntentStatus;

  @ApiProperty()
  expiresAt!: Date;

  @ApiProperty({ nullable: true })
  lastCheckedAt!: Date | null;

  @ApiProperty()
  instructions!: PaymentInstructionsDto;
}

export class PaymentCheckoutSessionDto {
  @ApiProperty({ type: PaymentIntentPublicDto })
  intent!: PaymentIntentPublicDto;

  @ApiProperty()
  checkoutToken!: string;
}

export class PaymentCheckoutCapabilityDto {
  @ApiProperty({ enum: PaymentChain })
  chain!: PaymentChain;

  @ApiProperty({ enum: PaymentAsset })
  asset!: PaymentAsset;

  @ApiProperty({ enum: ['metamask', 'metamask_solana', 'xverse', 'tronlink'] })
  walletProvider!: 'metamask' | 'metamask_solana' | 'xverse' | 'tronlink';

  @ApiProperty({ enum: ['mainnet', 'mainnet-beta'] })
  network!: 'mainnet' | 'mainnet-beta';

  @ApiProperty()
  decimals!: number;

  @ApiProperty()
  enabled!: boolean;
}

export class PaymentCheckoutCapabilitiesDto {
  @ApiProperty({ type: [PaymentCheckoutCapabilityDto] })
  items!: PaymentCheckoutCapabilityDto[];
}

export class PaymentPublicDto {
  @ApiProperty()
  intentId!: string;

  @ApiProperty()
  chain!: PaymentChain;

  @ApiProperty()
  asset!: PaymentAsset;

  @ApiProperty()
  amountBaseUnits!: string;

  @ApiProperty({ nullable: true })
  senderAddress!: string | null;

  @ApiProperty()
  receiverAddress!: string;

  @ApiProperty({ nullable: true })
  txHash!: string | null;

  @ApiProperty()
  status!: PaymentStatus;

  @ApiProperty({ nullable: true })
  blockNumber!: string | null;

  @ApiProperty()
  confirmations!: number;

  @ApiProperty({ nullable: true })
  confirmedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;
}

export class PaymentIntentStatusDto {
  @ApiProperty()
  intent!: PaymentIntentPublicDto;

  @ApiProperty({ nullable: true })
  payment!: PaymentPublicDto | null;
}

export class PreparePaymentWalletActionDto {
  @ApiProperty({ enum: [PaymentChain.ETHEREUM, PaymentChain.SOLANA, PaymentChain.BITCOIN, PaymentChain.TRON] })
  @IsEnum(PaymentChain)
  chain!: PaymentChain;

  @ApiProperty()
  @IsString()
  senderAddress!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  walletChainId?: string | number;
}

export class PreparedEvmWalletTransactionRequestDto {
  @ApiProperty()
  to!: `0x${string}`;

  @ApiProperty()
  chainId!: number;

  @ApiProperty()
  value!: `0x${string}`;

  @ApiProperty()
  data!: `0x${string}`;

  @ApiProperty({ required: false })
  gas?: `0x${string}`;

  @ApiProperty({ required: false })
  gasPrice?: `0x${string}`;

  @ApiProperty({ required: false })
  maxFeePerGas?: `0x${string}`;

  @ApiProperty({ required: false })
  maxPriorityFeePerGas?: `0x${string}`;
}

export class PreparedTronWalletTransferDto {
  @ApiProperty({ enum: ['tron_transaction'] })
  kind!: 'tron_transaction';

  @ApiProperty({ enum: ['mainnet'] })
  network!: 'mainnet';

  @ApiProperty()
  chainId!: string;

  @ApiProperty()
  walletActionId!: string;

  @ApiProperty()
  contractAddress!: string;

  @ApiProperty({ enum: ['transfer(address,uint256)'] })
  functionSelector!: 'transfer(address,uint256)';

  @ApiProperty()
  recipientAddress!: string;

  @ApiProperty()
  amountBaseUnits!: string;

  @ApiProperty()
  feeLimitSun!: string;

  @ApiProperty()
  payerAddress!: string;

  @ApiProperty()
  payerAddressHex!: string;
}

export class PreparedBitcoinWalletTransferDto {
  @ApiProperty({ enum: ['mainnet'] })
  network!: 'mainnet';

  @ApiProperty()
  recipientAddress!: string;

  @ApiProperty()
  amountSats!: string;
}

export class PreparedWalletActionDto {
  @ApiProperty({ enum: [PaymentWalletActionKind.EVM_TRANSACTION, PaymentWalletActionKind.SOLANA_TRANSACTION, PaymentWalletActionKind.BITCOIN_TRANSFER, PaymentWalletActionKind.TRON_TRANSACTION] })
  kind!: PaymentWalletActionKind;

  @ApiProperty()
  paymentIntentId!: string;

  @ApiProperty()
  preparedActionId!: string;

  @ApiProperty({ enum: [PaymentChain.ETHEREUM, PaymentChain.SOLANA, PaymentChain.BITCOIN, PaymentChain.TRON] })
  chain!: PaymentChain;

  @ApiProperty({ required: false })
  chainId?: number;

  @ApiProperty({ type: PreparedEvmWalletTransactionRequestDto, required: false })
  request?: PreparedEvmWalletTransactionRequestDto;

  @ApiProperty({ required: false, enum: ['mainnet-beta'] })
  cluster?: 'mainnet-beta';

  @ApiProperty({ required: false })
  walletChainId?: string;

  @ApiProperty({ required: false })
  payer?: string;

  @ApiProperty({ required: false })
  transaction?: string;

  @ApiProperty({ required: false, enum: ['base64'] })
  transactionEncoding?: 'base64';

  @ApiProperty({ required: false })
  lastValidBlockHeight?: number;

  @ApiProperty({ type: PreparedTronWalletTransferDto, required: false })
  tron?: PreparedTronWalletTransferDto;

  @ApiProperty({ type: PreparedBitcoinWalletTransferDto, required: false })
  bitcoin?: PreparedBitcoinWalletTransferDto;

  @ApiProperty()
  expiresAt!: Date;
}

export class SubmitPaymentTxResultDto {
  @ApiProperty({ enum: [PaymentChain.ETHEREUM, PaymentChain.SOLANA, PaymentChain.BITCOIN, PaymentChain.TRON] })
  @IsEnum(PaymentChain)
  chain!: PaymentChain;

  @ApiProperty()
  @IsString()
  preparedActionId!: string;

  @ApiProperty({ enum: [PaymentWalletTxIdKind.EVM_TX_HASH, PaymentWalletTxIdKind.SOLANA_SIGNATURE, PaymentWalletTxIdKind.BTC_TX_HASH, PaymentWalletTxIdKind.TRON_TX_HASH] })
  @IsIn([PaymentWalletTxIdKind.EVM_TX_HASH, PaymentWalletTxIdKind.SOLANA_SIGNATURE, PaymentWalletTxIdKind.BTC_TX_HASH, PaymentWalletTxIdKind.TRON_TX_HASH])
  txIdKind!: PaymentWalletTxIdKind;

  @ApiProperty()
  @IsString()
  @Matches(/^(?:0x[a-fA-F0-9]{64}|[1-9A-HJ-NP-Za-km-z]{64,88})$/)
  txId!: string;
}

export class PaymentLeaderDto {
  @ApiProperty()
  rank!: number;

  @ApiProperty()
  walletAddress!: string;

  @ApiProperty()
  totalUsd!: string;

  @ApiProperty()
  paymentCount!: number;

  @ApiProperty()
  latestPaymentAt!: Date;
}

export class PaymentLeadersResponseDto {
  @ApiProperty({ type: [PaymentLeaderDto] })
  items!: PaymentLeaderDto[];
}

export class PaymentPortfolioSummaryDto {
  @ApiProperty()
  totalInvestedUsd!: string;

  @ApiProperty()
  confirmedTokenAmount!: string;

  @ApiProperty()
  pendingTokenAmount!: string;

  @ApiProperty()
  reviewTokenAmount!: string;

  @ApiProperty()
  totalTransactions!: number;

  @ApiProperty()
  confirmedTransactions!: number;

  @ApiProperty()
  pendingTransactions!: number;

  @ApiProperty()
  reviewTransactions!: number;

  @ApiProperty()
  failedTransactions!: number;

  @ApiProperty()
  averageEntryPriceUsd!: string;

  @ApiProperty({ nullable: true })
  firstPaymentAt!: Date | null;

  @ApiProperty({ nullable: true })
  latestPaymentAt!: Date | null;
}

export class PaymentPortfolioBreakdownDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  totalUsd!: string;

  @ApiProperty()
  tokenAmount!: string;

  @ApiProperty()
  transactionCount!: number;
}

export class PaymentPortfolioTransactionDto {
  @ApiProperty()
  intentId!: string;

  @ApiProperty({ enum: PaymentChain })
  chain!: PaymentChain;

  @ApiProperty({ enum: PaymentAsset })
  asset!: PaymentAsset;

  @ApiProperty()
  tokenAmount!: string;

  @ApiProperty()
  usdAmount!: string;

  @ApiProperty()
  expectedAmountBaseUnits!: string;

  @ApiProperty({ nullable: true })
  paidAmountBaseUnits!: string | null;

  @ApiProperty({ nullable: true })
  senderAddress!: string | null;

  @ApiProperty()
  receiverAddress!: string;

  @ApiProperty({ nullable: true })
  txHash!: string | null;

  @ApiProperty({ enum: PaymentIntentStatus })
  intentStatus!: PaymentIntentStatus;

  @ApiProperty({ enum: PaymentStatus, nullable: true })
  paymentStatus!: PaymentStatus | null;

  @ApiProperty()
  confirmations!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ nullable: true })
  confirmedAt!: Date | null;

  @ApiProperty()
  expiresAt!: Date;
}

export class PaymentPortfolioBreakdownsDto {
  @ApiProperty({ type: [PaymentPortfolioBreakdownDto] })
  byAsset!: PaymentPortfolioBreakdownDto[];

  @ApiProperty({ type: [PaymentPortfolioBreakdownDto] })
  byChain!: PaymentPortfolioBreakdownDto[];

  @ApiProperty({ type: [PaymentPortfolioBreakdownDto] })
  byStatus!: PaymentPortfolioBreakdownDto[];
}

export class PaymentPortfolioResponseDto {
  @ApiProperty()
  walletAddress!: string;

  @ApiProperty({ type: PaymentPortfolioSummaryDto })
  summary!: PaymentPortfolioSummaryDto;

  @ApiProperty({ type: PaymentPortfolioBreakdownsDto })
  breakdowns!: PaymentPortfolioBreakdownsDto;

  @ApiProperty({ type: [PaymentPortfolioTransactionDto] })
  transactions!: PaymentPortfolioTransactionDto[];
}
