"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Check, AlertCircle } from "lucide-react";
import Link from "next/link";
import AuthShell, { authInput, authLabel, authSubmit } from "@/Components/auth/AuthShell";
import { CastAvatar } from "@/Components/illustrations/Scenes";
import type { CastKey } from "@/Components/illustrations/cast";
import { apiRequest } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { getFriendlyMessage } from "@/lib/errors";

const ROLE_OPTIONS: { value: "brand" | "creator"; title: string; desc: string; cast: CastKey }[] = [
  { value: "brand", title: "I'm a Brand", desc: "Launch campaigns, discover creators, compare proposals and manage collaborations.", cast: "brandManager" },
  { value: "creator", title: "I'm a Creator", desc: "Discover opportunities, submit bids and manage brand collaborations.", cast: "beauty" },
];

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

  const passwordHints = [
    { ok: passwordChecks.length, label: `At least ${passwordRules.minLength} characters` },
    { ok: passwordChecks.upper, label: "One uppercase letter" },
    { ok: passwordChecks.lower, label: "One lowercase letter" },
    { ok: passwordChecks.number, label: "One number" },
    { ok: passwordChecks.special, label: "One special character" },
    { ok: passwordChecks.noSpace, label: "No spaces" },
  ];

  return (
    <AuthShell aside="signup" title="Create your BlooCube account" subtitle="One account for campaigns, bids and collaborations.">
      {searchParams.get("email") && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          Email pre-filled from landing page
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Role — same `role` state the request sends; preselected from ?role= */}
        <fieldset>
          <legend className={authLabel}>I want to join as</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Account type">
            {ROLE_OPTIONS.map((opt) => {
              const selected = role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  data-role={opt.value}
                  onClick={() => setRole(opt.value)}
                  className={`relative flex items-start gap-3 rounded-2xl border p-3.5 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-indigo/20 ${
                    selected ? "border-brand-indigo bg-brand-lavender/70 shadow-md shadow-brand-indigo/10" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <CastAvatar cast={opt.cast} className="h-11 w-11 shrink-0" ring={false} />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-brand-navy">{opt.title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-slate-500">{opt.desc}</span>
                  </span>
                  <span
                    className={`absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full border ${
                      selected ? "border-brand-indigo bg-brand-indigo" : "border-slate-300"
                    }`}
                    aria-hidden="true"
                  >
                    {selected && <Check className="h-3 w-3 text-white" />}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="name" className={authLabel}>
            Full name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={authInput}
            />
          </div>
        </div>

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
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={emailExists === true}
              aria-describedby="email-status"
              className={authInput}
            />
          </div>
          <div id="email-status" className="mt-1.5 min-h-[1rem] text-xs" aria-live="polite">
            {email && checkingEmail && <span className="text-slate-500">Checking email…</span>}
            {email && !checkingEmail && emailExists === true && (
              <span className="text-red-600">
                Email already exists.{" "}
                <Link href="/login" className="font-semibold underline">
                  Try logging in
                </Link>
                .
              </span>
            )}
            {email && !checkingEmail && emailExists === false && <span className="text-emerald-600">Email is available.</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className={authLabel}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                aria-invalid={passwordTouched && !isStrongPassword}
                aria-describedby="password-rules"
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
          <div>
            <label htmlFor="confirm" className={authLabel}>
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onBlur={() => setConfirmTouched(true)}
                aria-invalid={confirmTouched && !passwordsMatch}
                aria-describedby="confirm-status"
                className={`${authInput} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                aria-pressed={showConfirm}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/40"
              >
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <div id="confirm-status" className="mt-1.5 min-h-[1rem] text-xs" aria-live="polite">
              {(confirmTouched || confirm.length > 0) && (
                <span className={passwordsMatch ? "text-emerald-600" : "text-red-600"}>
                  {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                </span>
              )}
            </div>
          </div>
        </div>

        {(passwordTouched || password.length > 0) && (
          <ul id="password-rules" className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-xl bg-slate-50 p-3 text-xs">
            {passwordHints.map((h) => (
              <li key={h.label} className={`flex items-center gap-1.5 ${h.ok ? "text-emerald-600" : "text-slate-500"}`}>
                {h.ok ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <span className="mx-1 h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />}
                {h.label}
                <span className="sr-only">{h.ok ? " (met)" : " (not met)"}</span>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}
        {message && (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <button type="submit" disabled={isLoading || !isStrongPassword || !passwordsMatch} className={authSubmit}>
          {isLoading ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
              Creating account...
            </>
          ) : (
            <>
              Create {role === "brand" ? "brand" : "creator"} account <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </>
          )}
        </button>

        {!isLoading && (passwordTouched || password.length > 0) && !isStrongPassword && (
          <p className="-mt-2 text-center text-xs text-amber-600">Password doesn&apos;t meet the requirements above yet.</p>
        )}
        {!isLoading && isStrongPassword && (confirmTouched || confirm.length > 0) && !passwordsMatch && (
          <p className="-mt-2 text-center text-xs text-amber-600">Confirm password must match the password above.</p>
        )}

        <p className="text-center text-xs text-slate-500">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="font-semibold text-slate-700 underline-offset-2 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold text-slate-700 underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        <p className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-indigo hover:text-brand-blue">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
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
