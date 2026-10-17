import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db';
import { failWithdrawal } from '../adminWithdrawalService';

let userId: string;
let walletId: string;
let withdrawalId: string;

before(async () => {
  const user = await prisma.user.create({
    data: { email: `adminwithdrawtest+${Date.now()}@example.invalid`, passwordHash: await bcrypt.hash('x', 10), name: 'Admin Withdraw Test', role: 'CREATOR' },
  });
  userId = user.id;
  const wallet = await prisma.wallet.create({ data: { userId, availableBalance: 200 } });
  walletId = wallet.id;
});

beforeEach(async () => {
  await prisma.walletTransaction.deleteMany({ where: { walletId } });
  await prisma.withdrawal.deleteMany({ where: { walletId } });
  await prisma.wallet.update({ where: { id: walletId }, data: { availableBalance: 200 } });
  const withdrawal = await prisma.withdrawal.create({
    data: { walletId, amount: 500, method: 'upi', details: '{}', status: 'PROCESSING' },
  });
  withdrawalId = withdrawal.id;
});

after(async () => {
  await prisma.walletTransaction.deleteMany({ where: { walletId } });
  await prisma.withdrawal.deleteMany({ where: { walletId } });
  await prisma.wallet.delete({ where: { id: walletId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

test('marking a withdrawal FAILED refunds the amount back to availableBalance', async () => {
  const result = await failWithdrawal(withdrawalId);
  assert.equal(result.ok, true);

  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });
  assert.equal(wallet.availableBalance, 700, 'the withdrawal amount (500) must be credited back onto the pre-existing 200');

  const withdrawal = await prisma.withdrawal.findUniqueOrThrow({ where: { id: withdrawalId } });
  assert.equal(withdrawal.status, 'FAILED');
});

test('marking the same withdrawal FAILED twice does not double-refund', async () => {
  const first = await failWithdrawal(withdrawalId);
  assert.equal(first.ok, true);

  const second = await failWithdrawal(withdrawalId);
  assert.equal(second.ok, false, 'a withdrawal already FAILED must not be claimable again');

  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });
  assert.equal(wallet.availableBalance, 700, 'balance must reflect exactly one refund, not two');
});

test('failing a nonexistent withdrawal id is rejected cleanly', async () => {
  const result = await failWithdrawal('not-a-real-withdrawal-id');
  assert.equal(result.ok, false);
});
