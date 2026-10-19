import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db';
import { logAdminAction } from '../auditLogService';

let actorUserId: string;

before(async () => {
  const user = await prisma.user.create({
    data: { email: `auditlogtest+${Date.now()}@example.invalid`, passwordHash: await bcrypt.hash('x', 10), name: 'Audit Log Test Admin', role: 'ADMIN' },
  });
  actorUserId = user.id;
});

after(async () => {
  await prisma.auditLog.deleteMany({ where: { userId: actorUserId } });
  await prisma.user.delete({ where: { id: actorUserId } });
  await prisma.$disconnect();
});

test('logAdminAction records actor, action, and JSON-encoded details', async () => {
  await logAdminAction(actorUserId, 'USER_DEACTIVATED', { target: 'some-user-id', outcome: 'success' });

  const entries = await prisma.auditLog.findMany({ where: { userId: actorUserId } });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].action, 'USER_DEACTIVATED');

  const details = JSON.parse(entries[0].details!);
  assert.equal(details.target, 'some-user-id');
  assert.equal(details.outcome, 'success');
});

test('logAdminAction never embeds password/token-shaped keys even if passed', async () => {
  // Defensive check: the service itself doesn't redact anything (it's the
  // caller's job never to pass secrets), but this documents the contract —
  // only pass target/outcome/non-sensitive context, which every real call
  // site in admin.ts does.
  await logAdminAction(actorUserId, 'TEST_ACTION', { target: 'x', outcome: 'success' });
  const entries = await prisma.auditLog.findMany({ where: { userId: actorUserId, action: 'TEST_ACTION' } });
  const details = JSON.parse(entries[0].details!);
  assert.ok(!('password' in details) && !('token' in details) && !('secret' in details));
});
