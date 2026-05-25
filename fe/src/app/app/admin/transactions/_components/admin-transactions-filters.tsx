'use client';

import type { AdminTransactionFilters } from '@/dal/app/admin/admin.types';
import { PAYMENT_STATUSES } from '@/dal/app/payments/payments.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassPanel } from '@/components/flowdex/primitives';
import { FormField } from '../../../_components/form-field';

type UpdateAdminTransactionFilters = (
  updates: Partial<AdminTransactionFilters>,
) => Promise<URLSearchParams>;

export function AdminTransactionsFilters(props: {
  filters: AdminTransactionFilters;
  onUpdateFilters: UpdateAdminTransactionFilters;
  onResetFilters: () => Promise<URLSearchParams>;
}) {
  return (
    <GlassPanel className="p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TextFilterField
          id="admin-filter-status"
          label="Status"
          value={props.filters.status ?? ''}
          placeholder={`e.g. ${PAYMENT_STATUSES.CONFIRMED}...`}
          onChange={value => props.onUpdateFilters({ status: value })}
        />
        <TextFilterField
          id="admin-filter-chain"
          label="Chain"
          value={props.filters.chain ?? ''}
          placeholder="e.g. ETHEREUM..."
          onChange={value => props.onUpdateFilters({ chain: value })}
        />
        <TextFilterField
          id="admin-filter-asset"
          label="Asset"
          value={props.filters.asset ?? ''}
          placeholder="e.g. ETH..."
          onChange={value => props.onUpdateFilters({ asset: value })}
        />
        <TextFilterField
          id="admin-filter-sender-address"
          label="Sender Address"
          value={props.filters.senderAddress ?? ''}
          placeholder="e.g. 0xabc..."
          onChange={value => props.onUpdateFilters({ senderAddress: value })}
        />
        <TextFilterField
          id="admin-filter-receiver-address"
          label="Receiver Address"
          value={props.filters.receiverAddress ?? ''}
          placeholder="e.g. bc1..."
          onChange={value => props.onUpdateFilters({ receiverAddress: value })}
        />
        <DateTimeFilterField
          id="admin-filter-from"
          label="From"
          value={props.filters.from ?? ''}
          onChange={value => props.onUpdateFilters({ from: value })}
        />
        <DateTimeFilterField
          id="admin-filter-to"
          label="To"
          value={props.filters.to ?? ''}
          onChange={value => props.onUpdateFilters({ to: value })}
        />
      </div>

      <div className="mt-4">
        <Button variant="glass" onClick={() => { void props.onResetFilters(); }}>
          Reset filters
        </Button>
      </div>
    </GlassPanel>
  );
}

function TextFilterField(props: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => Promise<URLSearchParams>;
}) {
  return (
    <FormField id={props.id} label={props.label}>
      <Input
        id={props.id}
        name={props.id}
        autoComplete="off"
        spellCheck={false}
        value={props.value}
        onChange={event => { void props.onChange(event.target.value); }}
        placeholder={props.placeholder}
        className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
      />
    </FormField>
  );
}

function DateTimeFilterField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => Promise<URLSearchParams>;
}) {
  return (
    <FormField id={props.id} label={props.label}>
      <Input
        id={props.id}
        name={props.id}
        autoComplete="off"
        type="datetime-local"
        value={props.value}
        onChange={event => { void props.onChange(event.target.value); }}
        className="h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]"
      />
    </FormField>
  );
}
