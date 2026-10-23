import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db';
import { NotificationService } from '../notificationService';

// Notifications previously had nowhere to navigate to when clicked (the
// frontend expected a per-notification "actions"/"url" the backend never
// populated). This covers the new `link` field end to end: the service
// persists it, and it survives a round trip through the DB unchanged.

let userId: string;

before(async () => {
  const passwordHash = await bcrypt.hash('Test@12345', 10);
  const user = await prisma.user.create({
    data: { email: `notif-link-test-${Date.now()}@example.com`, passwordHash, name: 'Notif Link Test', role: 'CREATOR' },
  });
  userId = user.id;
});

test('NotificationService.send persists the link field when provided', async () => {
  const n = await NotificationService.send(userId, 'APPLICATION_ACCEPTED', 'Application accepted!', 'Your bid was accepted.', '/creator/bids');
  assert.equal(n.link, '/creator/bids');

  const fetched = await prisma.notification.findUniqueOrThrow({ where: { id: n.id } });
  assert.equal(fetched.link, '/creator/bids');
});

test('NotificationService.send leaves link null when omitted (backward compatible)', async () => {
  const n = await NotificationService.send(userId, 'NEW_MESSAGE', 'New message', 'hello');
  assert.equal(n.link, null);
});
