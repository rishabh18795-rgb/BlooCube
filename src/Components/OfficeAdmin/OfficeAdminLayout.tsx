"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldCheck, LayoutDashboard, Building2, Users, Briefcase, Wallet,
  Scale, Mail, ScrollText, Settings, LogOut, Menu, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { performLogout } from "@/lib/auth";

const NAV = [
  { name: "Dashboard", href: "/office-admin/dashboard", icon: LayoutDashboard },
  { name: "Brands", href: "/office-admin/brands", icon: Building2 },
  { name: "Creators", href: "/office-admin/creators", icon: Users },
  { name: "Campaigns", href: "/office-admin/campaigns", icon: Briefcase },
  { name: "Finance", href: "/office-admin/finance", icon: Wallet },
  { name: "Disputes", href: "/office-admin/disputes", icon: Scale },
  { name: "Contact Requests", href: "/office-admin/contact", icon: Mail },
  { name: "Audit Logs", href: "/office-admin/audit-logs", icon: ScrollText },
  { name: "Settings", href: "/office-admin/settings", icon: Settings },
];

export default function OfficeAdminLayout({ children }: { children: React.ReactNode }) {
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
    router.push("/office-admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 shrink-0 bg-slate-950 flex flex-col
        transition-transform duration-200 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-white text-sm">BlooCube Office</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-slate-500 hover:text-slate-300">
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-indigo-500/15 text-indigo-300" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <div className="text-xs text-slate-600 px-3 mb-2 truncate">{user?.id}</div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 flex items-center px-4 border-b border-slate-200 bg-white lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:text-slate-900">
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-2 font-semibold text-slate-900">BlooCube Office</span>
        </div>
        <main className="flex-1 p-6 lg:p-8 max-w-7xl overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
