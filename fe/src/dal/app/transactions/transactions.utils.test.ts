import { describe, expect, it } from 'vitest';
import { describeTransactionSimulationReason } from './transactions.utils';

describe('describeTransactionSimulationReason', () => {
  it('maps reserved treasury addresses to actionable copy', () => {
    expect(describeTransactionSimulationReason('TREASURY_ADDRESS_RESERVED')).toContain(
      'reserved system address',
    );
  });

  it('maps self-recipient treasury addresses to actionable copy', () => {
    expect(describeTransactionSimulationReason('TREASURY_ADDRESS_MATCHES_CONNECTED_WALLET')).toContain(
      'matches the configured treasury recipient',
    );
  });

  it('maps no-asset-change simulation failures to treasury guidance', () => {
    expect(describeTransactionSimulationReason('SIMULATION_NO_ASSET_CHANGE')).toContain(
      'did not produce any asset movement',
    );
  });

  it('falls back to the raw reason when no mapping exists', () => {
    expect(describeTransactionSimulationReason('SOME_UNKNOWN_REASON')).toBe('SOME_UNKNOWN_REASON');
  });
});
