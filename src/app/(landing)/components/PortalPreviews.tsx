import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Briefcase,
  CheckCircle2,
  Circle,
  FileText,
  Home,
  MessageSquare,
  Plus,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { CastAvatar } from "@/Components/illustrations/Scenes";
import type { CastKey } from "@/Components/illustrations/cast";
import { ProductFrame, Reveal, SampleBadge, SectionHeading } from "@/Components/marketing/primitives";

// Sidebar labels mirror the real portals (Components/Brand/Sidebar.tsx, Components/Creater/Sidebar.tsx).
const BRAND_NAV = [
  { icon: Home, label: "Dashboard" },
  { icon: Briefcase, label: "Campaigns", active: true },
  { icon: Users, label: "Applications" },
  { icon: MessageSquare, label: "Messages" },
  { icon: Wallet, label: "Payments" },
  { icon: BarChart3, label: "Analytics" },
];
const CREATOR_NAV = [
  { icon: Home, label: "Dashboard" },
  { icon: Store, label: "Find Campaigns", active: true },
  { icon: FileText, label: "My Applications" },
  { icon: Briefcase, label: "My Collaborations" },
  { icon: Wallet, label: "Payments" },
  { icon: Bell, label: "Notifications" },
];

function MiniSidebar({ items }: { items: typeof BRAND_NAV }) {
  return (
    <nav aria-hidden="true" className="hidden w-36 shrink-0 border-r border-slate-100 bg-slate-50/60 p-2 sm:block">
      {items.map(({ icon: Icon, label, active }) => (
        <div
          key={label}
          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium ${active ? "bg-white text-brand-indigo shadow-sm" : "text-slate-500"}`}
        >
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
      ))}
    </nav>
  );
}

const BIDS: { cast: CastKey; name: string; bid: string; eng: string; tag?: string }[] = [
  { cast: "lifestyle", name: "Creator C", bid: "₹8,500", eng: "6.1%", tag: "Shortlisted" },
  { cast: "beauty", name: "Creator A", bid: "₹7,500", eng: "4.8%" },
  { cast: "tech", name: "Creator B", bid: "₹10,000", eng: "5.2%" },
];

function BrandPortalMock() {
  return (
    <div className="flex min-h-[320px]">
      <MiniSidebar items={BRAND_NAV} />
      <div className="flex-1 space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-brand-navy">Campaigns</span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-brand-indigo px-2.5 py-1 text-[11px] font-semibold text-white">
            <Plus className="h-3 w-3" aria-hidden="true" /> New campaign
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-navy">Summer Skincare Launch</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Accepting bids</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Budget ₹50,000 · 24 applications</div>
        </div>
        <div className="rounded-xl border border-slate-200">
          <div className="border-b border-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-500">Bid comparison</div>
          <ul className="divide-y divide-slate-100">
            {BIDS.map((b) => (
              <li key={b.name} className="flex items-center gap-2 px-3 py-2 text-[11px]">
                <CastAvatar cast={b.cast} className="h-7 w-7" ring={false} />
                <span className="font-semibold text-brand-navy">{b.name}</span>
                {b.tag && <span className="rounded bg-brand-lavender px-1.5 py-0.5 text-[9px] font-bold text-brand-indigo">{b.tag}</span>}
                <span className="ml-auto text-emerald-600">{b.eng}</span>
                <span className="w-14 text-right font-bold text-brand-navy">{b.bid}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function CreatorPortalMock() {
  return (
    <div className="flex min-h-[320px]">
      <MiniSidebar items={CREATOR_NAV} />
      <div className="flex-1 space-y-3 p-4">
        <span className="text-sm font-bold text-brand-navy">Find Campaigns</span>
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 text-[10px] font-bold text-white">GL</span>
            <div>
              <div className="text-xs font-bold text-brand-navy">Summer Skincare Launch</div>
              <div className="text-[10px] text-slate-500">Beauty · Reels + Stories · ₹50,000 budget</div>
            </div>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <div className="flex-1">
              <div className="text-[10px] font-medium text-slate-500">Your bid</div>
              <div className="mt-0.5 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold text-brand-navy">₹8,500</div>
            </div>
            <span className="rounded-lg bg-brand-indigo px-3 py-1.5 text-[11px] font-semibold text-white">Submit bid</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-navy">Active collaboration</span>
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">In progress</span>
          </div>
          <ul className="mt-2 space-y-1.5 text-[11px] text-slate-600">
            {[
              { t: "Routine Reel (45s)", done: true },
              { t: "2 Stories with link", done: true },
              { t: "Review caption", done: false },
            ].map((d) => (
              <li key={d.t} className="flex items-center gap-2">
                {d.done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" /> : <Circle className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />}
                {d.t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const PORTALS = [
  {
    id: "for-brands",
    eyebrow: "Brand Portal",
    title: "Run every campaign from one workspace",
    points: ["Campaign creation", "Creator discovery", "Bid comparison", "Collaboration management"],
    cta: { href: "/signup?role=brand", label: "Join as a Brand" },
    mock: <BrandPortalMock />,
    frame: "Brand Portal",
    cast: "brandManager" as CastKey,
  },
  {
    id: "for-creators",
    eyebrow: "Creator Portal",
    title: "Find briefs, bid, deliver and get organised",
    points: ["Campaign discovery", "Bid submission", "Active collaborations", "Deliverable management"],
    cta: { href: "/signup?role=creator", label: "Join as a Creator" },
    mock: <CreatorPortalMock />,
    frame: "Creator Portal",
    cast: "travel" as CastKey,
  },
];

export default function PortalPreviews() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          align="center"
          eyebrow="Two portals, one marketplace"
          title="Purpose-built for brands and for creators"
          description="Each side gets its own workspace. Previews below show the real portal layout with sample content."
        />
        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          {PORTALS.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.1}>
              <article id={p.id} className="scroll-mt-24">
                <div className="flex items-center gap-3">
                  <CastAvatar cast={p.cast} className="h-12 w-12" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wide text-brand-indigo">{p.eyebrow}</span>
                    <h3 className="text-xl font-extrabold text-brand-navy">{p.title}</h3>
                  </div>
                </div>
                <ProductFrame title={p.frame} badge={<SampleBadge>Sample content</SampleBadge>} className="mt-5">
                  {p.mock}
                </ProductFrame>
                <ul className="mt-5 grid grid-cols-2 gap-2">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-indigo" aria-hidden="true" /> {pt}
                    </li>
                  ))}
                </ul>
                <Link href={p.cta.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-indigo hover:text-brand-blue">
                  {p.cta.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
