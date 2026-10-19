"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, Briefcase, CreditCard, Wallet, Scale, Settings, LogOut, Shield, Mail, ScrollText, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { performLogout } from "@/lib/auth";

const NAV = [
  { name: "Overview", href: "/admin", icon: Shield },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Campaigns", href: "/admin/campaigns", icon: Briefcase },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Withdrawals", href: "/admin/withdrawals", icon: Wallet },
  { name: "Disputes", href: "/admin/disputes", icon: Scale },
  { name: "Contact Messages", href: "/admin/contact", icon: Mail },
  { name: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const logout = async () => {
    const result = await performLogout();
    if (!result.success) {
      alert(result.error || "Logout failed. Please try again.");
      return;
    }
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col
        transition-transform duration-200 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="h-16 flex items-center justify-between px-5 font-bold text-slate-900 border-b border-slate-100">
          BlooCube Admin
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 px-3 mb-2">{user?.id}</div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 flex items-center px-4 border-b border-slate-200 bg-white lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:text-slate-900">
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-2 font-semibold text-slate-900">BlooCube Admin</span>
        </div>
        <main className="flex-1 p-6 lg:p-8 max-w-6xl overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
