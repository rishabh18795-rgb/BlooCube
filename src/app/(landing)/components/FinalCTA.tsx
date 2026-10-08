"use client";

import Link from "next/link";
import { Button } from "@/Components/ui/Button";

export default function FinalCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-brand-navy via-indigo-950 to-brand-navy">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
          Brands post. Creators apply. Deals happen.
        </h2>
        <p className="mt-4 text-slate-300">
          Join BlooCube and build your next collaboration today.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/signup?role=creator">
            <Button className="h-12 px-7 bg-white text-[#111827] hover:bg-slate-100 rounded-xl font-semibold">
              Join as a Creator
            </Button>
          </Link>
          <Link href="/signup?role=brand">
            <Button
              variant="outline"
              className="h-12 px-7 rounded-xl font-semibold border-white/30 text-white hover:bg-white/10"
            >
              Join as a Brand
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
