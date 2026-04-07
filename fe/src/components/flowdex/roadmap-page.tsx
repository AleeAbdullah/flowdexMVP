import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        title="A dedicated roadmap route for the product path from launch to FlowChain."
        description="The roadmap is now a standalone page rather than a section hidden deep on the landing page. It explains the product sequence and keeps the future-state narrative tied to phased delivery."
        meta={[
          { label: 'Phase 1', value: 'Ethereum Foundation' },
          { label: 'Phase 2', value: 'Multi-Chain Expansion' },
          { label: 'Phase 3', value: 'FlowChain' },
          { label: 'Current Focus', value: 'Presale + MVP App' },
        ]}
        actions={(
          <>
            <Button variant="brand" size="lg" asChild>
              <Link href="/buy">
                Buy Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="glass" size="lg" asChild>
              <Link href="/about">Read About</Link>
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
          description="The product should earn its more ambitious infrastructure claims by shipping the user-facing exchange surface first."
        >
          <div className="grid gap-4">
            {marketingRoadmap.map((item, index) => (
              <Card key={item.phase} className="border-white/8 bg-white/4">
                <CardHeader className="md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.28em] text-cyan-300 uppercase">
                      {item.phase}
                    </div>
                    <CardTitle className="mt-3">{item.title}</CardTitle>
                  </div>
                  <div className="font-data text-4xl text-slate-600">0{index + 1}</div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-8 text-slate-300">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </MarketingSection>

        <MarketingSection
          id="delivery"
          eyebrow="Delivery Logic"
          title="The roadmap should stay anchored to what the product can actually support."
          description="This route exists partly to separate aspirational infrastructure claims from what is already live."
        >
          <MarketingBody>
            <p>
              Phase 1 is about proving the exchange surface, presale infrastructure, and wallet-driven trust model. Phase 2 is about wider asset and chain coverage. FlowChain only makes sense once the application layer and routing model have earned that expansion.
            </p>
            <p>
              Separating this roadmap into its own route makes the sequence clearer and keeps the home page focused on entry, positioning, and conversion.
            </p>
          </MarketingBody>
        </MarketingSection>
      </MarketingContentShell>

      <MarketingCtaBand
        title="Roadmap context is useful. The whitepaper goes deeper."
        body="If you need the wider architecture and market framing behind these phases, move to the whitepaper. If you’re ready for action, go straight to the buy flow."
        primaryHref="/whitepaper"
        primaryLabel="Open Whitepaper"
        secondaryHref="/buy"
        secondaryLabel="Go to Buy"
      />
    </div>
  );
}
