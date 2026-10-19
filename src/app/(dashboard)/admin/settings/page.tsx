"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";
import { profileApi } from "@/lib/profile";
import AdminLayout from "@/Components/Admin/AdminLayout";

export default function AdminSettingsPage() {
  const [creatorPrice, setCreatorPrice] = useState(199);
  const [platformFeePercent, setPlatformFeePercent] = useState(10);
  const [saved, setSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const changePassword = async () => {
    setPasswordStatus(null);
    if (newPassword.length < 6) {
      setPasswordStatus({ type: "error", message: "New password must be at least 6 characters." });
      return;
    }
    try {
      setChangingPassword(true);
      await profileApi.changePassword({ currentPassword, newPassword });
      setPasswordStatus({ type: "success", message: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      setPasswordStatus({ type: "error", message: err instanceof Error ? err.message : "Failed to change password." });
    } finally {
      setChangingPassword(false);
    }
  };

  useEffect(() => {
    apiRequest<{ success: boolean; data: { settings: Record<string, unknown> } }>("/api/admin/settings")
      .then((res) => {
        const s = res.data.settings as { creatorMembershipPriceInr?: number; platformFeePercent?: number };
        if (s.creatorMembershipPriceInr) setCreatorPrice(s.creatorMembershipPriceInr);
        if (s.platformFeePercent) setPlatformFeePercent(s.platformFeePercent);
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    await apiRequest("/api/admin/settings/creatorMembershipPriceInr", { method: "PUT", body: JSON.stringify({ value: creatorPrice }) });
    await apiRequest("/api/admin/settings/platformFeePercent", { method: "PUT", body: JSON.stringify({ value: platformFeePercent }) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Platform Settings</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-6 max-w-md space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Creator Membership Price (₹/month)</label>
          <input type="number" value={creatorPrice} onChange={(e) => setCreatorPrice(Number(e.target.value))} className="w-full h-10 mt-1 px-3 rounded-lg border border-slate-200 text-sm" />
          <p className="text-xs text-slate-400 mt-1">Shown on the public pricing page. Note: the live mock PaymentService fee is still hardcoded at 10% — update src/services/paymentService.ts to make it read this value.</p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Platform Fee (%)</label>
          <input type="number" value={platformFeePercent} onChange={(e) => setPlatformFeePercent(Number(e.target.value))} className="w-full h-10 mt-1 px-3 rounded-lg border border-slate-200 text-sm" />
        </div>
        <button onClick={save} className="px-5 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold">
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>

      <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4">Change Password</h2>
      <div className="rounded-xl border border-slate-200 bg-white p-6 max-w-md space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full h-10 mt-1 px-3 rounded-lg border border-slate-200 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full h-10 mt-1 px-3 rounded-lg border border-slate-200 text-sm"
          />
          <p className="text-xs text-slate-400 mt-1">At least 6 characters.</p>
        </div>
        {passwordStatus && (
          <p className={`text-sm ${passwordStatus.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
            {passwordStatus.message}
          </p>
        )}
        <button
          onClick={changePassword}
          disabled={changingPassword || !currentPassword || !newPassword}
          className="px-5 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold"
        >
          {changingPassword ? "Changing..." : "Change Password"}
        </button>
      </div>
    </AdminLayout>
  );
}
