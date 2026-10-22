"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import OfficeAdminLayout from "@/Components/OfficeAdmin/OfficeAdminLayout";

type Dispute = { id: string; status: string; resolution?: string | null; createdAt: string; [key: string]: unknown };

export default function OfficeDisputesPage() {
  const [rows, setRows] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resolutionDraft, setResolutionDraft] = useState<Record<string, string>>({});

  const refetch = () => {
    setLoading(true);
    apiRequest<{ success: boolean; data: { disputes: Dispute[] } }>("/api/admin/disputes")
      .then((res) => setRows(res.data.disputes))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(refetch, []);

  const resolve = async (id: string) => {
    setBusyId(id);
    try {
      await apiRequest(`/api/admin/disputes/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "resolved", resolution: resolutionDraft[id] || "" }),
      });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <OfficeAdminLayout>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Disputes</h1>

      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-600">Failed to load disputes.</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-400">No disputes recorded.</p>
        ) : (
          rows.map((d) => (
            <div key={d.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs ${d.status === "open" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {d.status}
                </span>
                <span className="text-xs text-slate-400">{new Date(d.createdAt).toLocaleString()}</span>
              </div>
              {d.status === "open" ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={resolutionDraft[d.id] ?? ""}
                    onChange={(e) => setResolutionDraft((prev) => ({ ...prev, [d.id]: e.target.value }))}
                    placeholder="Resolution notes..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  />
                  <button
                    onClick={() => resolve(d.id)}
                    disabled={busyId === d.id}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                  >
                    Mark Resolved
                  </button>
                </div>
              ) : (
                d.resolution && <p className="text-sm text-slate-600 mt-2">Resolution: {d.resolution}</p>
              )}
            </div>
          ))
        )}
      </div>
    </OfficeAdminLayout>
  );
}
