import { prisma } from '../db';
import { NotificationType } from '@prisma/client';

/**
 * Notification abstraction. Local dev uses a console provider; swap in a
 * real email/push provider in production behind this same interface.
 */
export const NotificationService = {
  // `link` is a frontend route (e.g. "/creator/bids") the notification
  // should navigate to when clicked. Optional, since not every
  // notification has an obvious destination yet.
  async send(userId: string, type: NotificationType, title: string, body: string, link?: string) {
    const n = await prisma.notification.create({ data: { userId, type, title, body, link } });
    console.log(`[notify] -> user:${userId} [${type}] ${title}`);
    return n;
  },
};
