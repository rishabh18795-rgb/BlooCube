"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import AdminLayout from "@/Components/Admin/AdminLayout";

type AdminUser = {
  _id: string; name: string; email: string; role: string; isActive: boolean; isVerified: boolean; createdAt: string;
  profile: { id: string; kind: "creator" | "brand"; verified: boolean } | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refetch = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleFilter) params.set("role", roleFilter);
    if (search.trim()) params.set("search", search.trim());
    const qs = params.toString() ? `?${params.toString()}` : "";
    apiRequest<{ success: boolean; data: { users: AdminUser[] } }>(`/api/admin/users${qs}`)
      .then((res) => setUsers(res.data.users))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(refetch, [roleFilter]);

  // Debounced search — avoid firing a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(refetch, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleActive = async (id: string, isActive: boolean) => {
    setBusyId(id);
    try {
      await apiRequest(`/api/admin/users/${id}/status`, { method: "PUT", body: JSON.stringify({ isActive: !isActive }) });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  const verifyProfile = async (profile: NonNullable<AdminUser["profile"]>) => {
    setBusyId(profile.id);
    try {
      await apiRequest(`/api/admin/${profile.kind}s/${profile.id}/verify`, { method: "PUT" });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="h-9 px-3 rounded-lg border border-slate-200 text-sm w-full sm:w-64"
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-9 px-3 rounded-lg border border-slate-200 text-sm">
            <option value="">All Roles</option>
            <option value="creator">Creators</option>
            <option value="brand">Brands</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Approval</th>
              <th className="text-left px-4 py-3">Joined</th>
              <th className="text-left px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-slate-400" colSpan={7}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td className="px-4 py-6 text-slate-400" colSpan={7}>No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{u.role}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {u.isActive ? "Active" : "Disabled"}
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
                    <button
                      onClick={() => toggleActive(u._id, u.isActive)}
                      disabled={busyId === u._id}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                    {u.profile && !u.profile.verified && (
                      <button
                        onClick={() => verifyProfile(u.profile!)}
                        disabled={busyId === u.profile.id}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
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
