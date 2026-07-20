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
        title="Frequently asked questions."
        description="Answers about FlowDex Protocol, non-custodial trading, the Blockchain Intelligence Layer, presale participation, $FDP utility, staking, supply, and security planning."
        meta={[
          { label: 'Audience', value: 'Prospective Buyers and Community' },
          { label: 'Scope', value: 'Product, Presale, Custody, Token Utility' },
          { label: 'Format', value: 'Dedicated Public FAQ' },
          { label: 'Questions', value: '11' },
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
          title="Still have questions?"
          description="Start with the most common product, presale, token, staking, and security questions before moving into the whitepaper or community channels."
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
          title: 'Still have questions?',
          body: 'Read the full whitepaper for the long-form protocol narrative, or continue into the public buy page when you are ready to participate.',
          primary: { href: ROUTES.MARKETING.WHITEPAPER, label: 'Read Whitepaper' },
          secondary: { href: ROUTES.MARKETING.BUY, label: 'Buy Now' },
        }}
      />
    </div>
  );
}
