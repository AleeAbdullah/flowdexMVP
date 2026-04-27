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