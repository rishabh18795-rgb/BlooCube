import { Router } from 'express';
import { prisma } from '../db';
import { ok, fail } from '../utils/responses';
import { requireAuth, requireRole, AuthedRequest } from '../middleware/auth';
import { withdraw } from '../services/walletService';

const router = Router();

router.get('/', requireAuth, requireRole('CREATOR'), async (req: AuthedRequest, res) => {
  const wallet = await prisma.wallet.upsert({ where: { userId: req.userId! }, create: { userId: req.userId! }, update: {} });
  const transactions = await prisma.walletTransaction.findMany({ where: { walletId: wallet.id }, orderBy: { createdAt: 'desc' }, take: 50 });
  const withdrawals = await prisma.withdrawal.findMany({ where: { walletId: wallet.id }, orderBy: { createdAt: 'desc' } });

  return ok(res, {
    wallet: {
      availableBalance: wallet.availableBalance,
      pendingBalance: wallet.pendingBalance,
      totalEarnings: wallet.totalEarnings,
    },
    transactions: transactions.map((t) => ({ _id: t.id, type: t.type.toLowerCase(), amount: t.amount, note: t.note, createdAt: t.createdAt.toISOString() })),
    withdrawals: withdrawals.map((w) => ({ _id: w.id, amount: w.amount, method: w.method, status: w.status.toLowerCase(), createdAt: w.createdAt.toISOString() })),
  });
});

router.post('/withdraw', requireAuth, requireRole('CREATOR'), async (req: AuthedRequest, res) => {
  const { amount, method, details } = req.body || {};
  const amountNum = Number(amount);
  if (!amount || amountNum <= 0) return fail(res, 'Withdrawal amount must be greater than zero', 422);
  if (!method || !['upi', 'bank'].includes(method)) return fail(res, 'Invalid withdrawal method', 422);

  const result = await withdraw(req.userId!, amountNum, method, details);
  if (!result.ok) return fail(res, 'Insufficient available balance', 400);
  return ok(res, { withdrawal: { _id: result.withdrawal.id, amount: result.withdrawal.amount, method: result.withdrawal.method, status: result.withdrawal.status } }, 201);
});

export default router;
