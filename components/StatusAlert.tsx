export function StatusAlert({ success, error }: { success?: string | null; error?: string | null }) {
  if (!success && !error) return null;

  return (
    <div className="mb-4 space-y-3">
      {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{success}</div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
    </div>
  );
}
