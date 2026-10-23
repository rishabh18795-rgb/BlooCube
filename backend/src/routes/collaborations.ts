import { Router } from 'express';
import { prisma } from '../db';
import { ok, fail } from '../utils/responses';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

const router = Router();

function collabJson(c: {
  id: string;
  amount: number;
  status: string;
  createdAt: Date;
  campaign: { id: string; title: string };
  application: { id: string; creator: { id: string; user: { name: string } } };
  payment: { status: string } | null;
  submissions: { id: string; contentUrl: string; note: string | null; status: string; createdAt: Date }[];
}) {
  return {
    _id: c.id,
    campaign: { _id: c.campaign.id, title: c.campaign.title },
    creatorName: c.application.creator.user.name,
    amount: c.amount,
    status: c.status,
    paymentStatus: c.payment?.status?.toLowerCase() || 'pending',
    submissions: c.submissions.map((s) => ({ _id: s.id, contentUrl: s.contentUrl, note: s.note, status: s.status, createdAt: s.createdAt.toISOString() })),
    createdAt: c.createdAt.toISOString(),
  };
}

router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const include = { campaign: true, application: { include: { creator: { include: { user: true } } } }, payment: true, submissions: { orderBy: { createdAt: 'desc' as const } } };

  if (req.userRole === 'CREATOR') {
    const creator = await prisma.creatorProfile.findUnique({ where: { userId: req.userId! } });
    if (!creator) return fail(res, 'Creator profile not found', 404);
    const collaborations = await prisma.collaboration.findMany({ where: { application: { creatorId: creator.id } }, include, orderBy: { createdAt: 'desc' } });
    return ok(res, { collaborations: collaborations.map(collabJson) });
  }

  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.userId! } });
  if (!brand) return fail(res, 'Brand profile not found', 404);
  const collaborations = await prisma.collaboration.findMany({ where: { campaign: { brandId: brand.id } }, include, orderBy: { createdAt: 'desc' } });
  return ok(res, { collaborations: collaborations.map(collabJson) });
});

router.post('/:id/submissions', requireAuth, async (req: AuthedRequest, res) => {
  const { contentUrl, note } = req.body || {};
  if (!contentUrl) return fail(res, 'contentUrl is required', 422);

  const collaboration = await prisma.collaboration.findUnique({
    where: { id: req.params.id },
    include: { application: { include: { creator: true } }, campaign: { include: { brand: true } } },
  });
  if (!collaboration) return fail(res, 'Collaboration not found', 404);
  if (collaboration.application.creator.userId !== req.userId) return fail(res, 'Forbidden', 403);

  const submission = await prisma.contentSubmission.create({ data: { collaborationId: collaboration.id, contentUrl, note } });
  await prisma.collaboration.update({ where: { id: collaboration.id }, data: { status: 'submitted' } });
  await NotificationService.send(collaboration.campaign.brand.userId, 'CONTENT_APPROVED', 'New content submitted', `A creator submitted content for "${collaboration.campaign.title}"`, '/brand/collaborations');

  return ok(res, { submission: { _id: submission.id, contentUrl: submission.contentUrl, status: submission.status } }, 201);
});

export default router;
