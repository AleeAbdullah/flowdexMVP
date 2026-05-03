'use client';

import type { AdminTransactionFilters } from '@/dal/app/admin/admin.types';
import { TRANSACTION_STATUSES } from '@/dal/app/transactions/transactions.types';
import { WALLET_NETWORKS } from '@/dal/app/wallets/wallets.types';
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
          placeholder={`e.g. ${TRANSACTION_STATUSES.CONFIRMED}...`}
          onChange={value => props.onUpdateFilters({ status: value })}
        />
        <TextFilterField
          id="admin-filter-network"
          label="Network"
          value={props.filters.network ?? ''}
          placeholder={`e.g. ${WALLET_NETWORKS.BASE_SEPOLIA}...`}
          onChange={value => props.onUpdateFilters({ network: value })}
        />
        <TextFilterField
          id="admin-filter-asset-code"
          label="Asset Code"
          value={props.filters.assetCode ?? ''}
          placeholder="e.g. USDT_ERC20..."
          onChange={value => props.onUpdateFilters({ assetCode: value })}
        />
        <TextFilterField
          id="admin-filter-user-id"
          label="User ID"
          value={props.filters.userId ?? ''}
          placeholder="e.g. user_123..."
          onChange={value => props.onUpdateFilters({ userId: value })}
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
