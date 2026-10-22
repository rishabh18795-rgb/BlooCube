import BiddingVisualization from "@/Components/marketing/BiddingVisualization";
import { SampleBadge, SectionHeading } from "@/Components/marketing/primitives";

export default function BiddingSection() {
  return (
    <section id="bidding" className="relative scroll-mt-20 overflow-hidden bg-brand-navy py-20 sm:py-28">
      <div className="pointer-events-none absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-brand-indigo/25 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-sky-500/15 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          tone="light"
          eyebrow="Competitive bidding"
          title="One Campaign. Multiple Creator Bids. Better Decisions."
          description="Walk through how a campaign moves from brief to collaboration. Pick a creator, adjust the budget and sort the bids yourself."
          aside={<SampleBadge className="self-start md:self-end">Illustrative sample data — not live activity</SampleBadge>}
        />
        <div className="mt-12">
          <BiddingVisualization />
        </div>
      </div>
    </section>
  );
}
