import { prisma } from '../db';

export type FailWithdrawalResult =
  | { ok: true; withdrawalId: string }
  | { ok: false; reason: 'not_found_or_already_failed' };

// Reverses the balance hold placed when the withdrawal was first requested
// (services/walletService.ts decrements availableBalance up front). Without
// this, a withdrawal an admin marks FAILED after a real payout attempt
// bounces would leave that amount permanently missing from the user's
// balance. Atomic + idempotent via the same updateMany-claim pattern used
// elsewhere: only a withdrawal not already FAILED can be claimed, so
// retried or duplicate calls can't double-credit the refund.
export async function failWithdrawal(withdrawalId: string): Promise<FailWithdrawalResult> {
  const result = await prisma.$transaction(async (tx) => {
    const claim = await tx.withdrawal.updateMany({
      where: { id: withdrawalId, status: { not: 'FAILED' } },
      data: { status: 'FAILED' },
    });
    if (claim.count === 0) return null;

    const withdrawal = await tx.withdrawal.findUniqueOrThrow({ where: { id: withdrawalId } });
    await tx.wallet.update({ where: { id: withdrawal.walletId }, data: { availableBalance: { increment: withdrawal.amount } } });
    await tx.walletTransaction.create({
      data: { walletId: withdrawal.walletId, type: 'REFUND', amount: withdrawal.amount, note: 'Withdrawal failed — amount returned to available balance' },
    });
    return withdrawal;
  });

  if (!result) return { ok: false, reason: 'not_found_or_already_failed' };
  return { ok: true, withdrawalId: result.id };
}
