"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/Components/ui/Alert";
import { Button } from "@/Components/ui/Button";
import { Input } from "@/Components/ui/Input";
import { Label } from "@/Components/ui/Label";
import { Checkbox } from "@/Components/ui/Checkbox";
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

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
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
    <section className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-[var(--brand-lavender)] to-white px-4 py-16">
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/60 p-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
          <p className="text-slate-500 text-sm mt-2">Sign in to continue to your account</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-slate-700 text-sm mb-2 block">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="pl-10 h-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-slate-700 text-sm mb-2 block">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked: boolean) => setRememberMe(Boolean(checked))}
                className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
              />
              <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer whitespace-nowrap">
                Remember me
              </label>
            </div>
            <a href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 whitespace-nowrap">
              Forgot password?
            </a>
          </div>

          {error && (
            <Alert className="bg-red-50 border-red-200 rounded-xl">
              <AlertDescription className="text-red-600 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-11 bg-slate-900 hover:bg-slate-800 rounded-xl text-white font-semibold"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Sign In</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button>

          <p className="mt-4 text-center text-slate-500 text-sm">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Sign up for free
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
