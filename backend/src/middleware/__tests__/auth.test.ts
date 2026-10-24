import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db';
import { signAccessToken } from '../../utils/jwt';
import app from '../../app';

// requireAuth only checked the JWT's own signature/expiry, not the
// account's current DB state — so deleting or suspending an account left
// its already-issued access token fully usable for the rest of its 15-
// minute lifetime. These tests prove the DB-backed check closes that gap,
// via a real protected route (GET /api/profile/me), not just the
// middleware function in isolation.

let userId: string;
let cookie: string;

before(async () => {
  const passwordHash = await bcrypt.hash('Test@12345', 10);
  const user = await prisma.user.create({
    data: {
      email: `auth-revocation-test-${Date.now()}@example.com`,
      passwordHash,
      name: 'Auth Revocation Test',
      role: 'CREATOR',
      creatorProfile: { create: { niches: 'tech', platforms: 'instagram' } },
    },
  });
  userId = user.id;
  cookie = `access_token=${signAccessToken({ sub: user.id, role: 'CREATOR' })}`;
});

test('a valid token for an active account is accepted (baseline, must not regress)', async () => {
  const res = await request(app).get('/api/profile/me').set('Cookie', cookie);
  assert.equal(res.status, 200);
});

test('the same still-unexpired token is rejected the moment the account is deactivated', async () => {
  await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  try {
    const res = await request(app).get('/api/profile/me').set('Cookie', cookie);
    assert.equal(res.status, 401);
  } finally {
    await prisma.user.update({ where: { id: userId }, data: { isActive: true } });
  }
});

test('the same still-unexpired token is rejected after soft-delete (deletedAt set)', async () => {
  await prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } });
  try {
    const res = await request(app).get('/api/profile/me').set('Cookie', cookie);
    assert.equal(res.status, 401);
  } finally {
    await prisma.user.update({ where: { id: userId }, data: { deletedAt: null } });
  }
});

test('reactivating the account makes the same token work again (confirms the check is live, not just cached)', async () => {
  await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  const blocked = await request(app).get('/api/profile/me').set('Cookie', cookie);
  assert.equal(blocked.status, 401);

  await prisma.user.update({ where: { id: userId }, data: { isActive: true } });
  const restored = await request(app).get('/api/profile/me').set('Cookie', cookie);
  assert.equal(restored.status, 200);
});

test('a token for a user id that no longer exists is rejected, not treated as authenticated', async () => {
  const ghostCookie = `access_token=${signAccessToken({ sub: 'nonexistent-user-id', role: 'CREATOR' })}`;
  const res = await request(app).get('/api/profile/me').set('Cookie', ghostCookie);
  assert.equal(res.status, 401);
});
