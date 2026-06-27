import { PaymentsService } from './payments.service';
import { PaymentStatus } from './payments.types';

function buildServiceWithQueryRows(rows: unknown[]) {
  const queryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rows),
  };
  const paymentsRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
  };
  const service = new PaymentsService(
    {} as never,
    paymentsRepository as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  return { service, paymentsRepository, queryBuilder };
}

describe('PaymentsService', () => {
  describe('listPublicLeaders', () => {
    it('returns confirmed payment leaders ranked by total USD', async () => {
      const latestPaymentAt = new Date('2026-06-26T10:00:00.000Z');
      const { service, paymentsRepository, queryBuilder } = buildServiceWithQueryRows([
        {
          walletAddress: '0xleader',
          totalUsd: '48500.000000000000000000',
          paymentCount: '3',
          latestPaymentAt,
        },
        {
          walletAddress: 'SoLanaBuyer111111111111111111111111111',
          totalUsd: '1200.5',
          paymentCount: '1',
          latestPaymentAt: '2026-06-25T09:00:00.000Z',
        },
      ]);

      const result = await service.listPublicLeaders(10);

      expect(paymentsRepository.createQueryBuilder).toHaveBeenCalledWith('payment');
      expect(queryBuilder.innerJoin).toHaveBeenCalledWith('payment.intent', 'intent');
      expect(queryBuilder.where).toHaveBeenCalledWith('payment.status = :status', {
        status: PaymentStatus.CONFIRMED,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('payment.sender_address IS NOT NULL');
      expect(queryBuilder.groupBy).toHaveBeenCalledWith('payment.sender_address');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('SUM(intent.usd_amount)', 'DESC');
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('MAX(payment.created_at)', 'DESC');
      expect(queryBuilder.limit).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        items: [
          {
            rank: 1,
            walletAddress: '0xleader',
            totalUsd: '48500',
            paymentCount: 3,
            latestPaymentAt,
          },
          {
            rank: 2,
            walletAddress: 'SoLanaBuyer111111111111111111111111111',
            totalUsd: '1200.5',
            paymentCount: 1,
            latestPaymentAt: new Date('2026-06-25T09:00:00.000Z'),
          },
        ],
      });
    });

    it('caps the public leaderboard limit', async () => {
      const { service, queryBuilder } = buildServiceWithQueryRows([]);

      await service.listPublicLeaders(200);

      expect(queryBuilder.limit).toHaveBeenCalledWith(50);
    });
  });
});
