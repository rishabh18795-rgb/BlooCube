// Translates the frontend's collapsed 'pending' bid-status filter into the
// actual set of ApplicationStatus enum values it stands for, so a Prisma
// `where` clause built from a status query param matches real rows instead
// of a non-existent 'PENDING' enum value. Other statuses pass through
// unchanged (uppercased) since they map 1:1 with the enum.
export function bidStatusFilterToPrismaWhere(status: string): string | { in: string[] } {
  if (status.toLowerCase() === 'pending') {
    return { in: ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED'] };
  }
  return status.toUpperCase();
}

type PrismaCampaign = {
  id: string;
  brandId: string;
  type: string;
  title: string;
  objective: string;
  description: string;
  status: string;
  deliverables: string;
  videoDuration: string | null;
  contentStyle: string | null;
  talkingPoints: string | null;
  brandMentions: string | null;
  requireFaceVisible: boolean;
  requireOriginalContent: boolean;
  requireSubtitles: boolean;
  requireProductLink: boolean;
  contentReferences: string | null;
  usageRights: string;
  platforms: string;
  categories: string;
  locationScope: string;
  specificCities: string | null;
  creatorSize: string;
  minEngagementRate: number;
  audienceAgeMin: number | null;
  audienceAgeMax: number | null;
  audienceGender: string;
  audienceLocation: string | null;
  audienceInterests: string | null;
  requirePortfolio: boolean;
  requireCustomProposal: boolean;
  biddingType: string;
  budgetMin: number | null;
  budgetMax: number | null;
  creatorsRequired: number;
  applicationDeadline: Date;
  startDate: Date | null;
  allowInternational: boolean;
  createdAt: Date;
  updatedAt: Date;
  brand?: { companyName: string; userId: string; logoUrl: string | null } | null;
  _count?: { applications: number };
};

export function csv(value: string): string[] {
  return value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

export function campaignToJson(c: PrismaCampaign) {
  const deliverables = JSON.parse(c.deliverables || '{}');
  return {
    _id: c.id,
    title: c.title,
    description: c.description,
    objective: c.objective,
    type: c.type.toLowerCase(),
    budget: c.budgetMax ?? c.budgetMin ?? 0,
    deadline: c.applicationDeadline.toISOString(),
    status: c.status.toLowerCase(),
    isPublic: c.status !== 'DRAFT',
    requirements: {
      platforms: csv(c.platforms),
      minFollowers: undefined,
      maxFollowers: undefined,
      contentTypes: Object.keys(deliverables).filter((k) => (deliverables[k] || 0) > 0),
      hashtags: c.brandMentions ? c.brandMentions.split(',').map((s) => s.trim()).filter(Boolean) : [],
      mentions: [],
    },
    deliverables,
    payment: { type: c.biddingType === 'FIXED' ? 'fixed' : 'performance', amount: c.budgetMax ?? c.budgetMin ?? 0, currency: 'INR' },
    tags: csv(c.categories),
    brand_id: c.brand ? { _id: c.brandId, name: c.brand.companyName } : c.brandId,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    applicationsCount: c._count?.applications ?? 0,

    // Rich fields for the 5-step campaign wizard
    brief: {
      campaignType: c.type.toLowerCase(),
      campaignName: c.title,
      objective: c.objective,
      description: c.description,
    },
    contentDeliverables: {
      deliverables,
      videoDuration: c.videoDuration,
      contentStyle: c.contentStyle,
      talkingPoints: c.talkingPoints,
      brandMentions: c.brandMentions,
      requireFaceVisible: c.requireFaceVisible,
      requireOriginalContent: c.requireOriginalContent,
      requireSubtitles: c.requireSubtitles,
      requireProductLink: c.requireProductLink,
      contentReferences: c.contentReferences ? JSON.parse(c.contentReferences) : [],
      usageRights: c.usageRights,
    },
    creatorRequirements: {
      platforms: csv(c.platforms),
      categories: csv(c.categories),
      locationScope: c.locationScope,
      specificCities: c.specificCities ? csv(c.specificCities) : [],
      creatorSize: c.creatorSize,
      minEngagementRate: c.minEngagementRate,
      audienceAgeMin: c.audienceAgeMin,
      audienceAgeMax: c.audienceAgeMax,
      audienceGender: c.audienceGender,
      audienceLocation: c.audienceLocation,
      audienceInterests: c.audienceInterests ? csv(c.audienceInterests) : [],
      requirePortfolio: c.requirePortfolio,
      requireCustomProposal: c.requireCustomProposal,
    },
    budgetBidding: {
      biddingType: c.biddingType,
      budgetMin: c.budgetMin,
      budgetMax: c.budgetMax,
      creatorsRequired: c.creatorsRequired,
      applicationDeadline: c.applicationDeadline.toISOString(),
      startDate: c.startDate ? c.startDate.toISOString() : null,
      allowInternational: c.allowInternational,
    },
  };
}

export function applicationToBidJson(a: {
  id: string;
  campaignId: string;
  creatorId: string;
  bidAmount: number;
  proposal: string;
  portfolioLinks: string | null;
  deliveryDays: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  campaign?: { id: string; title: string } | null;
  creator?: { id: string; userId: string; user?: { name: string } } | null;
}) {
  // The frontend's Bid type only knows 'pending' | 'accepted' | 'rejected' |
  // 'withdrawn' | 'completed' — it has no concept of the backend's more
  // granular SUBMITTED / UNDER_REVIEW / SHORTLISTED review stages, all of
  // which are still awaiting a brand decision. Collapse them to 'pending' so
  // the Accept/Reject UI (which only renders for status === 'pending')
  // actually sees bids that are open for action.
  const bidStatus = ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED'].includes(a.status)
    ? 'pending'
    : a.status.toLowerCase();

  return {
    _id: a.id,
    campaign_id: a.campaign ? { _id: a.campaign.id, title: a.campaign.title } : a.campaignId,
    creator_id: a.creator ? { _id: a.creator.id, name: a.creator.user?.name } : a.creatorId,
    status: bidStatus,
    proposal_text: a.proposal,
    bid_amount: a.bidAmount,
    currency: 'INR',
    deliverables: { timeline: `${a.deliveryDays} days` },
    portfolioLinks: a.portfolioLinks ? JSON.parse(a.portfolioLinks) : [],
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}
