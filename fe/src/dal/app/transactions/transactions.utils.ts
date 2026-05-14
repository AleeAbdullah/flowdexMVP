const SIMULATION_REASON_MESSAGES = {
  ALCHEMY_API_KEY_NOT_CONFIGURED: 'Transaction simulation is not configured for this environment yet.',
  SIMULATION_INVALID_RESPONSE: 'The transaction simulation returned an invalid response. Try again in a moment.',
  SIMULATION_PROVIDER_INTERNAL_ERROR: 'The simulation provider returned an internal error. Try again in a moment.',
  SIMULATION_INSUFFICIENT_FUNDS: 'The connected wallet does not have enough ETH to cover this contribution and the required network gas.',
  SIMULATION_REVERTED: 'The transaction would revert on chain. Check the amount and selected asset, then try again.',
  SIMULATION_NO_ASSET_CHANGE: 'The configured treasury recipient for this network did not produce any asset movement. Check the selected chain and treasury address, then try again.',
  TREASURY_ADDRESS_MATCHES_CONNECTED_WALLET: 'The connected wallet matches the configured treasury recipient. Use a different wallet or update the treasury address for this network.',
  TREASURY_ADDRESS_RESERVED: 'The configured treasury recipient for this network is a reserved system address. Update the treasury address and try again.',
} as const;

export function describeTransactionSimulationReason(reason: string | null | undefined) {
  if (!reason) {
    return 'The contribution was blocked by the server-side simulation.';
  }

  return SIMULATION_REASON_MESSAGES[reason as keyof typeof SIMULATION_REASON_MESSAGES] ?? reason;
}
