'use client';

import type { AdminTransactionFilters } from '@/dal/app/admin/admin.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GlassPanel } from '@/components/glass-panel';
import { FormField } from '../../../_components/form-field';
import {
  ADMIN_FILTER_ALL_VALUE,
  adminAssetFilterOptions,
  adminChainFilterOptions,
  adminStatusFilterOptions,
} from '../constants';

type UpdateAdminTransactionFilters = (
  updates: Partial<AdminTransactionFilters>,
) => Promise<URLSearchParams>;

const selectTriggerClassName = 'h-12 border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text)]';

export function AdminTransactionsFilters(props: {
  filters: AdminTransactionFilters;
  onUpdateFilters: UpdateAdminTransactionFilters;
  onResetFilters: () => Promise<URLSearchParams>;
}) {
  return (
    <GlassPanel className="p-6">
      <div className="space-y-2">
        <div className="text-sm font-semibold text-[var(--text)]">Filter payments</div>
        <p className="text-sm leading-6 text-[var(--muted)]">
          Narrow the operational ledger by lifecycle status, network, asset, wallet, or date window.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <EnumFilterField
          id="admin-filter-status"
          label="Status"
          value={props.filters.status ?? ''}
          options={adminStatusFilterOptions}
          onChange={value => props.onUpdateFilters({ status: value })}
        />
        <EnumFilterField
          id="admin-filter-chain"
          label="Chain"
          value={props.filters.chain ?? ''}
          options={adminChainFilterOptions}
          onChange={value => props.onUpdateFilters({ chain: value })}
        />
        <EnumFilterField
          id="admin-filter-asset"
          label="Asset"
          value={props.filters.asset ?? ''}
          options={adminAssetFilterOptions}
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

function EnumFilterField(props: {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => Promise<URLSearchParams>;
}) {
  return (
    <FormField id={props.id} label={props.label}>
      <Select
        value={props.value || ADMIN_FILTER_ALL_VALUE}
        onValueChange={value => {
          void props.onChange(value === ADMIN_FILTER_ALL_VALUE ? '' : value);
        }}
      >
        <SelectTrigger id={props.id} className={selectTriggerClassName}>
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ADMIN_FILTER_ALL_VALUE}>All</SelectItem>
          {props.options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
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
