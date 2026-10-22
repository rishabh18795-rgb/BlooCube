import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CastAvatar } from "@/Components/illustrations/Scenes";
import type { CastKey } from "@/Components/illustrations/cast";

const ORBIT: { cast: CastKey; cls: string }[] = [
  { cast: "beauty", cls: "left-[6%] top-[18%] h-16 w-16" },
  { cast: "tech", cls: "left-[14%] bottom-[14%] h-12 w-12" },
  { cast: "brandManager", cls: "right-[8%] top-[14%] h-14 w-14" },
  { cast: "fitness", cls: "right-[15%] bottom-[16%] h-16 w-16" },
];

export default function FinalCTA() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-brand-navy px-6 py-16 text-center sm:py-20">
        <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-brand-indigo/40 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-sky-500/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none hidden md:block" aria-hidden="true">
          {ORBIT.map((o, i) => (
            <span key={o.cast} className={`absolute ${o.cls} ${i % 2 ? "animate-float" : "animate-float-slow"}`}>
              <CastAvatar cast={o.cast} className="h-full w-full !ring-white/15" />
            </span>
          ))}
        </div>

        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">Your Next Campaign Starts Here.</h2>
          <p className="mt-5 text-lg text-slate-300">
            Bring brands and creators together to turn campaign opportunities into meaningful collaborations.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/signup?role=brand"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-7 text-sm font-semibold text-brand-navy transition hover:-translate-y-0.5 hover:bg-brand-lavender focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              Join as a Brand <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/signup?role=creator"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/25 px-7 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
            >
              Join as a Creator
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
