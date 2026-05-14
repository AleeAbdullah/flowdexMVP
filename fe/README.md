1. User opens wallet page.
2. User chooses Alchemy Embedded or MetaMask.

3. If Alchemy:
   - existing AuthCard flow runs
   - backend links wallet as ALCHEMY_EMBEDDED
   - trustLevel = PROVIDER_ASSERTED

4. If MetaMask:
   - frontend connects window.ethereum
   - reads account and chainId
   - backend creates 10-minute challenge
   - user signs message
   - backend verifies signature
   - wallet is linked as METAMASK
   - trustLevel = SIGNED

5. User starts buy flow.
6. Frontend calls /transactions/simulate.
7. Backend creates/returns simulationId and expected payment terms.

8. Frontend checks selected wallet provider.

9. If Alchemy wallet:
   - use current Alchemy send path

10. If MetaMask wallet:
   - verify connected MetaMask account equals linked wallet
   - verify MetaMask chain equals simulation chain
   - send native transfer with eth_sendTransaction
   - get txHash

11. Frontend calls /transactions/track with simulationId and txHash.
12. Backend marks transaction pending/submitted only.

13. Alchemy webhook receives treasury activity.
14. Backend verifies inbound transfer:
   - to is treasury
   - from is linked wallet
   - network/chain matches
   - amount matches simulation
   - txHash matches tracked tx when available

15. Backend marks transaction confirmed.
16. User sees payment confirmed.

## Future production payment rails

The current `/buy` checkout implementation is EVM-only and uses provider-managed
`eth_sendTransaction` on configured EVM testnets. Do not wire production treasury
addresses into Sepolia checkout.

Reserved production/mainnet receiving addresses for the future payment rail work:

- Bitcoin mainnet: `bc1q7n84slhqfvm980lfrmr886nydq5024qy2crs8k`
- Ethereum mainnet: `0xeB95d66Bd0C149eEe0AACA006Fb00228235DcE81`
- Solana mainnet: `FEFZwPZy6r7Ni95AktZ8jd6m9TLUUEVPGnheUXx49GpL`

Next implementation step for BTC/SOL should add first-class payment rail types
such as `EVM`, `BTC`, and `SOL`, plus explicit treasury env vars. BTC/SOL v1
should use address checkout with copy/QR/manual reconciliation before adding
browser wallet-send support.
