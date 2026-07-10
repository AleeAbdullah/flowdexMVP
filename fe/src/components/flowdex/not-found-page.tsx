import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/glass-panel';
import { ArrowRight, Home, Search } from '@/icons';
import { ROUTES } from '@/routes';
import { FlowdexWordmark, SectionHeading } from './primitives';

export function FlowdexNotFoundPage(props: {
  variant?: 'marketing' | 'app';
}) {
  const isApp = props.variant === 'app';

  return (
    <section className={isApp ? 'section-shell py-16 md:py-24' : 'section-shell pb-20 pt-4 md:pb-28 md:pt-10'}>
      <GlassPanel className="relative overflow-hidden border border-[var(--accent-border)] p-6 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_srgb,var(--accent-strong)_16%,transparent),transparent_28%),radial-gradient(circle_at_82%_24%,color-mix(in_srgb,var(--cyan)_12%,transparent),transparent_24%)]" />

        <div className="relative grid gap-10 lg:grid-cols-[1fr_0.82fr] lg:items-center">
          <div className="space-y-8">
            <FlowdexWordmark compact />
            <SectionHeading
              as="h1"
              eyebrow="404"
              title="This market route is not available."
              description="The page may have moved, expired, or never existed. Return to the FlowDex overview or continue to the live buy surface."
            />
            <div className="flex flex-wrap gap-3">
              <Button variant="brand" asChild>
                <Link href={ROUTES.MARKETING.HOME}>
                  <Home aria-hidden className="h-4 w-4" />
                  Home
                </Link>
              </Button>
              <Button variant="glass" asChild>
                <Link href={ROUTES.MARKETING.BUY}>
                  Open buy
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[1rem] border border-[var(--card-border)] bg-[color-mix(in_srgb,var(--card-bg)_78%,transparent)] p-5 md:p-6">
            <div className="flex items-center gap-3 text-[var(--cyan)]">
              <Search aria-hidden className="h-5 w-5" />
              <div className="text-sm font-bold uppercase tracking-[0.24em]">Route scan</div>
            </div>
            <div className="mt-6 grid gap-3 text-sm text-[var(--muted)]">
              <RouteHint label="Protocol overview" href={ROUTES.MARKETING.HOME} />
              <RouteHint label="Token buy flow" href={ROUTES.MARKETING.BUY} />
              <RouteHint label="FAQ" href={ROUTES.MARKETING.FAQ} />
              <RouteHint label="Whitepaper" href={ROUTES.MARKETING.WHITEPAPER} />
            </div>
          </div>
        </div>
      </GlassPanel>
    </section>
  );
}

function RouteHint(props: {
  label: string;
  href: string;
}) {
  return (
    <Link
      href={props.href}
      className="flex items-center justify-between rounded-[0.75rem] border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 text-[var(--text)] transition hover:border-[var(--accent-border)] hover:text-[var(--accent-strong)]"
    >
      <span>{props.label}</span>
      <ArrowRight aria-hidden className="h-4 w-4" />
    </Link>
  );
}
