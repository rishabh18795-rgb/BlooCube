import { Router } from 'express';
import { prisma } from '../db';
import { ok, fail } from '../utils/responses';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

const router = Router();

// GET /api/conversations — list conversations for the current user
router.get('/', requireAuth, async (req: AuthedRequest, res) => {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ creatorUserId: req.userId! }, { brandUserId: req.userId! }] },
    include: {
      creatorUser: true,
      brandUser: true,
      campaign: true,
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const result = await Promise.all(
    conversations.map(async (c) => {
      const unread = await prisma.message.count({ where: { conversationId: c.id, readAt: null, NOT: { senderId: req.userId! } } });
      const other = c.creatorUserId === req.userId ? c.brandUser : c.creatorUser;
      return {
        _id: c.id,
        campaign: c.campaign ? { _id: c.campaign.id, title: c.campaign.title } : null,
        otherUser: { _id: other.id, name: other.name, role: other.role.toLowerCase() },
        lastMessage: c.messages[0] ? { body: c.messages[0].body, createdAt: c.messages[0].createdAt.toISOString() } : null,
        unreadCount: unread,
        updatedAt: c.updatedAt.toISOString(),
      };
    })
  );

  return ok(res, { conversations: result });
});

router.get('/:id/messages', requireAuth, async (req: AuthedRequest, res) => {
  const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } });
  if (!conversation) return fail(res, 'Conversation not found', 404);
  if (conversation.creatorUserId !== req.userId && conversation.brandUserId !== req.userId) return fail(res, 'Forbidden', 403);

  const messages = await prisma.message.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: 'asc' }, include: { sender: true } });

  await prisma.message.updateMany({
    where: { conversationId: conversation.id, readAt: null, NOT: { senderId: req.userId! } },
    data: { readAt: new Date() },
  });

  return ok(res, {
    messages: messages.map((m) => ({
      _id: m.id,
      body: m.body,
      sender: { _id: m.sender.id, name: m.sender.name },
      isMine: m.senderId === req.userId,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt ? m.readAt.toISOString() : null,
    })),
  });
});

router.post('/:id/messages', requireAuth, async (req: AuthedRequest, res) => {
  const { body } = req.body || {};
  if (!body || !String(body).trim()) return fail(res, 'Message body is required', 422);

  const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } });
  if (!conversation) return fail(res, 'Conversation not found', 404);
  if (conversation.creatorUserId !== req.userId && conversation.brandUserId !== req.userId) return fail(res, 'Forbidden', 403);

  const message = await prisma.message.create({ data: { conversationId: conversation.id, senderId: req.userId!, body: String(body).trim() }, include: { sender: true } });
  await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

  const recipientIsBrand = conversation.creatorUserId === req.userId;
  const recipientId = recipientIsBrand ? conversation.brandUserId : conversation.creatorUserId;
  const basePath = recipientIsBrand ? '/brand/messages' : '/creator/messages';
  const link = conversation.campaignId ? `${basePath}?campaignId=${conversation.campaignId}` : basePath;
  await NotificationService.send(recipientId, 'NEW_MESSAGE', 'New message', body.slice(0, 80), link);

  return ok(res, { message: { _id: message.id, body: message.body, sender: { _id: message.sender.id, name: message.sender.name }, isMine: true, createdAt: message.createdAt.toISOString() } }, 201);
});

export default router;
