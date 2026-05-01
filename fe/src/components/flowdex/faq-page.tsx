import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from '@/icons';
import { ROUTES } from '@/routes';
import {
  MarketingContentShell,
  MarketingCtaBand,
  MarketingPageHero,
  MarketingSection,
} from './marketing-content';
import { marketingFaqs } from './marketing-data';

export function FaqPage() {
  return (
    <div className="pb-12">
      <MarketingPageHero
        eyebrow="FAQ"
        title="Route-level answers to the launch questions people actually ask."
        description="The FAQ no longer lives as a late-page section on the landing page. It now has its own route so the public site can answer product and presale questions directly."
        meta={[
          { label: 'Audience', value: 'Prospective Buyers and Community' },
          { label: 'Scope', value: 'Product • Presale • Custody • Market Positioning' },
          { label: 'Format', value: 'Dedicated Public FAQ' },
          { label: 'Updated', value: 'April 2026' },
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
              <Link href={ROUTES.MARKETING.ABOUT}>About FlowDex</Link>
            </Button>
          </>
        )}
      />

      <MarketingContentShell>
        <MarketingSection
          eyebrow="Questions"
          title="The public site should answer the obvious questions without making users hunt."
          description="A dedicated FAQ route removes the need to scroll through a long landing page just to clarify the basics."
        >
          <Accordion type="single" collapsible className="space-y-3">
            {marketingFaqs.map(item => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </MarketingSection>
      </MarketingContentShell>

      {/* TODO(flowdex): Revisit MarketingCtaBand API once the shared marketing content refactor is scheduled. */}
      <MarketingCtaBand
        content={{
          title: 'If the questions are resolved, the next step is either research or participation.',
          body: 'Move into the whitepaper for the long-form version, or go to the public buy page if you already understand the product and presale frame.',
          primary: { href: ROUTES.MARKETING.WHITEPAPER, label: 'Read Whitepaper' },
          secondary: { href: ROUTES.MARKETING.BUY, label: 'Go to Buy' },
        }}
      />
    </div>
  );
}
