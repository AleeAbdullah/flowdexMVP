## Developer onboarding

- Buy page crash course: [docs/buy-page-crash-course.md](docs/buy-page-crash-course.md)
- Frontend standards: [docs/project-structure-and-best-practices.md](docs/project-structure-and-best-practices.md)

## Wallet and transaction flow sketch

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

## Production payment rails

The `/buy` checkout implementation uses provider-managed wallet sends:
EVM uses `eth_sendTransaction`, Solana uses MetaMask Solana, Bitcoin uses
MetaMask Bitcoin or Xverse, and TRON uses MetaMask TRON with TronLink as a direct fallback.

Reserved production/mainnet receiving addresses:

- Bitcoin mainnet: `bc1q7n84slhqfvm980lfrmr886nydq5024qy2crs8k`
- Ethereum mainnet: `0xeB95d66Bd0C149eEe0AACA006Fb00228235DcE81`
- Solana mainnet: `FEFZwPZy6r7Ni95AktZ8jd6m9TLUUEVPGnheUXx49GpL`

Keep production treasury env vars explicit per chain and verify each wallet path
against its matching mainnet receiver before enabling a new asset.
