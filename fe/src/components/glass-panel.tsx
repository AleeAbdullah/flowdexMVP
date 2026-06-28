import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type GlassPanelTag = 'div' | 'section' | 'aside' | 'nav';

export function GlassPanel(props: {
  as?: GlassPanelTag;
  children: ReactNode;
  className?: string;
}) {
  const Component = props.as ?? 'div';

  return (
    <Component className={cn('glass-panel rounded-[1.35rem]', props.className)}>
      {props.children}
    </Component>
  );
}
