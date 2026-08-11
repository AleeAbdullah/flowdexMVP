import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { ArrowRight, ChartNoAxesCombined, Landmark, ShieldCheck, Workflow } from '@/icons';
import { marketingFeatureCards } from './marketing-data';
import { LandingHeroCarousel } from './landing-hero-carousel';
import { LandingNewsletterForm } from './landing-newsletter-form';
import {
  landingFaqHighlights,
  landingFeeDistribution,
  landingFeatureTones,
  landingHeroSlides,
  landingMarketStats,
  landingRoadmapHighlights,
  landingTeamHighlights,
  landingTokenDistribution,
  landingTrustSignals,
} from './landing-page.data';
import { GlassPanel } from '@/components/glass-panel';
import { SectionHeading } from './primitives';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes';

const marketPillars = [
  {
    icon: Landmark,
    title: 'Market Breadth',
    body: 'Bring crypto-native users closer to tokenized equities, forex, and commodities without leaving a coherent exchange story.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust Boundary',
    body: 'Keep the wallet as the primary trust surface instead of rebuilding the same custody assumptions as a broker silo.',
  },
  {
    icon: Workflow,
    title: 'Routing Logic',
    body: 'Aggregate fragmented liquidity and asset rails instead of pretending one venue can natively own every market.',
  },
];

export function LandingPage() {
  return (
    <div className="pb-12">
      <LandingHeroCarousel slides={landingHeroSlides} />

      <section id="market-thesis" className="section-shell section-pad scroll-mt-28">
        <SectionHeading
          eyebrow="Market Thesis"
          title="One wallet interface. Endless global markets."
          description="FlowDex delivers a unified, non-custodial market surface bringing decentralized crypto liquidity and institutional real-world asset tokenization under a single architecture. No custodial silos, no fragmented capital allocation."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {landingMarketStats.map(stat => (
            <Card key={stat.label} className="p-5">
              <div className="font-data text-3xl font-semibold text-[var(--accent-strong)]">{stat.value}</div>
              <div className="mt-2 text-[11px] font-semibold tracking-[0.26em] text-[var(--muted)] uppercase">
                {stat.label}
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {landingTrustSignals.map(signal => (
            <Badge key={signal} variant="subtle" className="gap-2 px-4 py-2 normal-case tracking-normal">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-strong)]" />
              {signal}
            </Badge>
          ))}
        </div>
      </section>

      <section className="section-shell grid gap-4 md:grid-cols-3">
        {marketPillars.map(item => {
          const Icon = item.icon;
          return (
            <GlassPanel key={item.title} className="p-6">
              <div className="inline-flex rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] p-3 text-[var(--accent-strong)]">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </div>
              <h3 className="font-heading mt-5 text-2xl font-bold tracking-tight text-[var(--text)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-8 text-[var(--muted)]">{item.body}</p>
            </GlassPanel>
          );
        })}
      </section>

      <section id="product-pillars" className="section-shell section-pad scroll-mt-28">
        <SectionHeading
          eyebrow="Product Pillars"
          title="Built for the sovereign investor."
          description="Trade digital assets and traditional tokenized instruments side-by-side with sub-second execution speeds, automated routing intelligence, and native security layers."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {marketingFeatureCards.map((feature, index) => (
            <Card
              key={feature.title}
              className={cn('border-l-4 p-6', landingFeatureTones[index % landingFeatureTones.length].borderClass)}
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={cn('h-3 w-3 rounded-full', landingFeatureTones[index % landingFeatureTones.length].dotClass)}
                />
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{feature.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="tokenomics" className="section-shell scroll-mt-28 py-12 md:py-14">
        <SectionHeading
          eyebrow="Tokenomics Snapshot"
          title="Value aligned with network volume."
          description="The $FDP token utility loops directly back into platform adoption. Every trade across our universal asset ecosystem fuels staker revenue and deflationary mechanics."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <GlassPanel className="p-6">
            <div className="flex items-center gap-3">
              <ChartNoAxesCombined aria-hidden="true" className="h-5 w-5 text-[var(--accent-strong)]" />
              <CardTitle>Distribution Overview</CardTitle>
            </div>
            <div className="mt-6 space-y-4">
              {landingTokenDistribution.map(item => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-[var(--text)]">{item.label}</span>
                    <span className="font-data text-[var(--muted)]">{item.percentage}% · {item.tokens}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--track)]">
                    <div
                      className={cn('h-full rounded-full', item.colorClass)}
                      style={{ width: `${item.percentage * 3.33}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>

          <div className="grid gap-6">
            <GlassPanel className="p-6">
              <CardTitle>Fee Participation</CardTitle>
              <div className="mt-2 text-sm text-[var(--muted)]">Illustrative split used in the public narrative.</div>
              <div className="mt-6 space-y-4">
                {landingFeeDistribution.map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className={cn('h-2.5 w-2.5 rounded-sm', item.colorClass)} />
                    <span className="flex-1 text-sm text-[var(--text)]">{item.label}</span>
                    <span className="font-data text-sm font-semibold text-[var(--text)]">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <div className="text-[10px] font-bold tracking-[0.3em] text-[var(--muted)] uppercase">
                Next Step
              </div>
              <div className="font-heading mt-3 text-2xl font-bold tracking-tight text-[var(--text)]">
                Explore the full token model on the dedicated route.
              </div>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Keep the landing page sharp. Let the route-level pages hold the full context.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="brand" size="sm" asChild>
                  <Link href={ROUTES.MARKETING.TOKENOMICS}>Open Tokenomics</Link>
                </Button>
                <Button variant="glass" size="sm" asChild>
                  <Link href={ROUTES.MARKETING.BUY}>Buy Now</Link>
                </Button>
              </div>
            </GlassPanel>
          </div>
        </div>
      </section>

      <section id="roadmap" className="section-shell scroll-mt-28 py-10 md:py-12">
        <SectionHeading
          eyebrow="Roadmap"
          title="A clear path from first access to a broader market network."
          description="FlowDex starts with wallet-first access, expands into more markets and chains, then moves toward dedicated infrastructure built for always-on global trading."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {landingRoadmapHighlights.map((item, index) => (
            <Card key={item.phase} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold tracking-[0.28em] text-[var(--accent-strong)] uppercase">{item.phase}</div>
                  <CardTitle className="mt-3 text-xl">{item.title}</CardTitle>
                </div>
                <div className="font-data text-4xl text-[color-mix(in_srgb,var(--text)_24%,transparent)]">0{index + 1}</div>
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{item.body}</p>
            </Card>
          ))}
        </div>
        <div className="mt-8">
          <Button variant="glass" asChild>
            <Link href={ROUTES.MARKETING.ROADMAP}>
              Explore the Roadmap
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section id="team" className="section-shell scroll-mt-28 py-10 md:py-12">
        <SectionHeading
          eyebrow="Team"
          title="A product-first team posture with progressive trust building."
          description="The public story should make the operating model visible without turning the page into personality-led promotion."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {landingTeamHighlights.map((item, index) => (
            <GlassPanel key={item.title} className="p-6">
              <div className="font-data text-sm font-semibold text-[var(--accent-strong)]">0{index + 1}</div>
              <CardTitle className="mt-4 text-xl">{item.title}</CardTitle>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.body}</p>
            </GlassPanel>
          ))}
        </div>
      </section>

      <section id="faq" className="section-shell section-pad scroll-mt-28">
        <SectionHeading
          eyebrow="FAQ Preview"
          title="Answer the obvious questions quickly, then move people to the deeper routes."
          description="This keeps the homepage readable while still surfacing the most common objections and clarifications."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {landingFaqHighlights.map(item => (
            <GlassPanel key={item.question} className="p-6">
              <h3 className="font-heading text-xl font-bold tracking-tight text-[var(--text)]">{item.question}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.answer}</p>
            </GlassPanel>
          ))}
        </div>
        <div className="mt-8">
          <Button variant="glass" asChild>
            <Link href={ROUTES.MARKETING.FAQ}>Open FAQ Route</Link>
          </Button>
        </div>
      </section>

      <section className="section-shell py-10 md:py-12">
        <GlassPanel className="rounded-[1.5rem] border-[var(--accent-border)] bg-[var(--accent-bg)] p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <SectionHeading
                eyebrow="Stay Close"
                title="Use the homepage as the front door. Use the route pages for the research."
                description="The public buy flow already reads live pricing and tier configuration. Tokenomics, roadmap, FAQ, and blog routes provide the supporting research, with the whitepaper available as a PDF."
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="brand" size="lg" asChild>
                  <Link href={ROUTES.MARKETING.BUY}>Buy Now</Link>
                </Button>
                <Button variant="glass" size="lg" asChild>
                  <Link href={ROUTES.ASSETS.WHITEPAPER_PDF} target="_blank" rel="noreferrer">Read Whitepaper</Link>
                </Button>
              </div>
            </div>

            <LandingNewsletterForm />
          </div>
        </GlassPanel>
      </section>
    </div>
  );
}
