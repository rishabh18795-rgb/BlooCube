"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { Checkbox } from "@/Components/ui/Checkbox";
import AuthShell, { authInput, authLabel, authSubmit } from "@/Components/auth/AuthShell";
import { apiRequest } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { getFriendlyMessage } from "@/lib/errors";

interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      profile?: unknown;
      isActive: boolean;
      isVerified: boolean;
      lastLogin: string;
    };
  };
  message?: string;
}

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    const target = user?.role === "brand" ? "/brand" : user?.role === "admin" ? "/admin" : "/creator";
    if (typeof window !== "undefined") {
      router.replace(target);
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setIsSubmitting(true);
      const data = await apiRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: { "Content-Type": "application/json" },
      });

      const { cookieAuthUtils } = await import("@/lib/cookieAuth");
      cookieAuthUtils.updateUserData(data.data.user);

      const role = data.data.user?.role;
      router.push(role === "brand" ? "/brand" : role === "admin" ? "/admin" : "/creator");
    } catch (err: unknown) {
      setError(getFriendlyMessage(err, "login"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell title="Welcome back to BlooCube" subtitle="Your next campaign or collaboration starts here.">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="email" className={authLabel}>
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              aria-invalid={!!error && !email}
              aria-describedby={error ? "login-error" : undefined}
              className={authInput}
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-semibold text-slate-700">
              Password
            </label>
            <Link href="/forgot-password" className="text-sm font-semibold text-brand-indigo hover:text-brand-blue">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              aria-invalid={!!error && password.length < 6}
              aria-describedby={error ? "login-error" : undefined}
              className={`${authInput} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/40"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked: boolean) => setRememberMe(Boolean(checked))}
            className="border-slate-300 data-[state=checked]:border-brand-indigo data-[state=checked]:bg-brand-indigo"
          />
          <label htmlFor="remember" className="cursor-pointer text-sm text-slate-600">
            Remember me
          </label>
        </div>

        {error && (
          <div id="login-error" role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className={authSubmit}>
          {isSubmitting ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
              Signing in...
            </>
          ) : (
            <>
              Sign in <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </>
          )}
        </button>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center text-sm text-slate-600">
          New to BlooCube?{" "}
          <Link href="/signup?role=brand" className="font-semibold text-brand-indigo hover:text-brand-blue">
            Join as a Brand
          </Link>{" "}
          or{" "}
          <Link href="/signup?role=creator" className="font-semibold text-brand-indigo hover:text-brand-blue">
            Join as a Creator
          </Link>
        </div>
      </form>
    </AuthShell>
  );
};

export default LoginPage;
