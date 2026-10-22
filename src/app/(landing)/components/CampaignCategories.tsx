import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Character from "@/Components/illustrations/Character";
import { CAST, type CastKey } from "@/Components/illustrations/cast";
import { Reveal, SectionHeading } from "@/Components/marketing/primitives";

const CATEGORIES: { niche: string; cast: CastKey; examples: string }[] = [
  { niche: "Beauty", cast: "beauty", examples: "Skincare, makeup, personal care" },
  { niche: "Tech", cast: "tech", examples: "Gadgets, apps, reviews" },
  { niche: "Lifestyle", cast: "lifestyle", examples: "Fashion, home, daily life" },
  { niche: "Fitness", cast: "fitness", examples: "Health, gym, wellness" },
  { niche: "Travel", cast: "travel", examples: "Hotels, tourism, experiences" },
  { niche: "Food", cast: "food", examples: "Recipes, restaurants, D2C food" },
  { niche: "Gaming", cast: "gaming", examples: "Streams, launches, esports" },
];

export default function CampaignCategories() {
  return (
    <section id="categories" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          align="center"
          eyebrow="Campaign categories"
          title="Campaigns across every niche"
          description="From beauty to gaming, find creators whose audience fits your brand."
        />
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-7">
          {CATEGORIES.map((c, i) => (
            <Reveal as="li" key={c.niche} delay={i * 0.04} className={i === 6 ? "col-span-2 sm:col-span-1" : ""}>
              <Link
                href={`/find-creators?niche=${encodeURIComponent(c.niche)}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition hover:-translate-y-1 hover:border-brand-indigo/30 hover:shadow-[0_20px_40px_-24px_rgba(91,75,255,0.5)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-indigo/25"
              >
                <Character spec={CAST[c.cast]} className="aspect-square w-full" />
                <span className="flex flex-1 flex-col p-3">
                  <span className="flex items-center justify-between font-bold text-brand-navy">
                    {c.niche}
                    <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-brand-indigo" aria-hidden="true" />
                  </span>
                  <span className="mt-0.5 text-xs text-slate-500">{c.examples}</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
