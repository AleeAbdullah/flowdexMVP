import Image from 'next/image';
import { Wallet } from '@/icons';
import { getWalletConnectorIconSrc } from '@/constants/wallet-connector-icons';
import { cn } from '@/lib/utils';

export function WalletConnectorIcon(props: {
  connectorName: string;
  className?: string;
  size?: number;
}) {
  const src = getWalletConnectorIconSrc(props.connectorName);
  const size = props.size ?? 20;

  if (!src) {
    return <Wallet className={cn('h-5 w-5 shrink-0', props.className)} aria-hidden="true" />;
  }

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={cn('h-5 w-5 shrink-0 object-contain', props.className)}
      aria-hidden="true"
      unoptimized
    />
  );
}
