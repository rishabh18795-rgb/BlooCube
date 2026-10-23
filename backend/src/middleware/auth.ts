import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { fail } from '../utils/responses';
import { prisma } from '../db';

export type AuthedRequest = Request & { userId?: string; userRole?: string };

// A valid JWT signature only proves the token was issued by us and hasn't
// expired — it says nothing about whether the account behind it is still
// active right now. Without this lookup, deleting or suspending an
// account doesn't take effect until that account's current access token
// naturally expires (ACCESS_TOKEN_TTL, 15 minutes by default): deleting
// your own account, or an admin suspending someone, would otherwise leave
// an already-issued token fully usable for the rest of that window. This
// single indexed primary-key lookup closes that gap for every protected
// route at once, at the cost of one extra query per authenticated request.
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.access_token;
  if (!token) return fail(res, 'Authentication required', 401);
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return fail(res, 'Authentication required', 401);
  }

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { isActive: true, deletedAt: true },
    });
  } catch {
    // Fail closed: a DB error here must not be treated as "authenticated".
    return fail(res, 'Authentication required', 401);
  }
  if (!user || !user.isActive || user.deletedAt) {
    return fail(res, 'Authentication required', 401);
  }

  req.userId = payload.sub;
  req.userRole = payload.role;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return fail(res, 'Forbidden', 403);
    }
    next();
  };
}
