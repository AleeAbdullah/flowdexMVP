const FIAT_CURRENCIES = new Set([
  'usd',
  'eur',
  'gbp',
  'cad',
  'aud',
  'jpy',
  'pkr',
  'inr',
  'brl',
  'chf',
  'cny',
  'hkd',
  'sgd',
]);

export function parseMarketNumber(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatMarketPrice(value: string | null, quoteCurrency: string): string {
  const parsed = parseMarketNumber(value);
  if (parsed === null) {
    return '-';
  }

  const decimals = Math.abs(parsed) >= 100
    ? 2
    : Math.abs(parsed) >= 1
      ? 4
      : 6;

  if (FIAT_CURRENCIES.has(quoteCurrency.toLowerCase())) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: quoteCurrency.toUpperCase(),
      maximumFractionDigits: decimals,
      minimumFractionDigits: Math.min(2, decimals),
    }).format(parsed);
  }

  return `${formatPlainMarketNumber(parsed, decimals)} ${quoteCurrency.toUpperCase()}`;
}

export function formatMarketCompact(value: string | null, quoteCurrency?: string): string {
  const parsed = parseMarketNumber(value);
  if (parsed === null) {
    return '-';
  }

  const compact = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(parsed);

  if (!quoteCurrency) {
    return compact;
  }

  return FIAT_CURRENCIES.has(quoteCurrency.toLowerCase())
    ? `${currencyPrefix(quoteCurrency)}${compact}`
    : `${compact} ${quoteCurrency.toUpperCase()}`;
}

export function formatMarketPercent(value: string | null): string {
  const parsed = parseMarketNumber(value);
  if (parsed === null) {
    return '-';
  }

  const sign = parsed > 0 ? '+' : '';
  return `${sign}${parsed.toFixed(2)}%`;
}

export function formatMarketUpdatedAt(value: string | null): string {
  if (!value) {
    return 'Provider timestamp unavailable';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Provider timestamp unavailable';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function formatPlainMarketNumber(value: number, decimals: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: value >= 1 ? Math.min(2, decimals) : 0,
  }).format(value);
}

function currencyPrefix(quoteCurrency: string): string {
  const parts = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: quoteCurrency.toUpperCase(),
    notation: 'compact',
    maximumFractionDigits: 0,
  }).formatToParts(1);

  return parts.find(part => part.type === 'currency')?.value ?? `${quoteCurrency.toUpperCase()} `;
}
