export type CampaignRequirements = {
  platforms: ('instagram' | 'youtube' | 'twitter' | 'linkedin' | 'facebook')[];
  minFollowers?: number;
  maxFollowers?: number;
  contentTypes?: ('post' | 'story' | 'reel' | 'video' | 'live' | 'carousel')[];
  hashtags?: string[];
  mentions?: string[];
};

export type CampaignDeliverables = {
  posts?: number;
  stories?: number;
  reels?: number;
  videos?: number;
};

export type CampaignPayment = {
  type: 'fixed' | 'performance';
  amount: number;
  currency: 'INR' | 'USD' | 'EUR';
};

export type Campaign = {
  _id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  status: 'draft' | 'active' | 'closed' | 'completed' | 'cancelled';
  isPublic: boolean;
  requirements: CampaignRequirements;
  deliverables?: CampaignDeliverables;
  payment: CampaignPayment;
  tags?: string[];
  brand_id?: { _id: string; name?: string; email?: string } | string;
  createdAt?: string;
  updatedAt?: string;
  applicationsCount?: number;
  creatorRequirements?: {
    platforms: string[];
    categories: string[];
    locationScope: 'any' | 'national' | 'specific_cities';
    specificCities: string[];
    creatorSize: string;
    minEngagementRate: number;
  };
  budgetBidding?: {
    biddingType: 'OPEN' | 'FIXED' | string;
    budgetMin: number;
    budgetMax: number;
    creatorsRequired: number;
    applicationDeadline: string;
    startDate: string;
  };
};

export type CampaignListResponse = {
  success: boolean;
  data: {
    campaigns: Campaign[];
    pagination: { page: number; limit: number; total: number; pages: number };
  };
};

export type CampaignResponse = { success: boolean; data: { campaign: Campaign } };
