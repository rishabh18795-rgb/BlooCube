import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db';
import { withdraw } from '../walletService';

// Integration tests against the real local dev SQLite DB (never the
// production Railway volume).

let userId: string;
let walletId: string;

before(async () => {
  const user = await prisma.user.create({
    data: {
      email: `wallettest+${Date.now()}@example.invalid`,
      passwordHash: await bcrypt.hash('x', 10),
      name: 'Wallet Test Creator',
      role: 'CREATOR',
    },
  });
  userId = user.id;
  const wallet = await prisma.wallet.create({ data: { userId, availableBalance: 0 } });
  walletId = wallet.id;
});

beforeEach(async () => {
  await prisma.withdrawal.deleteMany({ where: { walletId } });
  await prisma.walletTransaction.deleteMany({ where: { walletId } });
  await prisma.wallet.update({ where: { id: walletId }, data: { availableBalance: 1000 } });
});

after(async () => {
  await prisma.withdrawal.deleteMany({ where: { walletId } });
  await prisma.walletTransaction.deleteMany({ where: { walletId } });
  await prisma.wallet.delete({ where: { id: walletId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

test('withdrawing up to the available balance succeeds and decrements it', async () => {
  const result = await withdraw(userId, 600, 'upi', { vpa: 'test@upi' });
  assert.equal(result.ok, true);
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });
  assert.equal(wallet.availableBalance, 400);
});

test('withdrawing more than the available balance is rejected, not silently clamped', async () => {
  const result = await withdraw(userId, 5000, 'upi', { vpa: 'test@upi' });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, 'insufficient_balance');
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });
  assert.equal(wallet.availableBalance, 1000, 'balance must be untouched on rejection');
});

test('two concurrent withdrawals that together exceed the balance cannot both succeed (no negative balance)', async () => {
  // Balance is 1000; two concurrent requests for 700 each (1400 total)
  // must not both go through — exactly one should win.
  const [first, second] = await Promise.all([
    withdraw(userId, 700, 'upi', {}),
    withdraw(userId, 700, 'upi', {}),
  ]);

  const succeeded = [first, second].filter((r) => r.ok);
  assert.equal(succeeded.length, 1, 'exactly one of the two racing withdrawals should succeed');

  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });
  assert.equal(wallet.availableBalance, 300, 'balance must reflect exactly one deduction, never go negative');
  assert.ok(wallet.availableBalance >= 0, 'balance must never go negative');
});
