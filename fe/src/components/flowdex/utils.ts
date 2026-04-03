export function parseDecimal(value?: string | number | null) {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value: string | number, maximumFractionDigits = 3) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits,
  }).format(parseDecimal(value));
}

export function formatCompact(value: string | number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits,
  }).format(parseDecimal(value));
}

export function formatPlainNumber(value: string | number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(parseDecimal(value));
}

export function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}
