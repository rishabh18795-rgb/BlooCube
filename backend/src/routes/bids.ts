import { Router } from 'express';
import { prisma } from '../db';
import { ok, fail } from '../utils/responses';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';
import { applicationToBidJson, bidStatusFilterToPrismaWhere } from '../utils/mappers';
import { NotificationService } from '../services/notificationService';

const router = Router();

// GET /api/bids — the current creator's own applications
router.get('/', requireAuth, requireRole('CREATOR'), async (req: AuthedRequest, res) => {
  const creator = await prisma.creatorProfile.findUnique({ where: { userId: req.userId! } });
  if (!creator) return fail(res, 'Creator profile not found', 404);

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const where: Record<string, unknown> = { creatorId: creator.id };
  if (req.query.status) {
    const statusFilter = bidStatusFilterToPrismaWhere(String(req.query.status));
    if (statusFilter === null) return fail(res, `Invalid status filter: ${req.query.status}`, 400);
    where.status = statusFilter;
  }
  if (req.query.campaign_id) where.campaignId = req.query.campaign_id;

  const [apps, total] = await Promise.all([
    prisma.campaignApplication.findMany({ where, include: { campaign: true, creator: { include: { user: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.campaignApplication.count({ where }),
  ]);

  return ok(res, { bids: apps.map(applicationToBidJson), pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
});

router.post('/', requireAuth, requireRole('CREATOR'), async (req: AuthedRequest, res) => {
  const creator = await prisma.creatorProfile.findUnique({ where: { userId: req.userId! } });
  if (!creator) return fail(res, 'Creator profile not found', 404);

  const { campaign_id, proposal_text, bid_amount, portfolio_links, delivery_days } = req.body || {};
  if (!campaign_id) return fail(res, 'campaign_id is required', 422);
  if (!proposal_text || String(proposal_text).trim().length < 10) return fail(res, 'Proposal must be at least 10 characters', 422);
  if (!bid_amount || Number(bid_amount) <= 0) return fail(res, 'Bid amount must be greater than zero', 422);

  const campaign = await prisma.campaign.findUnique({ where: { id: campaign_id }, include: { brand: true } });
  if (!campaign || campaign.deletedAt || campaign.status !== 'ACTIVE') return fail(res, 'Campaign is not accepting applications', 400);
  if (campaign.applicationDeadline.getTime() < Date.now()) return fail(res, 'Application deadline has passed', 400);

  const existing = await prisma.campaignApplication.findUnique({ where: { campaignId_creatorId: { campaignId: campaign_id, creatorId: creator.id } } });
  if (existing) return fail(res, 'You have already applied to this campaign', 409);

  const application = await prisma.campaignApplication.create({
    data: {
      campaignId: campaign_id,
      creatorId: creator.id,
      bidAmount: Number(bid_amount),
      proposal: proposal_text,
      portfolioLinks: JSON.stringify(portfolio_links || []),
      deliveryDays: Number(delivery_days) || 7,
    },
    include: { campaign: true, creator: { include: { user: true } } },
  });

  await NotificationService.send(campaign.brand.userId, 'NEW_APPLICATION', 'New campaign application', `A creator applied to "${campaign.title}"`, '/brand/bids');

  return ok(res, { bid: applicationToBidJson(application) }, 201);
});

router.post('/:id/withdraw', requireAuth, requireRole('CREATOR'), async (req: AuthedRequest, res) => {
  const creator = await prisma.creatorProfile.findUnique({ where: { userId: req.userId! } });
  if (!creator) return fail(res, 'Creator profile not found', 404);

  const application = await prisma.campaignApplication.findUnique({ where: { id: req.params.id } });
  if (!application || application.creatorId !== creator.id) return fail(res, 'Application not found', 404);
  if (!['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED'].includes(application.status)) {
    return fail(res, 'This application can no longer be withdrawn', 400);
  }

  const updated = await prisma.campaignApplication.update({ where: { id: application.id }, data: { status: 'WITHDRAWN' }, include: { campaign: true, creator: { include: { user: true } } } });
  return ok(res, { bid: applicationToBidJson(updated) });
});

export default router;
