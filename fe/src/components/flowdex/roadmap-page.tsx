import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from '@/icons';
import { ROUTES } from '@/routes';
import {
  MarketingBody,
  MarketingContentShell,
  MarketingCtaBand,
  MarketingPageHero,
  MarketingSection,
} from './marketing-content';
import { marketingRoadmap } from './marketing-data';

export function RoadmapPage() {
  return (
    <div className="pb-12">
      <MarketingPageHero
        eyebrow="Roadmap"
        title="The path from launch access to the wider FlowDex market vision."
        description="Follow the rollout from early wallet-based access to broader market coverage and the long-term network plan."
        meta={[
          { label: 'Phase 1', value: 'Ethereum Foundation' },
          { label: 'Phase 2', value: 'Multi-Chain Expansion' },
          { label: 'Phase 3', value: 'FlowChain' },
          { label: 'Current Focus', value: 'Buy Flow' },
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
              <Link href={ROUTES.MARKETING.ABOUT}>Read About</Link>
            </Button>
          </>
        )}
      />

      <MarketingContentShell
        toc={[
          { id: 'phases', label: 'Phases' },
          { id: 'delivery', label: 'Delivery Logic' },
        ]}
      >
        <MarketingSection
          id="phases"
          eyebrow="Phases"
          title="The roadmap is intentionally sequential."
          description="Each phase builds on the one before it, starting with a focused public experience and expanding from there."
        >
          <div className="grid gap-4">
            {marketingRoadmap.map((item, index) => (
              <Card key={item.phase}>
                <CardHeader className="md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.28em] text-[var(--cyan)] uppercase">
                      {item.phase}
                    </div>
                    <CardTitle className="mt-3">{item.title}</CardTitle>
                  </div>
                  <div className="font-data text-4xl text-[color-mix(in_srgb,var(--text)_28%,transparent)]">0{index + 1}</div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-8 text-[var(--muted)]">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </MarketingSection>

        <MarketingSection
          id="delivery"
          eyebrow="Delivery Logic"
          title="The roadmap stays anchored to a practical delivery path."
          description="The sequence is designed to keep the product focused while the platform expands."
        >
          <MarketingBody>
            <p>
              Phase 1 focuses on launch access, wallet-based participation, and a clear purchase experience. Phase 2 expands into broader asset coverage and more chain support. FlowChain becomes relevant once the product layer has earned that next step.
            </p>
            <p>
              Keeping the roadmap separate makes it easier to explore the long-term direction without slowing down the main entry and purchase flow.
            </p>
          </MarketingBody>
        </MarketingSection>
      </MarketingContentShell>

      <MarketingCtaBand
        content={{
          title: 'Roadmap context is useful. The whitepaper goes deeper.',
          body: 'If you need the wider architecture and market framing behind these phases, move to the whitepaper. If you’re ready for action, go straight to the buy flow.',
          primary: { href: ROUTES.MARKETING.WHITEPAPER, label: 'Open Whitepaper' },
          secondary: { href: ROUTES.MARKETING.BUY, label: 'Buy Now' },
        }}
      />
    </div>
  );
}
