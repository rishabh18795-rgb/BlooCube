"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/Components/ui/Button";
import { Input } from "@/Components/ui/Input";
import { Label } from "@/Components/ui/Label";
import { Alert, AlertDescription } from "@/Components/ui/Alert";
import { Select, SelectItem, SelectTrigger } from "@/Components/ui/Select";
import Link from "next/link";
import { apiRequest } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { getFriendlyMessage } from "@/lib/errors";

const SignupForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const initialRole = searchParams.get("role") === "brand" ? "brand" : "creator";
  const [role, setRole] = useState(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);

  const passwordRules = {
    minLength: 8,
  } as const;

  const passwordChecks = {
    length: password.length >= passwordRules.minLength,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    noSpace: !/\s/.test(password),
  };
  const isStrongPassword = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirm && confirm.length > 0;

  // Auto-fill email from URL param
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setEmail(decodeURIComponent(emailParam));
  }, [searchParams]);

  // Debounced email existence check. latestEmailRef guards against an
  // in-flight check for a previously-typed email resolving after a newer
  // one has already started (abort() rejects the fetch promise, but a
  // request already on the wire can still resolve) by re-validating the
  // email the result is for against the latest field value before applying it.
  const latestEmailRef = useRef(email);
  latestEmailRef.current = email;

  useEffect(() => {
    if (!email) {
      setEmailExists(null);
      return;
    }
    const controller = new AbortController();
    const checkedEmail = email;
    const t = setTimeout(async () => {
      try {
        setCheckingEmail(true);
        const qs = new URLSearchParams({ email: checkedEmail });
        const res = await fetch(`/api/auth/check-email?${qs.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (latestEmailRef.current === checkedEmail) {
          setEmailExists(data?.success ? !!data.data?.exists : null);
        }
      } catch {
        if (!controller.signal.aborted) setEmailExists(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 400);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [email]);

  // Redirect authenticated users away from signup. This check must run
  // after every hook above it (Rules of Hooks — an early return before a
  // useState/useEffect call would skip it conditionally).
  if (!authLoading && isAuthenticated) {
    const target = user?.role === 'brand' ? '/brand' : user?.role === 'admin' ? '/admin' : '/creator';
    if (typeof window !== 'undefined') {
      router.replace(target);
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    if (!name || !email || !password || !confirm) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (!isStrongPassword) {
      setError(
        "Password must be at least 8 chars and include upper, lower, number, special, and no spaces."
      );
      setIsLoading(false);
      return;
    }

    try {
      if (emailExists) {
        setError(
          "Email already exists. Please log in or use a different email."
        );
        setIsLoading(false);
        return;
      }
      const data = await apiRequest<{
        success: boolean;
        data: {
          requiresOTP?: boolean;
          user?: { role: string };
        };
        message?: string;
      }>("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (data?.data?.requiresOTP) {
        // Show success message and redirect to OTP verification
        setMessage(
          "Registration successful! Please check your email for the verification code."
        );
        setTimeout(() => {
          router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
        }, 2000);
      } else {
        // Fallback: try auto-login (for backward compatibility)
        const loginResp = await apiRequest<{
          success: boolean;
          data: {
            tokens: { accessToken: string; refreshToken?: string };
            user: { role: string };
          };
          message?: string;
        }>("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        // With HttpOnly cookies, tokens are automatically set by the server
        // We only need to update user data in the frontend
        const { cookieAuthUtils } = await import("@/lib/cookieAuth");
        cookieAuthUtils.updateUserData(loginResp.data.user);

        const roleAfterSignup = loginResp.data.user?.role;
        router.push(roleAfterSignup === "brand" ? "/brand" : "/creator");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(getFriendlyMessage(err, 'signup'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-[var(--brand-lavender)] to-white px-2 py-6">
      {/* Animated glowing background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="hidden" />
        <div className="hidden" />
        <div className="hidden" />
      </div>

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60 p-6 sm:p-8"
      >
        <div className="hidden" />
        <div className="hidden" />

        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold text-slate-900">
            Create Your Account
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Join thousands of creators and brands
          </p>
          {searchParams.get("email") && (
            <div className="mt-3 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-700">
                Email pre-filled from landing page
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <Label htmlFor="name" className="text-slate-700 text-sm mb-2 block">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 h-11 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-slate-700 text-sm mb-2 block">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-100"
              />
              {email && (
                <div className="mt-2 text-xs">
                  {checkingEmail && (
                    <span className="text-slate-500">Checking email…</span>
                  )}
                  {!checkingEmail && emailExists === true && (
                    <span className="text-red-600">
                      Email already exists. Try logging in.
                    </span>
                  )}
                  {!checkingEmail && emailExists === false && (
                    <span className="text-emerald-600">
                      Email is available.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Password + Confirm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Label
                htmlFor="password"
                className="text-slate-700 text-sm mb-2 block"
              >
                Password
              </Label>
              <Lock className="absolute left-3 top-[38px] w-5 h-5 text-slate-500" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-100"
              />
            {passwordTouched || password.length > 0 ? (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center gap-2 ${passwordChecks.length ? 'text-emerald-600' : 'text-slate-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${passwordChecks.length ? 'bg-emerald-400' : 'bg-zinc-500'}`}></span>
                  At least {passwordRules.minLength} characters
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.upper ? 'text-emerald-600' : 'text-slate-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${passwordChecks.upper ? 'bg-emerald-400' : 'bg-zinc-500'}`}></span>
                  One uppercase letter (A-Z)
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.lower ? 'text-emerald-600' : 'text-slate-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${passwordChecks.lower ? 'bg-emerald-400' : 'bg-zinc-500'}`}></span>
                  One lowercase letter (a-z)
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.number ? 'text-emerald-600' : 'text-slate-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${passwordChecks.number ? 'bg-emerald-400' : 'bg-zinc-500'}`}></span>
                  One number (0-9)
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.special ? 'text-emerald-600' : 'text-slate-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${passwordChecks.special ? 'bg-emerald-400' : 'bg-zinc-500'}`}></span>
                  One special character (!@#$...)
                </div>
                <div className={`flex items-center gap-2 ${passwordChecks.noSpace ? 'text-emerald-600' : 'text-slate-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${passwordChecks.noSpace ? 'bg-emerald-400' : 'bg-zinc-500'}`}></span>
                  No spaces
                </div>
              </div>
            ) : null}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-slate-500 hover:text-slate-700"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="relative">
              <Label
                htmlFor="confirm"
                className="text-slate-700 text-sm mb-2 block"
              >
                Confirm Password
              </Label>
              <Lock className="absolute left-3 top-[38px] w-5 h-5 text-slate-500" />
              <Input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onBlur={() => setConfirmTouched(true)}
                className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-indigo-100"
              />
            {(confirmTouched || confirm.length > 0) && (
              <div className="mt-2 text-xs">
                <span className={`${passwordsMatch ? 'text-emerald-600' : 'text-red-600'}`}>
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </span>
              </div>
            )}
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-[38px] text-slate-500 hover:text-slate-700"
              >
                {showConfirm ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <Label htmlFor="role" className="text-slate-700 text-sm mb-2 block">
              Select Role
            </Label>
            <Select>
              <SelectTrigger
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-11 w-full bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-100"
              >
                <option value="" disabled className="text-slate-900">
                  Select your role...
                </option>
                <SelectItem value="creator" className="cursor-pointer">
                  Creator
                </SelectItem>
                <SelectItem value="brand" className="cursor-pointer">
                  Brand
                </SelectItem>
              </SelectTrigger>
            </Select>
          </div>

          {error && (
            <Alert className="bg-red-50 border-red-200 rounded-xl">
              <AlertDescription className="text-red-600 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="bg-emerald-50 border-emerald-200 rounded-xl">
              <AlertDescription className="text-emerald-600 text-sm">
                {message}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isLoading || !isStrongPassword || !passwordsMatch}
            className="w-full h-11 bg-slate-900 hover:bg-slate-800 rounded-xl text-white font-semibold"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating account...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>Sign Up</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button>

          {!isLoading && (passwordTouched || password.length > 0) && !isStrongPassword && (
            <p className="text-xs text-amber-600 text-center -mt-2">
              Password doesn&apos;t meet the requirements above yet.
            </p>
          )}
          {!isLoading && isStrongPassword && (confirmTouched || confirm.length > 0) && !passwordsMatch && (
            <p className="text-xs text-amber-600 text-center -mt-2">
              Confirm password must match the password above.
            </p>
          )}

          <p className="mt-5 text-center text-slate-500 text-sm z-50">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
            >
              Login
            </Link>
          </p>
        </form>
      </motion.div>
    </section>
  );
};

const SignupPage: React.FC = () => (
  <Suspense
    fallback={
      <div className="min-h-screen flex items-center justify-center text-slate-900">
        Loading...
      </div>
    }
  >
    <SignupForm />
  </Suspense>
);

export default SignupPage;
