"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/Button";
import React, { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/find-creators", label: "Find Creators" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/#for-brands", label: "For Brands" },
  { href: "/#for-creators", label: "For Creators" },
  { href: "/pricing", label: "Pricing" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const dashboardHref = user?.role === "brand" ? "/brand" : "/creator";

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/logo.png" alt="BlooCube" width={36} height={36} className="rounded-lg" />
            <span className="text-lg font-bold text-slate-900">BlooCube</span>
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 hover:text-brand-indigo transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <Link href={dashboardHref}>
                <Button className="h-9 px-5 bg-slate-900 hover:bg-slate-800 rounded-lg text-white text-sm font-semibold">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" className="h-9 px-5 rounded-lg text-sm font-semibold border-slate-300 text-slate-700 hover:bg-slate-50">
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="h-9 px-5 bg-slate-900 hover:bg-slate-800 rounded-lg text-white text-sm font-semibold">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="lg:hidden p-2 text-slate-700"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden pb-4 flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-700 py-2"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className={clsx("flex gap-3 pt-2")}>
              {isAuthenticated ? (
                <Link href={dashboardHref} className="flex-1">
                  <Button className="w-full h-10 bg-slate-900 rounded-lg text-white text-sm font-semibold">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full h-10 rounded-lg text-sm font-semibold">Login</Button>
                  </Link>
                  <Link href="/signup" className="flex-1">
                    <Button className="w-full h-10 bg-slate-900 rounded-lg text-white text-sm font-semibold">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
