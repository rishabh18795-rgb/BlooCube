"use client";
import React from "react";

const CookiePolicyPage: React.FC = () => {
  return (
    <>
      <div className="w-full bg-black text-black pointer-events-none absolute md:fixed inset-0 z-0 overflow-hidden will-change-transform">
        <div className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-gradient-to-br from-purple-600 via-blue-500 to-teal-400 opacity-20 md:opacity-30 rounded-full blur-[120px] animate-gradient-60" />
        <div className="absolute top-[30%] -left-20 w-[400px] h-[400px] bg-gradient-to-br from-purple-600 via-blue-500 to-teal-400 opacity-18 md:opacity-28 rounded-full blur-[120px] animate-gradient-60" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-500 via-fuchsia-500 to-pink-500 opacity-16 md:opacity-24 rounded-full blur-[140px] animate-gradient-60" />
      </div>
      <main className="relative z-10 max-w-3xl mx-auto px-6 py-16 text-zinc-300">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">Cookie Policy</h1>
        <p className="text-sm text-zinc-400 mb-4">Last updated: 2026-10-08</p>
        <p className="text-sm text-amber-300/80 mb-10 border border-amber-300/20 rounded-lg px-4 py-3 bg-amber-300/5">
          This is a starter Cookie Policy describing the cookies BlooCube actually sets today. It should be reviewed
          by your legal counsel and replaced with final, jurisdiction-appropriate copy before relying on it.
        </p>

        <section className="space-y-4 mb-10">
          <h2 className="text-xl font-semibold text-white">What cookies we use</h2>
          <p>BlooCube uses a small number of cookies, each with a specific, limited purpose:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>
              <strong>access_token / refresh_token</strong> — strictly necessary, HttpOnly session cookies that keep
              you signed in. They cannot be read by page scripts and are required for the platform to function.
            </li>
            <li>
              <strong>user_data</strong> — a non-sensitive, readable cookie (your name, role and verification status)
              used by the app to render the right dashboard and navigation without an extra request.
            </li>
            <li>
              <strong>Google Analytics cookies (_ga, _ga_*)</strong> — used to understand aggregate site usage, such
              as which pages are visited. These are only set if analytics is enabled for your region/consent.
            </li>
          </ul>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-xl font-semibold text-white">What we don&apos;t do</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>We do not use cookies for third-party advertising or ad retargeting.</li>
            <li>We do not sell cookie or usage data to third parties.</li>
          </ul>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-xl font-semibold text-white">Managing cookies</h2>
          <p>
            The session cookies above are required to log in and use BlooCube — clearing them will sign you out.
            You can control or block analytics cookies through your browser&apos;s cookie settings at any time.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-xl font-semibold text-white">Related policies</h2>
          <p>
            See our <a href="/privacy" className="underline hover:text-white">Privacy Policy</a> for how we handle
            your personal data more broadly, and our{" "}
            <a href="/terms" className="underline hover:text-white">Terms of Service</a> for the terms governing your
            use of BlooCube.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-xl font-semibold text-white">Contact</h2>
          <p>
            Questions about this policy can be sent via our{" "}
            <a href="/contact" className="underline hover:text-white">contact page</a>.
          </p>
        </section>
      </main>
    </>
  );
};

export default CookiePolicyPage;
