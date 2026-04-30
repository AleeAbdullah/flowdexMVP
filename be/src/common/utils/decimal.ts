const DECIMAL_SCALE = 18;
const DECIMAL_FACTOR = 10n ** BigInt(DECIMAL_SCALE);

export function parseFixed(value: string | number, scale = DECIMAL_SCALE): bigint {
  const normalized = String(value).trim();

  if (!normalized) {
    return 0n;
  }

  const match = normalized.match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/);
  if (!match) {
    throw new SyntaxError(`Invalid decimal value: ${normalized}`);
  }

  const [, sign, wholeDigits = '', fractionalDigitsFromWhole = '', fractionalDigitsOnly = '', exponentRaw] = match;
  const fractionalDigits = fractionalDigitsOnly || fractionalDigitsFromWhole;
  const digits = `${wholeDigits}${fractionalDigits}`.replace(/^0+(?=\d)/, '') || '0';
  const exponent = exponentRaw ? Number.parseInt(exponentRaw, 10) : 0;
  const shift = exponent - fractionalDigits.length + scale;

  let result = BigInt(digits);
  if (shift >= 0) {
    result *= 10n ** BigInt(shift);
  } else {
    result /= 10n ** BigInt(-shift);
  }

  return sign === '-' ? -result : result;
}

export function formatFixed(value: bigint, scale = DECIMAL_SCALE): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const factor = 10n ** BigInt(scale);
  const whole = absolute / factor;
  const fraction = absolute % factor;

  if (fraction === 0n) {
    return `${negative ? '-' : ''}${whole.toString()}`;
  }

  const fractionText = fraction
    .toString()
    .padStart(scale, '0')
    .replace(/0+$/, '');

  return `${negative ? '-' : ''}${whole.toString()}.${fractionText}`;
}

export function addFixed(left: string | number, right: string | number): string {
  return formatFixed(parseFixed(left) + parseFixed(right));
}

export function subtractFixed(left: string | number, right: string | number): string {
  return formatFixed(parseFixed(left) - parseFixed(right));
}

export function multiplyFixed(left: string | number, right: string | number): string {
  return formatFixed((parseFixed(left) * parseFixed(right)) / DECIMAL_FACTOR);
}

export function divideFixed(left: string | number, right: string | number): string {
  const divisor = parseFixed(right);

  if (divisor === 0n) {
    return '0';
  }

  return formatFixed((parseFixed(left) * DECIMAL_FACTOR) / divisor);
}

export function compareFixed(left: string | number, right: string | number): number {
  const leftValue = parseFixed(left);
  const rightValue = parseFixed(right);

  if (leftValue === rightValue) {
    return 0;
  }

  return leftValue > rightValue ? 1 : -1;
}

export function normalizeFixed(value: string | number): string {
  return formatFixed(parseFixed(value));
}

export function rescaleIntegerToFixed(value: bigint, fromDecimals: number): string {
  if (fromDecimals === DECIMAL_SCALE) {
    return formatFixed(value);
  }

  if (fromDecimals > DECIMAL_SCALE) {
    const divisor = 10n ** BigInt(fromDecimals - DECIMAL_SCALE);
    return formatFixed(value / divisor);
  }

  const multiplier = 10n ** BigInt(DECIMAL_SCALE - fromDecimals);
  return formatFixed(value * multiplier);
}
