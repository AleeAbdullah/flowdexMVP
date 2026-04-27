'use client';

import type { ReactNode } from 'react';

export default function LayoutKBar(props: {
  children: ReactNode;
  mode?: 'public' | 'protected';
}) {
  return (
    <div
      data-layout-mode={props.mode ?? 'public'}
      className="w-full"
    >
      {props.children}
    </div>
  );
}
