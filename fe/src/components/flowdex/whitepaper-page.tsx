import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from '@/icons';
import { ROUTES } from '@/routes';
import {
  MarketingBody,
  MarketingBulletList,
  MarketingComparisonTable,
  MarketingContentShell,
  MarketingCtaBand,
  MarketingPageHero,
  MarketingSection,
  MarketingStatsGrid,
} from './marketing-content';

const keyFacts = [
  { label: 'Product', value: 'FlowDex Protocol', note: 'Crypto, tokenized stocks, forex, commodities, ETFs, options, futures, indices, and CFDs.' },
  { label: 'Coverage Goal', value: '500+ Assets', note: 'Across 10+ blockchains and multiple tokenization and routing sources.' },
  { label: 'Token', value: '$FDN', note: 'ERC-20 on Ethereum at launch with a fixed 10 billion supply.' },
  { label: 'Listing Reference', value: '$0.05', note: 'Framed in the whitepaper as a reference price, not a guarantee.' },
  { label: 'Buy Structure', value: '8 Tiers', note: 'Tier 1 begins at $0.001 with zero venture capital allocation in the whitepaper model.' },
  { label: 'Staking', value: '40% Fee Sharing', note: 'Stakers participate in protocol fee revenue and emission-based rewards.' },
];

const problemPoints = [
  'Fragmented access across crypto exchanges, stock brokers, forex brokers, and commodity platforms.',
  'Custodial risk created by depositing assets into centralized intermediaries.',
  'Geographic restrictions that block or degrade access to global markets.',
  'Market-hour and settlement inefficiencies compared with always-on crypto rails.',
  'Liquidity fragmentation across venues and chains, increasing slippage and execution cost.',
  'No practical cross-asset margin or composability across siloed asset platforms.',
];

const assetCoverage = [
  '1,000+ crypto assets across 10+ blockchains',
  '200+ tokenized stocks and ETFs',
  '50+ forex pairs',
  '30+ commodity instruments',
  'Indices, options, futures, and CFDs',
  'Cross-chain execution and hybrid routing paths',
];

const differentiators = [
  'Non-custodial execution with wallet-held assets until on-chain settlement.',
  'Crypto plus tokenized real-world asset coverage instead of crypto-only scope.',
  'Cross-chain routing direction across 10+ chains.',
  '40% fee sharing to stakers and quadratic governance direction.',
  'FlowChain appchain path for the long-term infrastructure layer.',
  'Routing-layer strategy rather than trying to become the primary asset issuer.',
];

const architecturePhases = [
  {
    label: 'Phase 1',
    value: 'Ethereum Foundation',
    note: 'ERC-20 launch, Ethereum routing, first-wave tokenized stocks, forex, gold, staking, and governance.',
  },
  {
    label: 'Phase 2',
    value: 'Multi-Chain + Full Asset Suite',
    note: 'Expansion to BSC, Solana, Arbitrum, Polygon, Avalanche, broader assets, mobile, and institutional APIs.',
  },
  {
    label: 'Phase 3',
    value: 'FlowChain Appchain',
    note: 'Purpose-built application chain for faster finality, routing optimization, and native validator staking.',
  },
];

const tokenomicsStats = [
  { label: 'Total Supply', value: '10B $FDN', note: 'Fixed, non-inflationary supply per the whitepaper narrative.' },
  { label: 'Community Facing', value: '75%', note: 'Community and ecosystem, public buy, staking rewards, and airdrop allocations dominate the token split.' },
  { label: 'Staking Pool', value: '1.25B', note: 'Distributed on a declining emission schedule over ten years.' },
  { label: 'Fee Share', value: '40%', note: 'Protocol fee participation for stakers across major fee categories.' },
  { label: 'Core Team Vesting', value: '1Y + 4Y', note: 'One-year cliff followed by four-year vesting in the document.' },
  { label: 'Initial Liquidity', value: '5%', note: 'Reserved for DEX/CEX pair support at launch.' },
];

const buyStats = [
  { label: 'Tier 1', value: '$0.001', note: 'Framed as the whitelist tier and deepest discount level.' },
  { label: 'Tier 8', value: '$0.05', note: 'Aligned to the listing reference in the document.' },
  { label: 'Tokens In Public Buy', value: '22.5%', note: '2,251,875,000 $FDN allocated across the tier structure.' },
  { label: 'Treasury Model', value: '4-of-7 Multisig', note: 'Quarterly on-chain transparency reports are part of the public framing.' },
  { label: 'Launch Safeguards', value: 'Published Protections', note: 'Investor-protection language is included in the vesting and protections section.' },
];

const competitiveRows = [
  { label: 'Crypto Trading', values: ['1000+ tokens, 50+ DEXs', '1300+ tokens', '200+ tokens', '170+ perps', 'Synthetic crypto'] },
  { label: 'Stocks / ETFs', values: ['200+ tokenized', 'Partial', 'Partial (~20)', 'No', 'No'] },
  { label: 'Forex', values: ['50+ pairs', 'Yes', 'No', 'No', 'Yes (limited)'] },
  { label: 'Commodities', values: ['30+ instruments', 'Yes', 'Gold only', 'No', 'Yes (limited)'] },
  { label: 'Non-Custodial', values: ['Always', 'No', 'Yes', 'Yes', 'Yes'] },
  { label: 'Own Blockchain', values: ['FlowChain (2027)', 'No', 'Yes (Cosmos)', 'Yes (Cosmos)', 'No'] },
];

const roadmapRows = [
  { label: 'Phase 0', value: 'Q1 2026', note: 'Whitepaper v6.0, website and whitelist, community channels, security audits, RWA partnerships, strategic partnerships.' },
  { label: 'Phase 1', value: 'Q2 2026', note: 'Buy flow, ERC-20 deployment, TGE, Ethereum aggregator, tokenized stocks, forex pairs, gold and commodities, staking, listings.' },
  { label: 'Phase 2', value: 'Q3–Q4 2026', note: 'Multi-chain rollout, 500+ assets, options and futures, cross-chain swaps, DAO, mobile app, institutional API.' },
  { label: 'Phase 3', value: '2027', note: 'FlowChain testnet, validator onboarding, token migration, faster execution, cross-asset margin, larger monthly volume goal.' },
  { label: 'Phase 4', value: '2028+', note: 'Maturity stage with validators, DAO handoff, structured products, analytics, and broader compliance posture.' },
];

const riskFactors = [
  'Technology risk around contracts, routing logic, cross-chain operations, and RWA integrations.',
  'Regulatory risk across jurisdictions and the possibility of changing treatment of tokenized assets or utility tokens.',
  'Market risk, including the possibility that the listing reference is never reached and that token value falls materially.',
  'RWA counterparty risk tied to the solvency and operation of tokenization providers.',
  'Competitive risk from centralized exchanges and other DeFi platforms expanding their asset coverage.',
  'Execution risk tied to project scope, delivery complexity, and the pseudonymous team structure.',
];

export function WhitepaperPage() {
  return (
    <div className="pb-12">
      <MarketingPageHero
        eyebrow="Whitepaper"
        title="FlowDex Network Whitepaper v6.0 rendered as a web-first public document."
        description="This page translates the March 2026 whitepaper into a readable marketing and due-diligence surface. It preserves the main structure of the document while compressing dense tables into a cleaner web experience."
        meta={[
          { label: 'Version', value: 'v6.0' },
          { label: 'Date', value: 'March 2026' },
          { label: 'Status', value: 'Public Release' },
          { label: 'Stage', value: 'Buy Flow Live' },
        ]}
        actions={(
          <>
            <Button variant="brand" size="lg" asChild>
              <Link href={ROUTES.MARKETING.BUY}>
                Buy Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="glass" size="lg" asChild>
              <a href={ROUTES.ASSETS.WHITEPAPER_DOC} download>
                Download Full Whitepaper
              </a>
            </Button>
          </>
        )}
      />

      <MarketingContentShell
        toc={[
          { id: 'summary', label: 'Executive Summary' },
          { id: 'facts', label: 'Key Facts' },
          { id: 'problem', label: 'The Problem' },
          { id: 'market', label: 'Market Opportunity' },
          { id: 'solution', label: 'FlowDex Solution' },
          { id: 'architecture', label: 'Architecture' },
          { id: 'infrastructure', label: 'Asset Infrastructure' },
          { id: 'tokenomics', label: 'Tokenomics' },
          { id: 'buy-structure', label: 'Buy Structure' },
          { id: 'governance', label: 'Governance & Security' },
          { id: 'competition', label: 'Competitive Analysis' },
          { id: 'team-roadmap', label: 'Team & Roadmap' },
          { id: 'risk', label: 'Risk Factors' },
          { id: 'disclaimer', label: 'Legal Notice' },
        ]}
      >
        <MarketingSection
          id="summary"
          eyebrow="Executive Summary"
          title="A non-custodial protocol that bridges blockchain rails and tokenized traditional assets."
          description="The whitepaper positions FlowDex as a single on-chain interface for crypto, tokenized equities, forex, commodities, ETFs, options, futures, and indices."
        >
          <MarketingBody>
            <p>
              The document argues that the key market trend of 2026 is the convergence of DeFi and tokenized traditional finance. FlowDex is framed as the missing non-custodial layer: a platform where users retain control of their wallets while still accessing broader market exposure across multiple asset classes.
            </p>
            <p>
              The product thesis combines smart order routing, cross-chain infrastructure, tokenized asset providers, and fee-sharing token utility into a phased roadmap that starts on Ethereum, expands to multi-chain coverage, and eventually moves toward a dedicated application chain called FlowChain.
            </p>
          </MarketingBody>
        </MarketingSection>

        <MarketingSection
          id="facts"
          eyebrow="Key Facts"
          title="The core whitepaper snapshot at a glance."
          description="These are the headline product, token, and market-position facts emphasized in the public document."
        >
          <MarketingStatsGrid items={keyFacts} />
        </MarketingSection>

        <MarketingSection
          id="problem"
          eyebrow="The Problem"
          title="FlowDex is framed as a response to fragmentation, custody risk, and siloed market access."
          description="The whitepaper identifies six structural pain points in the current trading landscape."
        >
          <MarketingBulletList items={problemPoints} columns={2} />
        </MarketingSection>

        <MarketingSection
          id="market"
          eyebrow="Market Opportunity"
          title="The opportunity sits at the intersection of crypto, forex, tokenized RWAs, and tokenized TradFi demand."
          description="The document’s market narrative is intentionally broad: FlowDex is not pitched as a niche exchange, but as a universal market access layer."
        >
          <MarketingStatsGrid
            items={[
              { label: 'Crypto Exchange Market', value: '$85.75B', note: 'Whitepaper estimate for the 2026 market value of the broader crypto exchange category.' },
              { label: 'DEX Opportunity', value: '$100B–$260B / month', note: 'Aggregation-focused opportunity highlighted in the market section.' },
              { label: 'Global Forex', value: '$9.6T / day', note: 'The largest market in the world and a major part of the FlowDex Protocol thesis.' },
              { label: 'Tokenized RWAs', value: '$18.5B → $50B+', note: 'Projected acceleration of the tokenized real-world asset category.' },
            ]}
          />
        </MarketingSection>

        <MarketingSection
          id="solution"
          eyebrow="FlowDex Solution"
          title="A routing and execution layer rather than a new asset issuer."
          description="The solution section focuses on asset breadth, smart routing, and differentiated market posture."
        >
          <MarketingBulletList items={assetCoverage} columns={2} />
          <div className="mt-6">
            <MarketingBody>
              <p>
                In the whitepaper, FlowDex does not claim to tokenize every market itself. Instead, it acts as the routing and execution layer across DEXs, tokenized asset providers, oracle-priced synthetic pools, and cross-chain paths to find better outcomes for the user.
              </p>
            </MarketingBody>
          </div>
          <div className="mt-6">
            <MarketingBulletList items={differentiators} columns={2} />
          </div>
        </MarketingSection>

        <MarketingSection
          id="architecture"
          eyebrow="Platform Architecture"
          title="A phased architecture from Ethereum product launch to FlowChain infrastructure."
          description="The architecture is deliberately staged so the product earns the right to deeper infrastructure over time."
        >
          <MarketingStatsGrid items={architecturePhases} />
        </MarketingSection>

        <MarketingSection
          id="infrastructure"
          eyebrow="Tokenized Asset Infrastructure"
          title="Use established tokenization and oracle providers instead of reinventing the issuance layer."
          description="The whitepaper’s infrastructure story depends on partner-issued assets and a redundant oracle stack."
        >
          <MarketingBody>
            <p>
              FlowDex’s RWA strategy is aggregation-first. The document references providers such as Ondo Finance, Backed Finance, Dinari, Paxos, Tether Gold, and Synthetix rather than proposing that FlowDex itself becomes the originator of every tradable asset.
            </p>
            <p>
              Oracle infrastructure is similarly redundant. Pyth, Chainlink, on-chain TWAPs, and Band are described as overlapping pricing inputs used to improve routing and price integrity for tokenized assets and synthetic markets.
            </p>
          </MarketingBody>
        </MarketingSection>

        <MarketingSection
          id="tokenomics"
          eyebrow="Tokenomics"
          title="$FDN is positioned as fee-sharing, governance, routing-priority, and network-security infrastructure."
          description="The document emphasizes utility and long-term ecosystem economics rather than simple exchange-token discount mechanics."
        >
          <MarketingStatsGrid items={tokenomicsStats} />
        </MarketingSection>

        <MarketingSection
          id="buy-structure"
          eyebrow="Buy Structure"
          title="An eight-tier public buy structure with zero venture capital allocation."
          description="The public document frames launch access as community-led, heavily tiered, and paired with treasury transparency and vesting protections."
        >
          <MarketingStatsGrid items={buyStats} />
          <div className="mt-6">
            <MarketingBody>
              <p>
                The whitepaper positions Tier 1 at $0.001 and Tier 8 at $0.05, using that spread to illustrate early-access incentive and listing-reference framing. It also ties launch access to a 4-of-7 multisig treasury, quarterly transparency reports, and investor-protection language such as audits and vesting discipline.
              </p>
            </MarketingBody>
          </div>
        </MarketingSection>

        <MarketingSection
          id="governance"
          eyebrow="Governance and Security"
          title="Quadratic voting, a security council, audits, bug bounty posture, and immutable-contract intent."
          description="These sections are central to how FlowDex presents credibility and operational safety."
        >
          <MarketingBody>
            <p>
              Governance in the whitepaper is structured around staked-token proposal thresholds, a seven-day voting window, quorum requirements, supermajority rules for critical changes, and a timelock before execution. A nine-member security council is positioned as the emergency-response mechanism.
            </p>
            <p>
              The security section highlights a multi-firm audit plan, formal verification, bug bounty direction, anomaly detection, multi-sig treasury discipline, and a multi-bridge security model. These are part of the public trust narrative and should remain visible, but still be interpreted as roadmap posture until fully delivered.
            </p>
          </MarketingBody>
        </MarketingSection>

        <MarketingSection
          id="competition"
          eyebrow="Competitive Analysis"
          title="The whitepaper positions FlowDex as the only non-custodial multi-asset surface spanning crypto and tokenized TradFi."
          description="This section is comparative and directional, not a guarantee of market outcome."
        >
          <MarketingComparisonTable
            columns={['FlowDex', 'Bitget TradFi', 'Injective / Helix', 'dYdX', 'Synthetix']}
            rows={competitiveRows}
          />
        </MarketingSection>

        <MarketingSection
          id="team-roadmap"
          eyebrow="Team and Roadmap"
          title="A pseudonymous team posture with milestone-based delivery and progressive trust building."
          description="The team section explicitly prioritizes product fundamentals and security over personality-driven branding."
        >
          <MarketingStatsGrid items={roadmapRows} />
          <div className="mt-6">
            <MarketingBody>
              <p>
                The team section explains the pseudonymous operating model as a deliberate choice grounded in product-first evaluation and operator safety. The roadmap then turns that into a delivery sequence from Phase 0 foundation work to long-term maturity and DAO-led expansion.
              </p>
            </MarketingBody>
          </div>
        </MarketingSection>

        <MarketingSection
          id="risk"
          eyebrow="Risk Factors"
          title="The public document is explicit that this product and token model carry meaningful risk."
          description="This page preserves the direction of those warnings rather than treating them as fine print."
        >
          <MarketingBulletList items={riskFactors} columns={2} />
        </MarketingSection>

        <MarketingSection
          id="disclaimer"
          eyebrow="Legal Notice"
          title="This whitepaper is informational and should not be interpreted as legal, financial, or investment advice."
          description="The legal notice is a substantive part of the document and should be read alongside the rest of the product narrative."
        >
          <MarketingBody>
            <p>
              The whitepaper explicitly states that it is for informational purposes only and does not constitute an offer or solicitation to sell securities or regulated financial instruments. It also says that $FDN is intended as a utility token and that no representation or warranty is made regarding the completeness or reliability of the document.
            </p>
            <p>
              It further notes that participation may be restricted in certain jurisdictions, that tokenized assets are issued by third-party providers with their own risks, and that forward-looking statements in the document are estimates rather than guarantees. Any formal legal review should supersede this launch-phase rendering when available.
            </p>
          </MarketingBody>
        </MarketingSection>
      </MarketingContentShell>

      <MarketingCtaBand
        content={{
          title: 'Read the thesis, then move to the live public buy surface.',
          body: 'The whitepaper gives the full strategic narrative. The buy page is where that narrative already starts connecting to live backend-fed pricing and tier data.',
          primary: { href: '/buy', label: 'Buy Now' },
          secondary: { href: '/about', label: 'About FlowDex' },
        }}
      />
    </div>
  );
}
