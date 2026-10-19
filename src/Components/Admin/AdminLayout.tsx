"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, Briefcase, CreditCard, Wallet, Scale, Settings, LogOut, Shield, Mail, ScrollText } from "lucide-react";
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
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="h-16 flex items-center px-5 font-bold text-slate-900 border-b border-slate-100">BlooCube Admin</div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
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
      <main className="flex-1 p-6 lg:p-8 max-w-6xl">{children}</main>
    </div>
  );
}
