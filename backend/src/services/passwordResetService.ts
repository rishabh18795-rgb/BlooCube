import crypto from 'node:crypto';
import { prisma } from '../db';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export function hashResetToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

// Invalidates any still-unused tokens from earlier requests, then issues a
// fresh one. Returns the raw token to email — only its hash is ever stored.
export async function createPasswordResetToken(userId: string): Promise<string> {
  await prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } });

  const rawToken = crypto.randomBytes(32).toString('hex');
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashResetToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });
  return rawToken;
}

// Atomically claims the token and applies the new password hash in one
// transaction. The updateMany's WHERE clause (usedAt: null, expiresAt in
// the future) only matches an unused, unexpired row, and only one
// concurrent caller can win it — a second claim attempt (replay, or a race
// between two submissions of the same link) sees count:0 and is rejected.
// Returns the affected userId on success, null if the token is invalid,
// expired, or already used.
export async function claimPasswordResetToken(rawToken: string, newPasswordHash: string): Promise<string | null> {
  const tokenHash = hashResetToken(rawToken);

  return prisma.$transaction(async (tx) => {
    const claim = await tx.passwordResetToken.updateMany({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claim.count === 0) return null;

    const token = await tx.passwordResetToken.findUniqueOrThrow({ where: { tokenHash } });
    await tx.user.update({ where: { id: token.userId }, data: { passwordHash: newPasswordHash } });
    return token.userId;
  });
}
