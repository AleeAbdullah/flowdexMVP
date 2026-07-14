import { BadRequestException } from '@nestjs/common';
import { TronWeb } from 'tronweb';

import type { TronSignedTransaction, TronUnsignedTransaction } from '../../alchemy/alchemy.service';
import { TronPaymentExecutionService } from './tron-payment-execution.service';

function address(byte: string): string {
  return TronWeb.address.fromHex(`41${byte.repeat(40)}`);
}

function unsignedTransaction(): TronUnsignedTransaction {
  return {
    visible: true,
    txID: 'a'.repeat(64),
    raw_data: {
      contract: [{ type: 'TriggerSmartContract' }],
      fee_limit: 100_000_000,
    },
    raw_data_hex: 'deadbeef',
  };
}

describe('TronPaymentExecutionService', () => {
  const service = new TronPaymentExecutionService();

  it('encodes the TRC20 recipient and amount as two ABI words', () => {
    const transfer = service.buildPreparedTransfer({
      payerAddress: address('1'),
      recipientAddress: address('2'),
      contractAddress: address('3'),
      amountBaseUnits: '1250000',
    });

    const parameter = service.buildSmartContractParameter(transfer);

    expect(parameter).toHaveLength(128);
    expect(parameter.slice(24, 64)).toBe('2'.repeat(40));
    expect(BigInt(`0x${parameter.slice(64)}`).toString()).toBe('1250000');
  });

  it('accepts only a signed transaction that exactly matches the prepared payload', () => {
    const unsigned = unsignedTransaction();
    const prepared = service.toPreparedTransfer(service.buildPreparedTransfer({
      payerAddress: address('1'),
      recipientAddress: address('2'),
      contractAddress: address('3'),
      amountBaseUnits: '1250000',
    }), unsigned);
    const signed: TronSignedTransaction = {
      ...unsigned,
      signature: ['b'.repeat(130)],
    };

    expect(() => service.assertSignedTransactionMatchesPrepared(prepared, signed)).not.toThrow();
    expect(() => service.assertSignedTransactionMatchesPrepared(prepared, {
      ...signed,
      raw_data_hex: 'feedface',
    })).toThrow(BadRequestException);
  });

  it('rejects a prepared transaction without the stored unsigned payload', () => {
    expect(() => service.parsePreparedTransfer({ kind: 'tron_transaction' })).toThrow(
      'Prepared TRON transaction is missing',
    );
  });
});
