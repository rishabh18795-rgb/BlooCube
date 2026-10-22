"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import OfficeAdminLayout from "@/Components/OfficeAdmin/OfficeAdminLayout";

type CampaignRow = { _id: string; title: string; status: string; brand: string; applications: number; createdAt: string };

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  draft: "bg-slate-100 text-slate-600",
  completed: "bg-indigo-50 text-indigo-700",
  paused: "bg-amber-50 text-amber-700",
  cancelled: "bg-red-50 text-red-700",
};

export default function OfficeCampaignsPage() {
  const [rows, setRows] = useState<CampaignRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiRequest<{ success: boolean; data: { campaigns: CampaignRow[] } }>("/api/admin/campaigns")
      .then((res) => setRows(res.data.campaigns))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter ? rows.filter((c) => c.status === statusFilter) : rows;
  const statuses = Array.from(new Set(rows.map((c) => c.status)));

  return (
    <OfficeAdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-1">{loading ? "Loading..." : `${filtered.length} of ${rows.length} campaigns`}</p>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-lg border border-slate-200 text-sm">
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr>
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Brand</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Applications</th>
              <th className="text-left px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-slate-400" colSpan={5}>Loading...</td></tr>
            ) : error ? (
              <tr><td className="px-4 py-6 text-red-600" colSpan={5}>Failed to load campaigns.</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-4 py-6 text-slate-400" colSpan={5}>No campaigns found.</td></tr>
            ) : (
              filtered.map((c) => (
                <tr key={c._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{c.title}</td>
                  <td className="px-4 py-3 text-slate-600">{c.brand}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[c.status] ?? "bg-slate-100 text-slate-600"}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.applications}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </OfficeAdminLayout>
  );
}
