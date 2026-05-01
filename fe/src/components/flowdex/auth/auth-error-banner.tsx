export function AuthErrorBanner(props: {
  message: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-400/20 bg-rose-500/8 px-4 py-3 text-sm text-rose-100"
    >
      {props.message}
    </div>
  );
}
