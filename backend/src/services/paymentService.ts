import { prisma } from '../db';
import { randomUUID } from 'crypto';

/**
 * Mock payment/escrow provider. Isolated behind this service so a real
 * provider (Razorpay/Stripe) can replace the implementation later without
 * touching callers. Never put real provider secrets in frontend code.
 */
const PLATFORM_FEE_PERCENT = 10;

export const PaymentService = {
  async createPayment(collaborationId: string, amount: number) {
    const platformFee = Math.round(amount * (PLATFORM_FEE_PERCENT / 100));
    return prisma.payment.create({
      data: {
        collaborationId,
        amount,
        platformFee,
        status: 'INITIATED',
        providerRef: `mock_${randomUUID()}`,
      },
    });
  },

  async holdInEscrow(paymentId: string) {
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const collaboration = await prisma.collaboration.findUniqueOrThrow({
      where: { id: payment.collaborationId },
      include: { application: { include: { creator: true } } },
    });
    const creatorUserId = collaboration.application.creator.userId;
    const netAmount = payment.amount - payment.platformFee;

    const [updated] = await prisma.$transaction([
      prisma.payment.update({ where: { id: paymentId }, data: { status: 'IN_ESCROW' } }),
      prisma.wallet.upsert({
        where: { userId: creatorUserId },
        create: { userId: creatorUserId, pendingBalance: netAmount },
        update: { pendingBalance: { increment: netAmount } },
      }),
    ]);
    return updated;
  },

  // Returns null (rather than throwing) if the payment wasn't in IN_ESCROW
  // at the moment of the atomic claim — callers should treat that as "no-op,
  // already handled" rather than a server error. This specifically closes a
  // double-release race: the caller route re-checks status before calling
  // this, but that check-then-act pattern alone can't stop two concurrent
  // requests from both passing the check before either commits. The
  // updateMany's WHERE clause (id + status: 'IN_ESCROW') only lets one
  // concurrent caller win the transition; the loser sees count:0.
  async releasePayment(paymentId: string) {
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const collaboration = await prisma.collaboration.findUniqueOrThrow({
      where: { id: payment.collaborationId },
      include: { application: { include: { creator: true } } },
    });

    const creatorUserId = collaboration.application.creator.userId;
    const netAmount = payment.amount - payment.platformFee;

    return prisma.$transaction(async (tx) => {
      const claim = await tx.payment.updateMany({
        where: { id: paymentId, status: 'IN_ESCROW' },
        data: { status: 'RELEASED' },
      });
      if (claim.count === 0) return null;

      const wallet = await tx.wallet.upsert({
        where: { userId: creatorUserId },
        create: { userId: creatorUserId, availableBalance: netAmount, totalEarnings: netAmount },
        update: {
          availableBalance: { increment: netAmount },
          totalEarnings: { increment: netAmount },
          pendingBalance: { decrement: netAmount },
        },
      });
      await tx.walletTransaction.create({
        data: { walletId: wallet.id, type: 'CREDIT', amount: netAmount, note: 'Campaign payment released' },
      });

      return tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    });
  },

  // Same atomic-claim pattern as releasePayment, and for the same reason:
  // only a payment actually IN_ESCROW should ever have its pendingBalance
  // reversed. Not currently called from any route (no refund workflow is
  // wired up yet) — fixed for consistency so it's correct whenever one is.
  async refundPayment(paymentId: string) {
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const collaboration = await prisma.collaboration.findUniqueOrThrow({
      where: { id: payment.collaborationId },
      include: { application: { include: { creator: true } } },
    });
    const creatorUserId = collaboration.application.creator.userId;
    const netAmount = payment.amount - payment.platformFee;

    return prisma.$transaction(async (tx) => {
      const claim = await tx.payment.updateMany({
        where: { id: paymentId, status: 'IN_ESCROW' },
        data: { status: 'REFUNDED' },
      });
      if (claim.count === 0) return null;

      await tx.wallet.updateMany({ where: { userId: creatorUserId }, data: { pendingBalance: { decrement: netAmount } } });
      return tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    });
  },
};
