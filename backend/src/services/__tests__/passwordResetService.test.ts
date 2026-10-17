import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db';
import { createPasswordResetToken, claimPasswordResetToken, hashResetToken } from '../passwordResetService';

// Integration tests against the real local dev SQLite DB (DATABASE_URL from
// backend/.env — never the production Railway volume). Uses its own
// throwaway test users, cleaned up in `after`.

const TEST_EMAIL_PREFIX = 'passwordresettest+';
let userId: string;

before(async () => {
  const user = await prisma.user.create({
    data: {
      email: `${TEST_EMAIL_PREFIX}${Date.now()}@example.invalid`,
      passwordHash: await bcrypt.hash('OriginalPass123!', 10),
      name: 'Password Reset Test User',
      role: 'CREATOR',
    },
  });
  userId = user.id;
});

after(async () => {
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

test('a freshly issued token successfully resets the password', async () => {
  const rawToken = await createPasswordResetToken(userId);
  const newHash = await bcrypt.hash('NewPass456!', 10);

  const claimedUserId = await claimPasswordResetToken(rawToken, newHash);
  assert.equal(claimedUserId, userId);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  assert.equal(user.passwordHash, newHash);
});

test('the same token cannot be used a second time (single-use enforcement)', async () => {
  const rawToken = await createPasswordResetToken(userId);
  const firstHash = await bcrypt.hash('FirstUse123!', 10);
  const secondHash = await bcrypt.hash('SecondUse456!', 10);

  const firstClaim = await claimPasswordResetToken(rawToken, firstHash);
  assert.equal(firstClaim, userId, 'first use should succeed');

  const secondClaim = await claimPasswordResetToken(rawToken, secondHash);
  assert.equal(secondClaim, null, 'reusing the same token must be rejected');

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  assert.equal(user.passwordHash, firstHash, 'password must reflect only the first (accepted) use');
});

test('an expired token is rejected even though it was never used', async () => {
  const rawToken = await createPasswordResetToken(userId);
  // Force it into the past directly — simulates time passing without a
  // real 30-minute sleep in the test run.
  await prisma.passwordResetToken.update({
    where: { tokenHash: hashResetToken(rawToken) },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });

  const claimed = await claimPasswordResetToken(rawToken, await bcrypt.hash('ShouldNotApply1!', 10));
  assert.equal(claimed, null, 'an expired token must not be claimable');
});

test('an unrecognized/invalid token is rejected', async () => {
  const claimed = await claimPasswordResetToken('not-a-real-token-value', await bcrypt.hash('ShouldNotApply2!', 10));
  assert.equal(claimed, null);
});

test('requesting a new token invalidates the previous unused one', async () => {
  const firstToken = await createPasswordResetToken(userId);
  const secondToken = await createPasswordResetToken(userId);
  assert.notEqual(firstToken, secondToken);

  const claimedWithFirst = await claimPasswordResetToken(firstToken, await bcrypt.hash('ShouldNotApply3!', 10));
  assert.equal(claimedWithFirst, null, 'a superseded token must not be claimable even though it was never individually used');

  const claimedWithSecond = await claimPasswordResetToken(secondToken, await bcrypt.hash('AppliesFine789!', 10));
  assert.equal(claimedWithSecond, userId, 'the latest token should still work');
});
