"use client";
import { useState } from "react";

type Metrics = {
  mrrEstimate: number;
  subscriptionsActive: number;
  churnPercent: number;
  newStores30d: number;
};

export default function OwnerMetricsSync({ initial }: { initial: Metrics }) {
  const [metrics, setMetrics] = useState<Metrics>(initial);
  const [loading, setLoading] = useState(false);

  async function sync() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sync-metrics", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      const data = await res.json();
      setMetrics({
        mrrEstimate: data.mrrEstimate ?? metrics.mrrEstimate,
        subscriptionsActive: data.subscriptionsActive ?? metrics.subscriptionsActive,
        churnPercent: data.churnPercent ?? metrics.churnPercent,
        newStores30d: data.newStores30d ?? metrics.newStores30d
      });
    } catch (e) {
      console.error(e);
      alert("Error al sincronizar métricas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-2xl bg-gray-50 p-3 text-sm">
          <div className="text-xs text-gray-500">MRR (30d)</div>
          <div className="font-black">{new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(metrics.mrrEstimate)}</div>
        </div>
        <div className="rounded-2xl bg-gray-50 p-3 text-sm">
          <div className="text-xs text-gray-500">Suscripciones</div>
          <div className="font-black">{metrics.subscriptionsActive}</div>
        </div>
        <div className="rounded-2xl bg-gray-50 p-3 text-sm">
          <div className="text-xs text-gray-500">Churn %</div>
          <div className="font-black">{metrics.churnPercent}%</div>
        </div>
        <div className="rounded-2xl bg-gray-50 p-3 text-sm">
          <div className="text-xs text-gray-500">Nuevas tiendas (30d)</div>
          <div className="font-black">{metrics.newStores30d}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={sync} disabled={loading} className="rounded-2xl bg-black px-4 py-2 text-sm font-black text-white">
          {loading ? "Sincronizando…" : "Sincronizar métricas"}
        </button>
        <button onClick={() => location.reload()} className="rounded-2xl border px-4 py-2 text-sm font-black">
          Refrescar página
        </button>
      </div>
    </div>
  );
}
