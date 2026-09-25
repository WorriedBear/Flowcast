import { useRouteError } from 'react-router-dom';

export function RouteError() {
  const err = useRouteError() as Error | undefined;
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-[28px] font-semibold text-ink">Something went wrong on this page</h1>
      <p className="mt-2 text-sm text-muted">{err?.message ?? 'An unexpected error occurred.'} Saved demo state may be from an older version. Resetting usually fixes it.</p>
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" className="rounded-ctl bg-action px-4 py-2 text-sm font-medium text-white" onClick={() => { try { localStorage.removeItem('flowcast-v1'); } catch { /* storage unavailable */ } window.location.href = '/'; }}>Reset demo and reload</button>
        <a href="/" className="rounded-ctl border border-rule px-4 py-2 text-sm font-medium">Go home</a>
      </div>
    </div>
  );
}
