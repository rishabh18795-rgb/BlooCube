"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import OfficeAdminLayout from "@/Components/OfficeAdmin/OfficeAdminLayout";

type PaymentRow = { _id: string; amount: number; platformFee: number; netAmount: number; status: string; campaign: string; createdAt: string };
type WithdrawalRow = { _id: string; amount: number; method: string; status: string; user: string; createdAt: string };

const STATUS_COLORS: Record<string, string> = {
  released: "bg-emerald-50 text-emerald-700",
  in_escrow: "bg-amber-50 text-amber-700",
  initiated: "bg-slate-100 text-slate-600",
  refunded: "bg-red-50 text-red-700",
  completed: "bg-emerald-50 text-emerald-700",
  processing: "bg-amber-50 text-amber-700",
  pending: "bg-slate-100 text-slate-600",
  failed: "bg-red-50 text-red-700",
};

export default function OfficeFinancePage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refetch = () => {
    setLoading(true);
    Promise.all([
      apiRequest<{ success: boolean; data: { payments: PaymentRow[] } }>("/api/admin/payments"),
      apiRequest<{ success: boolean; data: { withdrawals: WithdrawalRow[] } }>("/api/admin/withdrawals"),
    ])
      .then(([p, w]) => {
        setPayments(p.data.payments);
        setWithdrawals(w.data.withdrawals);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(refetch, []);

  const setWithdrawalStatus = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await apiRequest(`/api/admin/withdrawals/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) });
      refetch();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <OfficeAdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Finance</h1>
        <p className="text-sm text-slate-500 mt-1">
          Payments and withdrawals are tracked against a <strong>mock</strong> payment provider — no real transactions move through this system.
        </p>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">Failed to load finance data.</p>}

      <h2 className="text-sm font-semibold text-slate-700 mb-2">Transactions</h2>
      <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr>
              <th className="text-left px-4 py-3">Campaign</th>
              <th className="text-left px-4 py-3">Gross</th>
              <th className="text-left px-4 py-3">Commission</th>
              <th className="text-left px-4 py-3">Net</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-slate-400" colSpan={6}>Loading...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td className="px-4 py-6 text-slate-400" colSpan={6}>No transactions found.</td></tr>
            ) : (
              payments.map((p) => (
                <tr key={p._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.campaign}</td>
                  <td className="px-4 py-3 text-slate-600">₹{p.amount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-slate-600">₹{p.platformFee.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-slate-600">₹{p.netAmount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[p.status] ?? "bg-slate-100 text-slate-600"}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-sm font-semibold text-slate-700 mb-2">Withdrawal Requests</h2>
      <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr>
              <th className="text-left px-4 py-3">Creator</th>
              <th className="text-left px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Method</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Requested</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-slate-400" colSpan={6}>Loading...</td></tr>
            ) : withdrawals.length === 0 ? (
              <tr><td className="px-4 py-6 text-slate-400" colSpan={6}>No withdrawal requests.</td></tr>
            ) : (
              withdrawals.map((w) => (
                <tr key={w._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{w.user}</td>
                  <td className="px-4 py-3 text-slate-600">₹{w.amount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-slate-600 uppercase text-xs">{w.method}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[w.status] ?? "bg-slate-100 text-slate-600"}`}>{w.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(w.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 space-x-3">
                    {(w.status === "pending" || w.status === "processing") && (
                      <>
                        <button
                          onClick={() => setWithdrawalStatus(w._id, "completed")}
                          disabled={busyId === w._id}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                        >
                          Mark Completed
                        </button>
                        <button
                          onClick={() => setWithdrawalStatus(w._id, "failed")}
                          disabled={busyId === w._id}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                        >
                          Mark Failed (refund)
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </OfficeAdminLayout>
  );
}
