import { Router } from 'express';
import { prisma } from '../db';
import { ok, fail } from '../utils/responses';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const router = Router();

// Maps our Prisma enum values to the snake_case types the frontend expects.
const TYPE_MAP: Record<string, string> = {
  NEW_CAMPAIGN: 'campaign_created',
  NEW_APPLICATION: 'bid_received',
  APPLICATION_ACCEPTED: 'bid_accepted',
  APPLICATION_REJECTED: 'bid_rejected',
  NEW_MESSAGE: 'user_activity',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_RELEASED: 'payment_received',
  CAMPAIGN_DEADLINE: 'campaign_deadline',
  CONTENT_APPROVED: 'bid_received',
  CONTENT_REVISION_REQUESTED: 'bid_received',
  WITHDRAWAL_COMPLETED: 'payment_received',
};

function toNotificationJson(n: { id: string; type: string; title: string; body: string; link: string | null; readAt: Date | null; createdAt: Date }) {
  return {
    _id: n.id,
    title: n.title,
    message: n.body,
    type: TYPE_MAP[n.type] || 'system_alert',
    priority: 'medium',
    link: n.link || undefined,
    isRead: !!n.readAt,
    readAt: n.readAt ? n.readAt.toISOString() : undefined,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.createdAt.toISOString(),
  };
}

router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const where: Record<string, unknown> = { userId: req.userId! };
  if (req.query.unreadOnly === 'true') where.readAt = null;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.userId!, readAt: null } }),
  ]);

  return ok(res, {
    notifications: notifications.map(toNotificationJson),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    unreadCount,
  });
});

router.get('/unread-count', requireAuth, async (req: AuthedRequest, res) => {
  const unreadCount = await prisma.notification.count({ where: { userId: req.userId!, readAt: null } });
  return ok(res, { unreadCount });
});

router.get('/stats', requireAuth, async (req: AuthedRequest, res) => {
  const [total, unread] = await Promise.all([
    prisma.notification.count({ where: { userId: req.userId! } }),
    prisma.notification.count({ where: { userId: req.userId!, readAt: null } }),
  ]);
  return ok(res, { total, unread });
});

router.patch('/:id/read', requireAuth, async (req: AuthedRequest, res) => {
  const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!n || n.userId !== req.userId) return fail(res, 'Notification not found', 404);
  const updated = await prisma.notification.update({ where: { id: n.id }, data: { readAt: new Date() } });
  return ok(res, { notification: toNotificationJson(updated) });
});

router.patch('/mark-all-read', requireAuth, async (req: AuthedRequest, res) => {
  const result = await prisma.notification.updateMany({ where: { userId: req.userId!, readAt: null }, data: { readAt: new Date() } });
  return ok(res, { modifiedCount: result.count });
});

router.delete('/:id', requireAuth, async (req: AuthedRequest, res) => {
  const n = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!n || n.userId !== req.userId) return fail(res, 'Notification not found', 404);
  await prisma.notification.delete({ where: { id: n.id } });
  return ok(res, { id: n.id });
});

export default router;
