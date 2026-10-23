import { Router } from 'express';
import { prisma } from '../db';
import { ok, fail } from '../utils/responses';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';
import { campaignToJson, applicationToBidJson, bidStatusFilterToPrismaWhere } from '../utils/mappers';
import { NotificationService } from '../services/notificationService';

const router = Router();

function pagination(req: AuthedRequest) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  return { page, limit, skip: (page - 1) * limit };
}

// GET /api/campaigns — public/creator marketplace listing
router.get('/', async (req: AuthedRequest, res) => {
  const { page, limit, skip } = pagination(req);
  const status = (req.query.status as string) || 'active';
  const platform = req.query.platform as string | undefined;
  const search = req.query.search as string | undefined;

  const where: Record<string, unknown> = { deletedAt: null };
  if (status !== 'all') where.status = status.toUpperCase();
  if (platform) where.platforms = { contains: platform };
  if (search) where.title = { contains: search };
  if (req.query.minBudget) where.budgetMax = { gte: Number(req.query.minBudget) };
  if (req.query.maxBudget) where.budgetMin = { lte: Number(req.query.maxBudget) };

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({ where, include: { brand: true, _count: { select: { applications: true } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.campaign.count({ where }),
  ]);

  return ok(res, {
    campaigns: campaigns.map(campaignToJson),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});

// GET /api/campaigns/brand/:brandId — brand's own campaigns (all statuses)
router.get('/brand/:brandId', requireAuth, async (req: AuthedRequest, res) => {
  const { brandId } = req.params;
  const brand = await prisma.brandProfile.findUnique({ where: { id: brandId } });
  if (!brand) return fail(res, 'Brand not found', 404);
  if (brand.userId !== req.userId && req.userRole !== 'ADMIN') return fail(res, 'Forbidden', 403);

  const { page, limit, skip } = pagination(req);
  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({ where: { brandId, deletedAt: null }, include: { brand: true, _count: { select: { applications: true } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.campaign.count({ where: { brandId, deletedAt: null } }),
  ]);
  return ok(res, { campaigns: campaigns.map(campaignToJson), pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
});

router.get('/:id', async (req, res) => {
  const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id }, include: { brand: true, _count: { select: { applications: true } } } });
  if (!campaign || campaign.deletedAt) return fail(res, 'Campaign not found', 404);
  return ok(res, { campaign: campaignToJson(campaign) });
});

router.post('/', requireAuth, requireRole('BRAND'), async (req: AuthedRequest, res) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.userId! } });
  if (!brand) return fail(res, 'Brand profile not found', 404);

  const b = req.body || {};
  const title = b.title || b.brief?.campaignName;
  const description = b.description || b.brief?.description;
  if (!title || String(title).trim().length < 5) return fail(res, 'Campaign title must be at least 5 characters', 422);
  if (!description || String(description).trim().length < 10) return fail(res, 'Campaign description must be at least 10 characters', 422);

  const deliverables = b.deliverables || b.contentDeliverables?.deliverables || {};
  const platforms: string[] = b.requirements?.platforms || b.creatorRequirements?.platforms || [];
  if (platforms.length < 1) return fail(res, 'Select at least one platform', 422);

  const deadlineRaw = b.deadline || b.budgetBidding?.applicationDeadline;
  const deadline = deadlineRaw ? new Date(deadlineRaw) : null;
  if (!deadline || isNaN(deadline.getTime()) || deadline.getTime() <= Date.now()) {
    return fail(res, 'Application deadline must be a valid future date', 422);
  }

  const budgetMin = b.budgetBidding?.budgetMin ?? undefined;
  const budgetMax = b.budgetBidding?.budgetMax ?? b.payment?.amount ?? b.budget ?? undefined;
  if (budgetMin !== undefined && budgetMin < 0) return fail(res, 'Budget cannot be negative', 422);
  if (budgetMax !== undefined && budgetMax < 0) return fail(res, 'Budget cannot be negative', 422);
  if (budgetMin !== undefined && budgetMax !== undefined && Number(budgetMin) > Number(budgetMax)) {
    return fail(res, 'Minimum budget cannot exceed maximum budget', 422);
  }

  const publish = b.isPublic === true || b.status === 'active' || b.publish === true;

  const campaign = await prisma.campaign.create({
    data: {
      brandId: brand.id,
      type: (b.brief?.campaignType || 'influencer_collab').toUpperCase().replace(/-/g, '_') as any,
      title,
      objective: b.brief?.objective || b.objective || title,
      description,
      status: publish ? 'ACTIVE' : 'DRAFT',
      deliverables: JSON.stringify(deliverables),
      videoDuration: b.contentDeliverables?.videoDuration || null,
      contentStyle: b.contentDeliverables?.contentStyle || null,
      talkingPoints: b.contentDeliverables?.talkingPoints || null,
      brandMentions: b.contentDeliverables?.brandMentions || (b.requirements?.hashtags || []).join(', '),
      requireFaceVisible: !!b.contentDeliverables?.requireFaceVisible,
      requireOriginalContent: b.contentDeliverables?.requireOriginalContent ?? true,
      requireSubtitles: !!b.contentDeliverables?.requireSubtitles,
      requireProductLink: !!b.contentDeliverables?.requireProductLink,
      contentReferences: JSON.stringify(b.contentDeliverables?.contentReferences || []),
      usageRights: b.contentDeliverables?.usageRights || 'organic',
      platforms: platforms.join(','),
      categories: (b.creatorRequirements?.categories || b.tags || []).join(','),
      locationScope: b.creatorRequirements?.locationScope || 'any',
      specificCities: (b.creatorRequirements?.specificCities || []).join(',') || null,
      creatorSize: (b.creatorRequirements?.creatorSize || 'micro').toUpperCase(),
      minEngagementRate: Number(b.creatorRequirements?.minEngagementRate) || 0,
      audienceAgeMin: b.creatorRequirements?.audienceAgeMin ?? null,
      audienceAgeMax: b.creatorRequirements?.audienceAgeMax ?? null,
      audienceGender: b.creatorRequirements?.audienceGender || 'all',
      audienceLocation: b.creatorRequirements?.audienceLocation || null,
      audienceInterests: (b.creatorRequirements?.audienceInterests || []).join(',') || null,
      requirePortfolio: !!b.creatorRequirements?.requirePortfolio,
      requireCustomProposal: !!b.creatorRequirements?.requireCustomProposal,
      biddingType: (b.budgetBidding?.biddingType || 'OPEN').toUpperCase(),
      budgetMin: budgetMin !== undefined ? Number(budgetMin) : null,
      budgetMax: budgetMax !== undefined ? Number(budgetMax) : null,
      creatorsRequired: Number(b.budgetBidding?.creatorsRequired) || 1,
      applicationDeadline: deadline,
      startDate: b.budgetBidding?.startDate ? new Date(b.budgetBidding.startDate) : null,
      allowInternational: !!b.budgetBidding?.allowInternational,
    },
    include: { brand: true, _count: { select: { applications: true } } },
  });

  return ok(res, { campaign: campaignToJson(campaign) }, 201);
});

router.put('/:id', requireAuth, requireRole('BRAND'), async (req: AuthedRequest, res) => {
  const existing = await prisma.campaign.findUnique({ where: { id: req.params.id }, include: { brand: true } });
  if (!existing || existing.deletedAt) return fail(res, 'Campaign not found', 404);
  if (existing.brand.userId !== req.userId) return fail(res, 'Forbidden', 403);

  const b = req.body || {};
  const publish = b.isPublic === true || b.status === 'active' || b.publish === true;

  const data: Record<string, unknown> = {};
  if (b.title || b.brief?.campaignName) data.title = b.title || b.brief?.campaignName;
  if (b.description) data.description = b.description;
  if (b.deliverables || b.contentDeliverables?.deliverables) data.deliverables = JSON.stringify(b.deliverables || b.contentDeliverables?.deliverables);
  if (b.requirements?.platforms || b.creatorRequirements?.platforms) data.platforms = (b.requirements?.platforms || b.creatorRequirements?.platforms).join(',');
  if (b.deadline || b.budgetBidding?.applicationDeadline) data.applicationDeadline = new Date(b.deadline || b.budgetBidding?.applicationDeadline);
  if (b.budgetBidding?.budgetMin !== undefined) data.budgetMin = Number(b.budgetBidding.budgetMin);
  if (b.budgetBidding?.budgetMax !== undefined || b.payment?.amount !== undefined) data.budgetMax = Number(b.budgetBidding?.budgetMax ?? b.payment?.amount);
  if (publish) data.status = 'ACTIVE';
  else if (b.status) data.status = String(b.status).toUpperCase();

  const campaign = await prisma.campaign.update({ where: { id: existing.id }, data, include: { brand: true, _count: { select: { applications: true } } } });
  return ok(res, { campaign: campaignToJson(campaign) });
});

router.delete('/:id', requireAuth, requireRole('BRAND'), async (req: AuthedRequest, res) => {
  const existing = await prisma.campaign.findUnique({ where: { id: req.params.id }, include: { brand: true } });
  if (!existing || existing.deletedAt) return fail(res, 'Campaign not found', 404);
  if (existing.brand.userId !== req.userId) return fail(res, 'Forbidden', 403);
  if (existing.status !== 'DRAFT') return fail(res, 'Only draft campaigns can be deleted', 400);
  await prisma.campaign.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
  return ok(res, { deleted: true });
});

// Applications ("bids") scoped to a campaign — brand view
router.get('/:campaignId/bids', requireAuth, async (req: AuthedRequest, res) => {
  const campaign = await prisma.campaign.findUnique({ where: { id: req.params.campaignId }, include: { brand: true } });
  if (!campaign) return fail(res, 'Campaign not found', 404);
  if (campaign.brand.userId !== req.userId && req.userRole !== 'ADMIN') return fail(res, 'Forbidden', 403);

  const { page, limit, skip } = pagination(req);
  const where: Record<string, unknown> = { campaignId: campaign.id };
  if (req.query.status) {
    const statusFilter = bidStatusFilterToPrismaWhere(String(req.query.status));
    if (statusFilter === null) return fail(res, `Invalid status filter: ${req.query.status}`, 400);
    where.status = statusFilter;
  }

  const [apps, total] = await Promise.all([
    prisma.campaignApplication.findMany({ where, include: { campaign: true, creator: { include: { user: true } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.campaignApplication.count({ where }),
  ]);
  return ok(res, { bids: apps.map(applicationToBidJson), pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
});

router.post('/:campaignId/bids/:bidId/accept', requireAuth, requireRole('BRAND'), async (req: AuthedRequest, res) => {
  const { campaignId, bidId } = req.params;
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, include: { brand: true } });
  if (!campaign) return fail(res, 'Campaign not found', 404);
  if (campaign.brand.userId !== req.userId) return fail(res, 'Forbidden', 403);

  const application = await prisma.campaignApplication.findUnique({ where: { id: bidId }, include: { creator: true } });
  if (!application || application.campaignId !== campaignId) return fail(res, 'Application not found', 404);
  if (application.status !== 'SUBMITTED' && application.status !== 'UNDER_REVIEW' && application.status !== 'SHORTLISTED') {
    return fail(res, 'Application cannot be accepted from its current status', 400);
  }

  const [, collaboration] = await prisma.$transaction([
    prisma.campaignApplication.update({ where: { id: bidId }, data: { status: 'ACCEPTED' } }),
    prisma.collaboration.create({ data: { campaignId, applicationId: bidId, amount: application.bidAmount } }),
  ]);

  const payment = await (await import('../services/paymentService')).PaymentService.createPayment(collaboration.id, application.bidAmount);
  await (await import('../services/paymentService')).PaymentService.holdInEscrow(payment.id);

  await prisma.conversation.upsert({
    where: { creatorUserId_brandUserId_campaignId: { creatorUserId: application.creator.userId, brandUserId: campaign.brand.userId, campaignId } },
    create: { campaignId, applicationId: bidId, creatorUserId: application.creator.userId, brandUserId: campaign.brand.userId },
    update: { applicationId: bidId },
  });

  await NotificationService.send(application.creator.userId, 'APPLICATION_ACCEPTED', 'Application accepted!', `Your application for "${campaign.title}" was accepted. Funds are now held in escrow.`, '/creator/bids');

  const updated = await prisma.campaignApplication.findUniqueOrThrow({ where: { id: bidId }, include: { campaign: true, creator: { include: { user: true } } } });
  return ok(res, { bid: applicationToBidJson(updated) });
});

router.post('/:campaignId/bids/:bidId/reject', requireAuth, requireRole('BRAND'), async (req: AuthedRequest, res) => {
  const { campaignId, bidId } = req.params;
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, include: { brand: true } });
  if (!campaign) return fail(res, 'Campaign not found', 404);
  if (campaign.brand.userId !== req.userId) return fail(res, 'Forbidden', 403);

  const application = await prisma.campaignApplication.findUnique({ where: { id: bidId }, include: { creator: true } });
  if (!application || application.campaignId !== campaignId) return fail(res, 'Application not found', 404);

  const updated = await prisma.campaignApplication.update({ where: { id: bidId }, data: { status: 'REJECTED' }, include: { campaign: true, creator: { include: { user: true } } } });
  await NotificationService.send(application.creator.userId, 'APPLICATION_REJECTED', 'Application update', `Your application for "${campaign.title}" was not selected this time.`, '/creator/bids');
  return ok(res, { bid: applicationToBidJson(updated) });
});

export default router;
