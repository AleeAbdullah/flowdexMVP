import Image from 'next/image';
import { PAYMENT_INTENT_STATUSES } from '@/dal/app/payments/payments.types';
import { cn } from '@/lib/utils';

export function FlowdexWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/icon.svg"
        alt=""
        aria-hidden="true"
        width={64}
        height={64}
        priority={!compact}
        className={cn('shrink-0 object-contain', compact ? 'h-10 w-10' : 'h-16 w-16')}
      />
      {!compact ? (
        <div className="leading-none">
          <div className="font-heading text-lg font-bold tracking-tight text-[var(--text)]">FlowDex</div>
          <div className="text-[10px] font-semibold tracking-[0.28em] text-[var(--cyan)] uppercase">
            FlowDex Protocol
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SectionHeading(props: {
  as?: 'h1' | 'h2';
  eyebrow: string;
  title: string;
  description: string;
  align?: 'left' | 'center';
}) {
  const Heading = props.as ?? 'h2';

  return (
    <div className={cn('max-w-3xl space-y-4', props.align === 'center' && 'mx-auto text-center')}>
      <div className="inline-flex rounded-full border border-[var(--accent-border)] bg-[var(--accent-bg)] px-4 py-1 text-[10px] font-bold tracking-[0.35em] text-[var(--cyan)] uppercase">
        {props.eyebrow}
      </div>
      <Heading className="font-heading text-balance text-3xl font-bold tracking-tight text-[var(--text)] md:text-5xl">
        {props.title}
      </Heading>
      <p className="text-balance text-sm leading-7 text-[var(--muted)] md:text-base">
        {props.description}
      </p>
    </div>
  );
}

export function DataKicker(props: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', props.className)}>
      <div className="text-[10px] font-semibold tracking-[0.32em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
        {props.label}
      </div>
      <div className="font-data font-semibold text-[var(--text)] text-md">{props.value}</div>
    </div>
  );
}

const statusToneMap: Record<string, string> = {
  [PAYMENT_INTENT_STATUSES.WAITING]: 'border-[var(--status-warning-border)] bg-[var(--status-warning-surface)] text-[var(--status-warning-text)]',
  [PAYMENT_INTENT_STATUSES.DETECTED]: 'border-[var(--status-info-border)] bg-[var(--status-info-surface)] text-[var(--status-info-text)]',
  [PAYMENT_INTENT_STATUSES.CONFIRMING]: 'border-[var(--status-info-border)] bg-[var(--status-info-surface)] text-[var(--status-info-text)]',
  [PAYMENT_INTENT_STATUSES.CONFIRMED]: 'border-[var(--status-success-border)] bg-[var(--status-success-surface)] text-[var(--status-success-text)]',
  [PAYMENT_INTENT_STATUSES.FAILED]: 'border-[var(--status-error-border)] bg-[var(--status-error-surface)] text-[var(--status-error-text)]',
  [PAYMENT_INTENT_STATUSES.UNDERPAID]: 'border-[var(--status-warning-border)] bg-[var(--status-warning-surface)] text-[var(--status-warning-text)]',
  [PAYMENT_INTENT_STATUSES.OVERPAID]: 'border-[var(--status-warning-border)] bg-[var(--status-warning-surface)] text-[var(--status-warning-text)]',
  [PAYMENT_INTENT_STATUSES.EXPIRED]: 'border-[var(--status-neutral-border)] bg-[var(--status-neutral-surface)] text-[var(--status-neutral-text)]',
  [PAYMENT_INTENT_STATUSES.LATE_PAID]: 'border-[var(--status-warning-border)] bg-[var(--status-warning-surface)] text-[var(--status-warning-text)]',
  PENDING: 'border-[var(--status-warning-border)] bg-[var(--status-warning-surface)] text-[var(--status-warning-text)]',
  APPROVED: 'border-[var(--status-info-border)] bg-[var(--status-info-surface)] text-[var(--status-info-text)]',
  SENT: 'border-[var(--status-info-border)] bg-[var(--status-info-surface)] text-[var(--status-info-text)]',
  DROPPED: 'border-[var(--status-neutral-border)] bg-[var(--status-neutral-surface)] text-[var(--status-neutral-text)]',
  SUBMITTED: 'border-[var(--status-warning-border)] bg-[var(--status-warning-surface)] text-[var(--status-warning-text)]',
};

export function StatusPill(props: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-3 py-1 text-[10px] font-bold tracking-[0.24em] uppercase',
        statusToneMap[props.status] ?? 'border-[var(--status-neutral-border)] bg-[var(--status-neutral-surface)] text-[var(--status-neutral-text)]',
        props.className,
      )}
    >
      {props.status}
    </span>
  );
}
