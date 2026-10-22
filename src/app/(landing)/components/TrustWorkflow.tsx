import { CheckCircle2, FileSignature, Gavel, Handshake, Landmark, ShieldCheck, Wallet } from "lucide-react";
import { CollaborationIllustration } from "@/Components/illustrations/Scenes";
import { Reveal, SectionHeading } from "@/Components/marketing/primitives";

type Status = "available" | "pilot" | "soon";

const STATUS: Record<Status, { label: string; cls: string }> = {
  available: { label: "Available", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  pilot: { label: "In pilot", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  soon: { label: "Coming soon", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
};

// Status reflects docs/FINAL_IMPLEMENTATION_REPORT.md: the escrow/wallet ledger
// logic is built and tested, but no real payment provider is integrated yet.
// Update these labels only when that changes.
const STEPS: { icon: typeof Gavel; title: string; desc: string; status: Status }[] = [
  { icon: FileSignature, title: "Brief & budget", desc: "The brand publishes a campaign with a budget, timeline and deliverables.", status: "available" },
  { icon: Gavel, title: "Bids & selection", desc: "Creators bid; the brand compares proposals and selects a creator.", status: "available" },
  { icon: Handshake, title: "Collaboration & approval", desc: "Deliverables are submitted, reviewed and approved inside the collaboration.", status: "available" },
  { icon: ShieldCheck, title: "Escrow-style fund holding", desc: "Campaign funds are committed on selection and released after approval.", status: "pilot" },
  { icon: Wallet, title: "Creator wallet & withdrawals", desc: "Released earnings land in the creator wallet for withdrawal requests.", status: "pilot" },
  { icon: Landmark, title: "Online payment gateway", desc: "Card and UPI payments through a licensed payment provider.", status: "soon" },
];

export default function TrustWorkflow() {
  return (
    <section id="payments" className="scroll-mt-20 bg-brand-lavender/60 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionHeading
            eyebrow="Trust & payment workflow"
            title="A clear path from agreement to payout"
            description="Every collaboration follows the same steps, so brands and creators always know what happens next."
          />
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <CollaborationIllustration />
          </div>
          <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <b>Where payments stand today:</b> the escrow and wallet workflow is built and tested, but a live payment gateway is not
            connected yet. Until it is, BlooCube does not process real card or UPI payments.
          </p>
        </div>

        <ol className="relative space-y-3">
          <span className="absolute bottom-6 left-[1.6rem] top-6 w-px bg-gradient-to-b from-brand-indigo/40 via-brand-indigo/20 to-transparent" aria-hidden="true" />
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const st = STATUS[s.status];
            return (
              <Reveal as="li" key={s.title} delay={i * 0.05} className="relative flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <span
                  className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    s.status === "available" ? "bg-gradient-to-br from-brand-indigo to-brand-blue text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-brand-navy">{s.title}</h3>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${st.cls}`}>
                      {s.status === "available" && <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
                      {st.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{s.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
