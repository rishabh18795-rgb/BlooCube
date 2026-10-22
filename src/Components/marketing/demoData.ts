import type { CastKey } from "@/Components/illustrations/cast";

/**
 * Illustrative sample data for the public marketing previews ONLY.
 * None of these campaigns, creators, bids or results are real BlooCube
 * activity — every component that renders them shows a "Sample data" label.
 * Never import this into authenticated brand/creator/admin portals.
 */

export const DEMO_CAMPAIGN = {
  name: "Summer Skincare Launch",
  brand: "GlowLab",
  budget: 50000,
  applications: 24,
  status: "Accepting Bids",
  niche: "Beauty",
  deadline: "Closes in 4 days",
};

export interface DemoCreator {
  id: string;
  label: string;
  name: string;
  niche: string;
  city: string;
  cast: CastKey;
  bid: number;
  followers: number;
  engagement: number;
  deliverables: string[];
  /** Day (1-5) of the bidding window the bid arrived. */
  submittedDay: number;
}

export const DEMO_BIDDERS: DemoCreator[] = [
  {
    id: "a",
    label: "Creator A",
    name: "Riya",
    niche: "Beauty",
    city: "Delhi",
    cast: "beauty",
    bid: 7500,
    followers: 45000,
    engagement: 4.8,
    deliverables: ["1 Instagram Reel (30s)", "2 Stories with link", "Product mention in caption"],
    submittedDay: 1,
  },
  {
    id: "b",
    label: "Creator B",
    name: "Kabir",
    niche: "Lifestyle",
    city: "Mumbai",
    cast: "tech",
    bid: 10000,
    followers: 82000,
    engagement: 5.2,
    deliverables: ["1 Reel + 1 carousel post", "3 Stories over launch week", "Usage rights for 30 days"],
    submittedDay: 2,
  },
  {
    id: "c",
    label: "Creator C",
    name: "Zoya",
    niche: "Skincare",
    city: "Bengaluru",
    cast: "lifestyle",
    bid: 8500,
    followers: 61000,
    engagement: 6.1,
    deliverables: ["1 routine Reel (45s)", "2 Stories with swipe-up", "Honest review caption"],
    submittedDay: 2,
  },
  {
    id: "d",
    label: "Creator D",
    name: "Dev",
    niche: "Fitness",
    city: "Pune",
    cast: "fitness",
    bid: 12000,
    followers: 110000,
    engagement: 3.9,
    deliverables: ["1 YouTube Short", "1 Reel cross-post", "4 Stories"],
    submittedDay: 4,
  },
];

/** Cumulative applications received per day of the 5-day bidding window. */
export const DEMO_BID_TIMELINE = [3, 9, 14, 20, 24];

export function estEngagements(c: Pick<DemoCreator, "followers" | "engagement">) {
  return Math.round(c.followers * (c.engagement / 100));
}

export function costPerEngagement(c: DemoCreator) {
  return c.bid / estEngagements(c);
}

export function formatINR(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function formatCompact(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

/** Hero showcase — three sample creators competing for the GlowLab campaign. */
export const HERO_CREATORS = [
  { id: "a", name: "Riya", niche: "Beauty", followers: "45K", engagement: "4.8%", bid: 8000, cast: "beauty" as CastKey },
  { id: "b", name: "Kabir", niche: "Lifestyle", followers: "82K", engagement: "5.2%", bid: 10500, cast: "tech" as CastKey },
  { id: "c", name: "Zoya", niche: "Skincare", followers: "61K", engagement: "6.1%", bid: 7500, cast: "lifestyle" as CastKey },
];

/** Sample campaigns for the analytics preview. */
export interface DemoAnalyticsCampaign {
  id: string;
  name: string;
  brand: string;
  budget: number;
  committed: number;
  bids: number[];
  status: { label: string; count: number }[];
  deliverables: { creator: string; cast: CastKey; done: number; total: number; state: "Approved" | "In review" | "In progress" }[];
  /** Estimated weekly engagements (thousands) — illustrative estimates. */
  engagementTrend: number[];
  estReach: number;
}

export const DEMO_ANALYTICS: DemoAnalyticsCampaign[] = [
  {
    id: "glowlab",
    name: "Summer Skincare Launch",
    brand: "GlowLab",
    budget: 50000,
    committed: 26000,
    bids: [6500, 7500, 7800, 8000, 8500, 9000, 9500, 10000, 10500, 11000, 12000, 14000],
    status: [
      { label: "Applied", count: 24 },
      { label: "Shortlisted", count: 8 },
      { label: "Selected", count: 3 },
      { label: "Live", count: 2 },
    ],
    deliverables: [
      { creator: "Zoya", cast: "lifestyle", done: 3, total: 3, state: "Approved" },
      { creator: "Riya", cast: "beauty", done: 2, total: 3, state: "In review" },
      { creator: "Kabir", cast: "tech", done: 1, total: 3, state: "In progress" },
    ],
    engagementTrend: [2.1, 3.4, 5.8, 7.2, 9.6, 11.3],
    estReach: 188000,
  },
  {
    id: "stride",
    name: "Monsoon Run Club",
    brand: "Stride Co.",
    budget: 80000,
    committed: 61000,
    bids: [9000, 11000, 12000, 12500, 14000, 15000, 15500, 18000, 21000],
    status: [
      { label: "Applied", count: 17 },
      { label: "Shortlisted", count: 6 },
      { label: "Selected", count: 4 },
      { label: "Live", count: 4 },
    ],
    deliverables: [
      { creator: "Dev", cast: "fitness", done: 4, total: 4, state: "Approved" },
      { creator: "Aarav", cast: "gaming", done: 3, total: 4, state: "In review" },
      { creator: "Meera", cast: "travel", done: 2, total: 3, state: "In progress" },
    ],
    engagementTrend: [4.2, 6.1, 8.8, 12.4, 13.9, 16.5],
    estReach: 342000,
  },
  {
    id: "byte",
    name: "Gadget Unboxing Week",
    brand: "ByteBox",
    budget: 35000,
    committed: 14500,
    bids: [4000, 5000, 5500, 6000, 6500, 7000, 8500],
    status: [
      { label: "Applied", count: 11 },
      { label: "Shortlisted", count: 4 },
      { label: "Selected", count: 2 },
      { label: "Live", count: 0 },
    ],
    deliverables: [
      { creator: "Aarav", cast: "gaming", done: 1, total: 2, state: "In progress" },
      { creator: "Kabir", cast: "tech", done: 0, total: 2, state: "In progress" },
    ],
    engagementTrend: [0.8, 1.6, 2.2, 3.1, 3.9, 4.4],
    estReach: 96000,
  },
];
