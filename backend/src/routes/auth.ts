import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db';
import { ok, fail } from '../utils/responses';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { setAuthCookies, clearAuthCookies } from '../utils/cookies';
import { requireAuth, AuthedRequest } from '../middleware/auth';

const RESET_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3080';

const router = Router();

// Brute-force / credential-stuffing protection on the sensitive auth
// endpoints. Keyed by IP via req.ip — correct real client IPs behind
// Railway's reverse proxy require app.set('trust proxy', ...) in index.ts.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again in a few minutes.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many signup attempts from this network. Please try again later.' },
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset requests. Please try again in a few minutes.' },
});

function publicUser(u: { id: string; name: string; email: string; role: string; isActive: boolean; isVerified: boolean; avatarUrl: string | null }) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role.toLowerCase(),
    isActive: u.isActive,
    isVerified: u.isVerified,
    avatarUrl: u.avatarUrl,
    lastLogin: new Date().toISOString(),
  };
}

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['creator', 'brand']),
});

router.post('/register', registerLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.issues[0]?.message || 'Invalid input', 422);
  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return fail(res, 'Email already exists', 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role === 'brand' ? 'BRAND' : 'CREATOR',
      ...(role === 'creator'
        ? { creatorProfile: { create: { niches: '', platforms: '' } } }
        : { brandProfile: { create: { companyName: name } } }),
      wallet: role === 'creator' ? { create: {} } : undefined,
    },
  });

  // No real email/SMS provider is configured in local dev, so we skip OTP
  // verification rather than fake a delivered code (see NotificationService).
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
  setAuthCookies(res, accessToken, refreshToken, publicUser(user));

  return ok(res, { requiresOTP: false, user: publicUser(user) }, 201);
});

router.get('/check-email', async (req, res) => {
  const email = String(req.query.email || '');
  if (!email) return fail(res, 'email is required', 422);
  const existing = await prisma.user.findUnique({ where: { email } });
  return ok(res, { exists: !!existing });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post('/login', loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, 'Email and password are required', 422);
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return fail(res, 'Invalid email or password', 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return fail(res, 'Invalid email or password', 401);
  if (!user.isActive) return fail(res, 'This account has been deactivated', 403);

  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
  setAuthCookies(res, accessToken, refreshToken, publicUser(user));

  return ok(res, { user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  clearAuthCookies(res);
  return ok(res, { loggedOut: true });
});

router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return fail(res, 'No refresh token', 401);
  try {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) return fail(res, 'Invalid session', 401);

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const newRefreshToken = signRefreshToken({ sub: user.id, role: user.role });
    setAuthCookies(res, accessToken, newRefreshToken, publicUser(user));
    return ok(res, { user: publicUser(user) });
  } catch {
    return fail(res, 'Invalid or expired refresh token', 401);
  }
});

router.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return fail(res, 'User not found', 404);
  return ok(res, { user: publicUser(user) });
});

// No email provider is configured in local dev. Rather than silently fail
// or fake a "sent" email, we log the reset link to the backend console —
// same honesty rule as skipping OTP on register (see NotificationService).
router.post('/request-password-reset', passwordResetLimiter, async (req, res) => {
  const { email } = req.body || {};
  if (!email) return fail(res, 'Email is required', 422);

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return the same generic success message whether or not the
  // account exists, to avoid leaking which emails are registered.
  if (user) {
    const resetToken = jwt.sign({ sub: user.id, purpose: 'password_reset' }, RESET_SECRET, { expiresIn: '30m' });
    const resetUrl = `${FRONTEND_ORIGIN}/reset-password/${resetToken}`;
    console.log(`[password-reset] No email provider configured — reset link for ${email}:\n  ${resetUrl}`);
  }
  return ok(res, { message: 'If an account exists, a reset link has been sent to your email.' });
});

router.post('/reset-password/:token', passwordResetLimiter, async (req, res) => {
  const { newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 6) return fail(res, 'Password must be at least 6 characters', 422);

  let payload: { sub: string; purpose: string };
  try {
    payload = jwt.verify(req.params.token, RESET_SECRET) as typeof payload;
  } catch {
    return fail(res, 'This reset link is invalid or has expired', 400);
  }
  if (payload.purpose !== 'password_reset') return fail(res, 'Invalid reset token', 400);

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: payload.sub }, data: { passwordHash } });
  return ok(res, { redirectTo: 'login' });
});

export default router;
