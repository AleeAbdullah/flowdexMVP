export function AuthErrorBanner(props: {
  message: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-[var(--status-error-border)] bg-[var(--status-error-surface)] px-4 py-3 text-sm text-[var(--status-error-text)]"
    >
      {props.message}
    </div>
  );
}
