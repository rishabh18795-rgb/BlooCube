import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db';
import { signAccessToken } from '../../utils/jwt';
import app from '../../app';
import { AVATAR_DIR } from '../../services/avatarStorage';

// Route-level (HTTP) tests, not just service-level — the two bugs this
// closes (POST /api/profile/avatar and PUT /api/profile/me both 404ing in
// production) were route-registration/path mismatches that a service-layer
// unit test would never have caught.
//
// Users with a creatorProfile/brandProfile are intentionally left in the
// local dev DB afterward (not deleted) — matching every other test file in
// this project (see paymentService.test.ts), since the FK from those
// profile tables back to User blocks a plain user.delete.

let creatorUserId: string;
let creatorCookie: string;
let brandUserId: string;
let brandCookie: string;

function authCookie(userId: string, role: string) {
  const token = signAccessToken({ sub: userId, role });
  return `access_token=${token}`;
}

before(async () => {
  const passwordHash = await bcrypt.hash('Test@12345', 10);

  const creator = await prisma.user.create({
    data: {
      email: `profile-test-creator-${Date.now()}@example.com`,
      passwordHash,
      name: 'Profile Test Creator',
      role: 'CREATOR',
      creatorProfile: { create: { niches: 'tech', platforms: 'instagram' } },
    },
  });
  creatorUserId = creator.id;
  creatorCookie = authCookie(creator.id, 'creator');

  const brand = await prisma.user.create({
    data: {
      email: `profile-test-brand-${Date.now()}@example.com`,
      passwordHash,
      name: 'Profile Test Brand',
      role: 'BRAND',
      brandProfile: { create: { companyName: 'Test Co' } },
    },
  });
  brandUserId = brand.id;
  brandCookie = authCookie(brand.id, 'brand');
});

test('PUT /api/profile/me persists phone, address, and preferences (previously 404)', async () => {
  const res = await request(app)
    .put('/api/profile/me')
    .set('Cookie', brandCookie)
    .send({
      name: 'Updated Brand Name',
      profile: {
        phone: '+1 555 000 1111',
        address: '123 Market St',
        bio: 'Updated bio',
        website: 'https://example.com',
        preferences: { emailNotifications: false, marketingEmails: true },
      },
    });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.user.name, 'Updated Brand Name');
  assert.equal(res.body.data.user.profile.phone, '+1 555 000 1111');
  assert.equal(res.body.data.user.profile.address, '123 Market St');
  assert.equal(res.body.data.user.profile.bio, 'Updated bio');
  assert.equal(res.body.data.user.profile.website, 'https://example.com');
  assert.equal(res.body.data.user.profile.preferences.emailNotifications, false);
  assert.equal(res.body.data.user.profile.preferences.marketingEmails, true);

  // Persisted, not just echoed back — a fresh GET confirms it actually hit the DB.
  const refetched = await request(app).get('/api/profile/me').set('Cookie', brandCookie);
  assert.equal(refetched.body.data.user.profile.phone, '+1 555 000 1111');
  assert.equal(refetched.body.data.user.profile.preferences.emailNotifications, false);
});

test('PUT /api/profile/me rejects unauthenticated requests', async () => {
  const res = await request(app).put('/api/profile/me').send({ name: 'X' });
  assert.equal(res.status, 401);
});

test('PUT /api/profile/me cannot be used to escalate role or touch another account', async () => {
  const res = await request(app)
    .put('/api/profile/me')
    .set('Cookie', creatorCookie)
    .send({ name: 'Still Creator', role: 'ADMIN', _id: brandUserId });

  assert.equal(res.status, 200);
  const updated = await prisma.user.findUniqueOrThrow({ where: { id: creatorUserId } });
  assert.equal(updated.role, 'CREATOR');
  const brandUntouched = await prisma.user.findUniqueOrThrow({ where: { id: brandUserId } });
  assert.notEqual(brandUntouched.name, 'Still Creator');
});

function tinyPng(): Buffer {
  // 1x1 transparent PNG
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64'
  );
}

test('POST /api/profile/avatar accepts a valid image and persists a working, servable URL (previously 404)', async () => {
  const res = await request(app)
    .post('/api/profile/avatar')
    .set('Cookie', creatorCookie)
    .attach('avatar', tinyPng(), { filename: 'avatar.png', contentType: 'image/png' });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.match(res.body.data.avatar_url, /^\/uploads\/avatars\/.+\.png$/);

  const filePath = path.join(AVATAR_DIR, path.basename(res.body.data.avatar_url));
  assert.equal(fs.existsSync(filePath), true);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: creatorUserId } });
  assert.equal(user.avatarUrl, res.body.data.avatar_url);

  // Survives refresh / re-fetch, not just the upload response.
  const refetched = await request(app).get('/api/profile/me').set('Cookie', creatorCookie);
  assert.equal(refetched.body.data.user.profile.avatar_url, res.body.data.avatar_url);

  fs.unlinkSync(filePath);
});

test('POST /api/profile/avatar for a brand also updates the brand logoUrl', async () => {
  const res = await request(app)
    .post('/api/profile/avatar')
    .set('Cookie', brandCookie)
    .attach('avatar', tinyPng(), { filename: 'logo.png', contentType: 'image/png' });

  assert.equal(res.status, 200);
  const brandProfile = await prisma.brandProfile.findUniqueOrThrow({ where: { userId: brandUserId } });
  assert.equal(brandProfile.logoUrl, res.body.data.avatar_url);

  fs.unlinkSync(path.join(AVATAR_DIR, path.basename(res.body.data.avatar_url)));
});

test('POST /api/profile/avatar rejects a non-image file', async () => {
  const res = await request(app)
    .post('/api/profile/avatar')
    .set('Cookie', creatorCookie)
    .attach('avatar', Buffer.from('not an image'), { filename: 'evil.exe', contentType: 'application/octet-stream' });

  assert.equal(res.status, 415);
  assert.equal(res.body.success, false);
});

test('POST /api/profile/avatar rejects a file over 5MB', async () => {
  const big = Buffer.alloc(6 * 1024 * 1024, 1);
  const res = await request(app)
    .post('/api/profile/avatar')
    .set('Cookie', creatorCookie)
    .attach('avatar', big, { filename: 'big.png', contentType: 'image/png' });

  assert.equal(res.status, 413);
});

test('POST /api/profile/avatar rejects unauthenticated requests', async () => {
  const res = await request(app)
    .post('/api/profile/avatar')
    .attach('avatar', tinyPng(), { filename: 'avatar.png', contentType: 'image/png' });

  assert.equal(res.status, 401);
});

test('DELETE /api/profile/avatar clears the avatar and removes the file from disk', async () => {
  const upload = await request(app)
    .post('/api/profile/avatar')
    .set('Cookie', creatorCookie)
    .attach('avatar', tinyPng(), { filename: 'avatar.png', contentType: 'image/png' });
  const filePath = path.join(AVATAR_DIR, path.basename(upload.body.data.avatar_url));
  assert.equal(fs.existsSync(filePath), true);

  const res = await request(app).delete('/api/profile/avatar').set('Cookie', creatorCookie);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.avatar_url, '');

  const user = await prisma.user.findUniqueOrThrow({ where: { id: creatorUserId } });
  assert.equal(user.avatarUrl, null);

  await new Promise((resolve) => setTimeout(resolve, 50)); // fs.unlink in the route is fire-and-forget
  assert.equal(fs.existsSync(filePath), false);
});

test('DELETE /api/profile/account requires the correct password and soft-deletes on success (previously 404)', async () => {
  const passwordHash = await bcrypt.hash('DeleteMe@123', 10);
  const user = await prisma.user.create({
    data: { email: `delete-test-${Date.now()}@example.com`, passwordHash, name: 'Delete Me', role: 'CREATOR' },
  });
  const cookie = authCookie(user.id, 'creator');

  const wrongPassword = await request(app).delete('/api/profile/account').set('Cookie', cookie).send({ password: 'wrong' });
  assert.equal(wrongPassword.status, 401);
  let stillActive = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  assert.equal(stillActive.isActive, true);

  const res = await request(app).delete('/api/profile/account').set('Cookie', cookie).send({ password: 'DeleteMe@123' });
  assert.equal(res.status, 200);

  const deleted = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  assert.equal(deleted.isActive, false);
  assert.notEqual(deleted.deletedAt, null);

  // Login must now reject the soft-deleted account.
  const loginAttempt = await request(app).post('/api/auth/login').send({ email: user.email, password: 'DeleteMe@123' });
  assert.equal(loginAttempt.status, 403);
});
