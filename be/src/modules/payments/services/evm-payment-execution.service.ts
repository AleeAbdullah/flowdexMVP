import { BadRequestException, Injectable } from '@nestjs/common';
import { getAddress, toBeHex } from 'ethers';

type EvmTransactionRequest = {
  to: `0x${string}`;
  chainId: number;
  value: `0x${string}`;
  data: `0x${string}`;
  gas?: `0x${string}`;
  gasPrice?: `0x${string}`;
  maxFeePerGas?: `0x${string}`;
  maxPriorityFeePerGas?: `0x${string}`;
};

@Injectable()
export class EvmPaymentExecutionService {
  buildNativeEthPaymentRequest(input: {
    receiverAddress: string;
    amountBaseUnits: string;
    chainId: number;
  }): EvmTransactionRequest {
    if (!/^[0-9]+$/.test(input.amountBaseUnits)) {
      throw new BadRequestException('expectedAmountBaseUnits must be a base-unit integer string');
    }

    const value = BigInt(input.amountBaseUnits);
    if (value <= 0n) {
      throw new BadRequestException('expectedAmountBaseUnits must be greater than zero');
    }

    return {
      to: getAddress(input.receiverAddress) as `0x${string}`,
      chainId: input.chainId,
      value: toBeHex(value) as `0x${string}`,
      data: '0x',
    };
  }
}
