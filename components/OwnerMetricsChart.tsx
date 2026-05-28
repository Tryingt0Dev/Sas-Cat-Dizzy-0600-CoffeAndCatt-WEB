"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  Title
} from "chart.js";
import { useEffect, useState } from "react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler, Title);

type Props = {
  initialLabels: string[];
  initialRevenues: number[];
  initialNewStores: number[];
  initialChurn: number[];
};

export default function OwnerMetricsChart({ initialLabels, initialRevenues, initialNewStores, initialChurn }: Props) {
  const [labels, setLabels] = useState(initialLabels);
  const [revenues, setRevenues] = useState(initialRevenues);
  const [newStores, setNewStores] = useState(initialNewStores);
  const [churn, setChurn] = useState(initialChurn);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLabels(initialLabels);
    setRevenues(initialRevenues);
    setNewStores(initialNewStores);
    setChurn(initialChurn);
  }, [initialLabels, initialRevenues, initialNewStores, initialChurn]);

  async function fetchRange(d: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/metrics-history?days=${d}`);
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      setLabels(json.labels ?? []);
      setRevenues(json.revenues ?? []);
      setNewStores(json.newStores ?? []);
      setChurn(json.churn ?? []);
      setDays(d);
    } catch (e) {
      console.error(e);
      alert("Error cargando métricas");
    } finally {
      setLoading(false);
    }
  }

  const data = {
    labels,
    datasets: [
      {
        label: "Ingresos",
        data: revenues,
        fill: true,
        backgroundColor: "rgba(2,6,23,0.06)",
        borderColor: "#0f172a",
        yAxisID: "y"
      },
      {
        label: "Nuevas tiendas",
        data: newStores,
        fill: false,
        borderColor: "#059669",
        yAxisID: "y1"
      },
      {
        label: "Churn (events)",
        data: churn,
        fill: false,
        borderColor: "#dc2626",
        yAxisID: "y1"
      }
    ]
  } as any;

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true },
      tooltip: { mode: "index", intersect: false },
      title: { display: false }
    },
    interaction: { mode: "index", intersect: false },
    scales: {
      x: { display: true, ticks: { maxRotation: 0, autoSkip: true } },
      y: { type: "linear", display: true, position: "left", ticks: { callback: (v: any) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(Number(v)) } },
      y1: { type: "linear", display: true, position: "right", grid: { drawOnChartArea: false } }
    }
  } as any;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black mb-2">Métricas históricas</h3>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => fetchRange(d)} disabled={loading || days === d} className={`rounded-2xl px-3 py-1 text-xs font-black ${days === d ? 'bg-black text-white' : 'border'}`}>
              {d}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: 200 }}>
        <Line data={data as any} options={options} />
      </div>
    </div>
  );
}
