import { BarChart3, ClipboardList, Gavel, Handshake, Search } from "lucide-react";

// Platform capabilities only — no customer logos, user counts or revenue claims.
const CAPABILITIES = [
  { icon: Search, label: "Creator discovery", sub: "Filter by niche, reach, price" },
  { icon: ClipboardList, label: "Campaign management", sub: "Briefs, budgets, deadlines" },
  { icon: Gavel, label: "Competitive bidding", sub: "Creators propose their price" },
  { icon: Handshake, label: "Collaboration tracking", sub: "Deliverables to approval" },
  { icon: BarChart3, label: "Performance analytics", sub: "Budget and campaign insight" },
];

export default function CapabilityStrip() {
  return (
    <section aria-label="Platform capabilities" className="relative z-10 -mt-8 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-[0_20px_50px_-30px_rgba(11,16,38,0.35)] backdrop-blur">
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-5">
          {CAPABILITIES.map(({ icon: Icon, label, sub }, i) => (
            <li
              key={label}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-brand-lavender/60 ${i === 4 ? "sm:col-span-2 md:col-span-1" : ""}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-indigo to-brand-blue text-white shadow-md shadow-brand-indigo/25">
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-bold text-brand-navy">{label}</span>
                <span className="block text-xs text-slate-500">{sub}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
