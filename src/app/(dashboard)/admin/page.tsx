"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import AdminLayout from "@/Components/Admin/AdminLayout";

type Overview = {
  users: number; creators: number; brands: number; campaigns: number; activeCampaigns: number;
  applications: number; collaborations: number; gmv: number; platformCommission: number;
  openDisputes: number; pendingApprovals: number; pendingCreatorApprovals: number;
  pendingBrandApprovals: number; pendingWithdrawals: number;
};

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ success: boolean; data: Overview }>("/api/admin/overview")
      .then((res) => setOverview(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const tiles = [
    { label: "Total Users", value: overview?.users },
    { label: "Creators", value: overview?.creators },
    { label: "Brands", value: overview?.brands },
    { label: "Total Campaigns", value: overview?.campaigns },
    { label: "Active Campaigns", value: overview?.activeCampaigns },
    { label: "Applications", value: overview?.applications },
    { label: "Collaborations", value: overview?.collaborations },
    { label: "GMV (Released)", value: overview ? `₹${overview.gmv.toLocaleString("en-IN")}` : undefined },
    { label: "Platform Commission", value: overview ? `₹${overview.platformCommission.toLocaleString("en-IN")}` : undefined },
    { label: "Pending Approvals", value: overview?.pendingApprovals, hint: overview ? `${overview.pendingCreatorApprovals} creators, ${overview.pendingBrandApprovals} brands` : undefined },
    { label: "Pending Withdrawals", value: overview?.pendingWithdrawals },
    { label: "Open Disputes", value: overview?.openDisputes },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Platform Overview</h1>
      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : error ? (
        <p className="text-sm text-red-600">Failed to load platform overview. Try refreshing.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="text-xs text-slate-500">{t.label}</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{t.value ?? "—"}</div>
              {t.hint && <div className="text-xs text-slate-400 mt-1">{t.hint}</div>}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
