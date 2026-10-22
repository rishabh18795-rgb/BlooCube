import { FlaskConical } from "lucide-react";
import type { ReactNode } from "react";

export { Reveal } from "./Reveal";

/** Mandatory label for any panel that renders demoData.ts values. */
export function SampleBadge({ className = "", children = "Sample data" }: { className?: string; children?: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ${className}`}
    >
      <FlaskConical className="h-3 w-3" aria-hidden="true" />
      {children}
    </span>
  );
}

export function Eyebrow({ children, tone = "indigo" }: { children: ReactNode; tone?: "indigo" | "light" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
        tone === "light" ? "bg-white/10 text-indigo-200 ring-1 ring-white/15" : "bg-brand-lavender text-brand-indigo ring-1 ring-brand-indigo/10"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone === "light" ? "bg-indigo-300" : "bg-brand-indigo"}`} />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
  aside,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
  aside?: ReactNode;
}) {
  const centered = align === "center";
  return (
    <div className={`flex flex-col gap-6 ${centered ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"}`}>
      <div className={centered ? "max-w-2xl" : "max-w-2xl"}>
        <Eyebrow tone={tone === "light" ? "light" : "indigo"}>{eyebrow}</Eyebrow>
        <h2 className={`mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl ${tone === "light" ? "text-white" : "text-brand-navy"}`}>
          {title}
        </h2>
        {description && (
          <p className={`mt-3 text-base sm:text-lg ${tone === "light" ? "text-slate-300" : "text-slate-600"}`}>{description}</p>
        )}
      </div>
      {aside}
    </div>
  );
}

/** Browser-less product frame used around every interface preview. */
export function ProductFrame({
  title,
  children,
  className = "",
  badge,
  dark = false,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  badge?: ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-[0_24px_60px_-24px_rgba(11,16,38,0.35)] ${
        dark ? "border-white/10 bg-[#121838]" : "border-slate-200/80 bg-white"
      } ${className}`}
    >
      <div className={`flex items-center gap-3 border-b px-4 py-2.5 ${dark ? "border-white/10" : "border-slate-100 bg-slate-50/70"}`}>
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>
        <span className={`truncate text-xs font-semibold ${dark ? "text-slate-300" : "text-slate-500"}`}>{title}</span>
        {badge && <span className="ml-auto shrink-0">{badge}</span>}
      </div>
      {children}
    </div>
  );
}

export const ctaPrimary =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-indigo px-6 text-sm font-semibold text-white shadow-lg shadow-brand-indigo/30 transition hover:-translate-y-0.5 hover:bg-[#4a3af0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-indigo/30";
export const ctaSecondary =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-brand-navy transition hover:-translate-y-0.5 hover:border-brand-indigo/40 hover:text-brand-indigo focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-indigo/20";
