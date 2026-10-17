import { Router } from 'express';
import { prisma } from '../db';
import { ok, fail } from '../utils/responses';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';
import { PaymentService } from '../services/paymentService';
import { NotificationService } from '../services/notificationService';

const router = Router();

function paymentJson(p: { id: string; amount: number; platformFee: number; status: string; providerRef: string | null; createdAt: Date; updatedAt: Date }) {
  return {
    _id: p.id,
    amount: p.amount,
    platformFee: p.platformFee,
    netAmount: p.amount - p.platformFee,
    status: p.status.toLowerCase(),
    providerRef: p.providerRef,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// GET /api/payments — brand's outgoing payments or creator's incoming payments
router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  if (req.userRole === 'BRAND') {
    const brand = await prisma.brandProfile.findUnique({ where: { userId: req.userId! } });
    if (!brand) return fail(res, 'Brand profile not found', 404);
    const payments = await prisma.payment.findMany({
      where: { collaboration: { campaign: { brandId: brand.id } } },
      include: { collaboration: { include: { campaign: true, application: { include: { creator: { include: { user: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return ok(res, {
      payments: payments.map((p) => ({ ...paymentJson(p), campaign: { _id: p.collaboration.campaign.id, title: p.collaboration.campaign.title }, creator: p.collaboration.application.creator.user.name })),
    });
  }

  const creator = await prisma.creatorProfile.findUnique({ where: { userId: req.userId! } });
  if (!creator) return fail(res, 'Creator profile not found', 404);
  const payments = await prisma.payment.findMany({
    where: { collaboration: { application: { creatorId: creator.id } } },
    include: { collaboration: { include: { campaign: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, { payments: payments.map((p) => ({ ...paymentJson(p), campaign: { _id: p.collaboration.campaign.id, title: p.collaboration.campaign.title } })) });
});

// POST /api/payments/:collaborationId/release — brand approves deliverable & releases escrow
router.post('/:collaborationId/release', requireAuth, requireRole('BRAND'), async (req: AuthedRequest, res) => {
  const collaboration = await prisma.collaboration.findUnique({
    where: { id: req.params.collaborationId },
    include: { campaign: { include: { brand: true } }, payment: true, application: { include: { creator: true } } },
  });
  if (!collaboration) return fail(res, 'Collaboration not found', 404);
  if (collaboration.campaign.brand.userId !== req.userId) return fail(res, 'Forbidden', 403);
  if (!collaboration.payment) return fail(res, 'No payment found for this collaboration', 400);
  if (collaboration.payment.status !== 'IN_ESCROW') return fail(res, 'Payment is not in escrow', 400);

  await prisma.collaboration.update({ where: { id: collaboration.id }, data: { status: 'completed' } });
  const payment = await PaymentService.releasePayment(collaboration.payment.id);
  if (!payment) return fail(res, 'Payment has already been released', 409);
  await NotificationService.send(collaboration.application.creator.userId, 'PAYMENT_RELEASED', 'Payment released', `₹${(payment.amount - payment.platformFee).toLocaleString('en-IN')} has been added to your wallet.`);

  return ok(res, { payment: paymentJson(payment) });
});

export default router;
