export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

export function getEthereumProvider(): EthereumProvider | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return (window as unknown as { ethereum?: EthereumProvider }).ethereum ?? null;
}

export function toHexValue(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return '0x0';
  }
  if (trimmed.startsWith('0x')) {
    return trimmed;
  }

  return `0x${BigInt(trimmed).toString(16)}`;
}
