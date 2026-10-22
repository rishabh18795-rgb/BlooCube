"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import OfficeAdminLayout from "@/Components/OfficeAdmin/OfficeAdminLayout";

type BrandRow = {
  _id: string; name: string; email: string; isActive: boolean; isVerified: boolean; createdAt: string;
  profile: { id: string; kind: "creator" | "brand"; verified: boolean } | null;
};

export default function OfficeBrandsPage() {
  const [rows, setRows] = useState<BrandRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ user: BrandRow; nextActive: boolean } | null>(null);
  const [reason, setReason] = useState("");

  const refetch = () => {
    setLoading(true);
    const params = new URLSearchParams({ role: "brand" });
    if (search.trim()) params.set("search", search.trim());
    apiRequest<{ success: boolean; data: { users: BrandRow[] } }>(`/api/admin/users?${params.toString()}`)
      .then((res) => setRows(res.data.users))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(refetch, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const verify = async (profileId: string) => {
    setBusyId(profileId);
    try {
      await apiRequest(`/api/admin/brands/${profileId}/verify`, { method: "PUT" });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  const confirmStatusChange = async () => {
    if (!confirmTarget) return;
    setBusyId(confirmTarget.user._id);
    try {
      await apiRequest(`/api/admin/users/${confirmTarget.user._id}/status`, {
        method: "PUT",
        body: JSON.stringify({ isActive: confirmTarget.nextActive, reason: reason || undefined }),
      });
      setConfirmTarget(null);
      setReason("");
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <OfficeAdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Brand Management</h1>
          <p className="text-sm text-slate-500 mt-1">{loading ? "Loading..." : `${rows.length} brand${rows.length === 1 ? "" : "s"}`}</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="h-9 px-3 rounded-lg border border-slate-200 text-sm w-full sm:w-72"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr>
              <th className="text-left px-4 py-3">Company</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Verification</th>
              <th className="text-left px-4 py-3">Joined</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-slate-400" colSpan={6}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-4 py-6 text-slate-400" colSpan={6}>No brands found.</td></tr>
            ) : (
              rows.map((u) => (
                <tr key={u._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {u.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.profile ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.profile.verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {u.profile.verified ? "Verified" : "Pending"}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 space-x-3">
                    {u.profile && !u.profile.verified && (
                      <button
                        onClick={() => verify(u.profile!.id)}
                        disabled={busyId === u.profile.id}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmTarget({ user: u, nextActive: !u.isActive })}
                      disabled={busyId === u._id}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                    >
                      {u.isActive ? "Suspend" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {confirmTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              {confirmTarget.nextActive ? "Reactivate" : "Suspend"} {confirmTarget.user.name}?
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              This change is logged in the audit trail and takes effect immediately.
            </p>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm mb-4"
              placeholder="e.g. Policy violation reported via support"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setConfirmTarget(null); setReason(""); }}
                className="px-4 h-9 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={busyId === confirmTarget.user._id}
                className={`px-4 h-9 rounded-lg text-sm font-semibold text-white disabled:opacity-60 ${
                  confirmTarget.nextActive ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Confirm {confirmTarget.nextActive ? "Reactivate" : "Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </OfficeAdminLayout>
  );
}
