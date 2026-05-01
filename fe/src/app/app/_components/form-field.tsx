import type { ReactNode } from 'react';

export function FormField(props: {
  id: string;
  label: string;
  children: ReactNode;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={props.id}
        className="text-xs font-semibold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase"
      >
        {props.label}
      </label>
      {props.children}
      {props.description ? (
        <p className="text-sm leading-6 text-[var(--muted)]">{props.description}</p>
      ) : null}
    </div>
  );
}
