"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import AuthShell, { authInput, authLabel, authSubmit } from "@/Components/auth/AuthShell";
import { apiRequest } from "@/lib/apiClient";
import { getFriendlyMessage } from "@/lib/errors";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!email) {
      setError("Please enter your email");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiRequest("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fromSettings: false }),
      });

      setMessage("If an account exists, a reset link has been sent to your email.");
    } catch (err: unknown) {
      setError(getFriendlyMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="Enter the email you signed up with and we'll send a reset link if an account exists.">
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
              onChange={(e) => setEmail(e.target.value)}
              className={authInput}
            />
          </div>
        </div>
        {message && (
          <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}
        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <button type="submit" disabled={isSubmitting} className={authSubmit}>
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </button>
        <p className="text-center text-sm text-slate-600">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-brand-indigo hover:text-brand-blue">
            Back to login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
