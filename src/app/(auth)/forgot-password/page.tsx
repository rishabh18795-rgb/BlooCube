"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/Components/ui/Button";
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
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-black px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-black/70 backdrop-blur-md rounded-3xl p-8 text-white"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/10 placeholder:text-white/50 focus:outline-none"
          />
          <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        {message && <p className="text-green-400 mt-2 text-center">{message}</p>}
        {error && <p className="text-red-400 mt-2 text-center">{error}</p>}
      </motion.div>
    </section>
  );
};

export default ForgotPasswordPage;
