import type { HTMLAttributes } from 'react';
import { Input } from '@/components/ui/input';
import type { AuthFieldErrors, AuthMode } from './auth-form.types';

function AuthField(props: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete?: string;
  autoCapitalize?: string;
  spellCheck?: boolean;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  minLength?: number;
  error?: string;
}) {
  const describedBy = props.error ? `${props.name}-error` : undefined;

  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold tracking-[0.24em] text-[color-mix(in_srgb,var(--text)_52%,transparent)] uppercase">
        {props.label}
      </span>
      <Input
        name={props.name}
        type={props.type}
        value={props.value}
        onChange={event => props.onChange(event.target.value)}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        autoCapitalize={props.autoCapitalize}
        spellCheck={props.spellCheck}
        inputMode={props.inputMode}
        minLength={props.minLength}
        aria-invalid={props.error ? true : undefined}
        aria-describedby={describedBy}
        className="h-12 bg-[var(--card-bg)] text-[var(--text)]"
        required
      />
      {props.error ? (
        <div id={`${props.name}-error`} className="text-sm text-[var(--status-error-text)]">
          {props.error}
        </div>
      ) : null}
    </label>
  );
}

export function AuthFields(props: {
  mode: AuthMode;
  values: {
    displayName: string;
    email: string;
    password: string;
  };
  fieldErrors: AuthFieldErrors;
  onDisplayNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
}) {
  void props.mode;

  return (
    <>
      <AuthField
        label="Email"
        name="email"
        type="email"
        value={props.values.email}
        onChange={props.onEmailChange}
        placeholder="operator@flowdex.io"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        inputMode="email"
        error={props.fieldErrors.email}
      />

      <AuthField
        label="Password"
        name="password"
        type="password"
        value={props.values.password}
        onChange={props.onPasswordChange}
        placeholder="Enter your password"
        autoComplete="current-password"
        minLength={8}
        error={props.fieldErrors.password}
      />
    </>
  );
}
