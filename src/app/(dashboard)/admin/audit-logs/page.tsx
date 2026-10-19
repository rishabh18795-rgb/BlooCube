"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import AdminLayout from "@/Components/Admin/AdminLayout";

type AuditLog = {
  _id: string;
  actor: { name: string; email: string } | null;
  action: string;
  details: { target?: string; outcome?: string; [key: string]: unknown } | null;
  createdAt: string;
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiRequest<{ success: boolean; data: { logs: AuditLog[] } }>("/api/admin/audit-logs?limit=100")
      .then((res) => setLogs(res.data.logs))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Audit Logs</h1>
      <p className="text-sm text-slate-500 mb-6">Sensitive administrative actions — who did what, and when.</p>

      <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr>
              <th className="text-left px-4 py-3">When</th>
              <th className="text-left px-4 py-3">Actor</th>
              <th className="text-left px-4 py-3">Action</th>
              <th className="text-left px-4 py-3">Target</th>
              <th className="text-left px-4 py-3">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-slate-400" colSpan={5}>Loading...</td></tr>
            ) : error ? (
              <tr><td className="px-4 py-6 text-red-600" colSpan={5}>Failed to load audit logs.</td></tr>
            ) : logs.length === 0 ? (
              <tr><td className="px-4 py-6 text-slate-400" colSpan={5}>No administrative actions recorded yet.</td></tr>
            ) : (
              logs.map((l) => (
                <tr key={l._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-700">{l.actor ? `${l.actor.name} (${l.actor.email})` : "Unknown"}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{l.action}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs font-mono">{l.details?.target ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${l.details?.outcome === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {l.details?.outcome ?? "—"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
