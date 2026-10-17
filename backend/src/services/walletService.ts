import { prisma } from '../db';

export type WithdrawResult =
  | { ok: true; withdrawal: { id: string; amount: number; method: string; status: string } }
  | { ok: false; reason: 'insufficient_balance' };

// Atomically claims the balance via updateMany (WHERE availableBalance >=
// amount) before creating the withdrawal record, so two concurrent requests
// for more than the combined available balance can't both succeed — see
// the comment on the call site in routes/wallet.ts for the race this closes.
export async function withdraw(userId: string, amountNum: number, method: string, details: unknown): Promise<WithdrawResult> {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return { ok: false, reason: 'insufficient_balance' };

  const result = await prisma.$transaction(async (tx) => {
    const claim = await tx.wallet.updateMany({
      where: { id: wallet.id, availableBalance: { gte: amountNum } },
      data: { availableBalance: { decrement: amountNum } },
    });
    if (claim.count === 0) return null;

    const created = await tx.withdrawal.create({
      data: { walletId: wallet.id, amount: amountNum, method, details: JSON.stringify(details || {}), status: 'PROCESSING' },
    });
    await tx.walletTransaction.create({ data: { walletId: wallet.id, type: 'WITHDRAWAL', amount: amountNum, note: `Withdrawal via ${method}` } });
    return created;
  });

  if (!result) return { ok: false, reason: 'insufficient_balance' };
  return { ok: true, withdrawal: { id: result.id, amount: result.amount, method: result.method, status: result.status.toLowerCase() } };
}
