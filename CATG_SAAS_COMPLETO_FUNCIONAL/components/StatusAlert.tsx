export function StatusAlert({ success, error }: { success?: string | null; error?: string | null }) {
  if (!success && !error) return null;

  return (
    <div className="mb-4 w-full space-y-3">
      {success && <div className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-700">{success}</div>}
      {error && <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-700">{error}</div>}
    </div>
  );
}
