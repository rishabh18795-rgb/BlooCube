import { Router } from 'express';
import { prisma } from '../db';
import { ok, fail } from '../utils/responses';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';
import { failWithdrawal } from '../services/adminWithdrawalService';

const router = Router();

// Every route below is both frontend-gated (middleware.ts) and server-gated here —
// authorization must never rely on the frontend alone.
router.use(requireAuth, requireRole('ADMIN'));

router.get('/overview', async (req, res) => {
  const [users, creators, brands, campaigns, activeCampaigns, applications, payments, disputes] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'CREATOR' } }),
    prisma.user.count({ where: { role: 'BRAND' } }),
    prisma.campaign.count(),
    prisma.campaign.count({ where: { status: 'ACTIVE' } }),
    prisma.campaignApplication.count(),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'RELEASED' } }),
    prisma.dispute.count({ where: { status: 'open' } }),
  ]);
  return ok(res, {
    users,
    creators,
    brands,
    campaigns,
    activeCampaigns,
    applications,
    gmv: payments._sum.amount || 0,
    openDisputes: disputes,
  });
});

router.get('/users', async (req: AuthedRequest, res) => {
  const role = req.query.role as string | undefined;
  const users = await prisma.user.findMany({
    where: role ? { role: role.toUpperCase() as any } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return ok(res, { users: users.map((u) => ({ _id: u.id, name: u.name, email: u.email, role: u.role.toLowerCase(), isActive: u.isActive, isVerified: u.isVerified, createdAt: u.createdAt.toISOString() })) });
});

router.put('/users/:id/status', async (req, res) => {
  const { isActive } = req.body || {};
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: !!isActive } });
  return ok(res, { user: { _id: user.id, isActive: user.isActive } });
});

router.put('/creators/:id/verify', async (req, res) => {
  const creator = await prisma.creatorProfile.update({ where: { id: req.params.id }, data: { verified: true } });
  return ok(res, { creator: { _id: creator.id, verified: creator.verified } });
});

router.put('/brands/:id/verify', async (req, res) => {
  const brand = await prisma.brandProfile.update({ where: { id: req.params.id }, data: { verified: true } });
  return ok(res, { brand: { _id: brand.id, verified: brand.verified } });
});

router.get('/campaigns', async (req, res) => {
  const campaigns = await prisma.campaign.findMany({ include: { brand: true, _count: { select: { applications: true } } }, orderBy: { createdAt: 'desc' }, take: 200 });
  return ok(res, { campaigns: campaigns.map((c) => ({ _id: c.id, title: c.title, status: c.status.toLowerCase(), brand: c.brand.companyName, applications: c._count.applications, createdAt: c.createdAt.toISOString() })) });
});

router.get('/payments', async (req, res) => {
  const payments = await prisma.payment.findMany({ include: { collaboration: { include: { campaign: true } } }, orderBy: { createdAt: 'desc' }, take: 200 });
  return ok(res, { payments: payments.map((p) => ({ _id: p.id, amount: p.amount, status: p.status.toLowerCase(), campaign: p.collaboration.campaign.title, createdAt: p.createdAt.toISOString() })) });
});

router.get('/withdrawals', async (req, res) => {
  const withdrawals = await prisma.withdrawal.findMany({ include: { wallet: { include: { user: true } } }, orderBy: { createdAt: 'desc' }, take: 200 });
  return ok(res, { withdrawals: withdrawals.map((w) => ({ _id: w.id, amount: w.amount, method: w.method, status: w.status.toLowerCase(), user: w.wallet.user.name, createdAt: w.createdAt.toISOString() })) });
});

router.put('/withdrawals/:id/status', async (req, res) => {
  const { status } = req.body || {};
  const newStatus = String(status).toUpperCase();
  if (!['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(newStatus)) return fail(res, 'Invalid status', 422);

  if (newStatus === 'FAILED') {
    const result = await failWithdrawal(req.params.id);
    if (!result.ok) return fail(res, 'Withdrawal not found or already marked failed', 404);
    return ok(res, { withdrawal: { _id: result.withdrawalId, status: 'failed' } });
  }

  const withdrawal = await prisma.withdrawal.update({ where: { id: req.params.id }, data: { status: newStatus as any } });
  if (withdrawal.status === 'COMPLETED') {
    const wallet = await prisma.wallet.findUnique({ where: { id: withdrawal.walletId } });
    if (wallet) {
      await (await import('../services/notificationService')).NotificationService.send(wallet.userId, 'WITHDRAWAL_COMPLETED', 'Withdrawal completed', `Your withdrawal of ₹${withdrawal.amount.toLocaleString('en-IN')} has been processed.`);
    }
  }
  return ok(res, { withdrawal: { _id: withdrawal.id, status: withdrawal.status.toLowerCase() } });
});

router.get('/disputes', async (req, res) => {
  const disputes = await prisma.dispute.findMany({ orderBy: { createdAt: 'desc' } });
  return ok(res, { disputes });
});

router.put('/disputes/:id', async (req, res) => {
  const { status, resolution } = req.body || {};
  const dispute = await prisma.dispute.update({ where: { id: req.params.id }, data: { status, resolution } });
  return ok(res, { dispute });
});

router.get('/subscriptions', async (req, res) => {
  const subscriptions = await prisma.subscription.findMany();
  return ok(res, { subscriptions });
});

router.get('/settings', async (req, res) => {
  const configs = await prisma.platformConfig.findMany();
  return ok(res, { settings: Object.fromEntries(configs.map((c) => [c.key, JSON.parse(c.value)])) });
});

router.put('/settings/:key', async (req, res) => {
  const value = JSON.stringify(req.body?.value ?? {});
  await prisma.platformConfig.upsert({ where: { key: req.params.key }, create: { key: req.params.key, value }, update: { value } });
  return ok(res, { updated: true });
});

export default router;
