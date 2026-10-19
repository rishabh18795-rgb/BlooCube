import { prisma } from '../db';

// AuditLog.details is a JSON-encoded string (no schema change needed — the
// model already has a free-text `details` field) holding whatever structured
// context an action needs: typically { target, outcome, ...extra }. Never
// pass secrets, tokens, or password-adjacent values in `extra`.
export async function logAdminAction(
  actorUserId: string,
  action: string,
  details: { target?: string; outcome?: string; [key: string]: unknown } = {}
) {
  await prisma.auditLog.create({
    data: {
      userId: actorUserId,
      action,
      details: JSON.stringify(details),
    },
  });
}
