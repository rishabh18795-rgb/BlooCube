import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { prisma } from '../db';
import { ok, fail } from '../utils/responses';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { csv } from '../utils/mappers';
import { clearAuthCookies } from '../utils/cookies';
import { AVATAR_DIR, AVATAR_URL_PREFIX, ALLOWED_AVATAR_MIME_TO_EXT, deleteAvatarFile } from '../services/avatarStorage';
import crypto from 'crypto';

const router = Router();

async function buildUserProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { creatorProfile: true, brandProfile: true } });
  if (!user) return null;

  const base = {
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.toLowerCase(),
    isActive: user.isActive,
    isVerified: user.isVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };

  const commonProfile = {
    phone: user.phone || '',
    address: user.address || '',
    gender: 'prefer_not_to_say' as const,
    language: 'en',
    timezone: 'Asia/Kolkata',
    preferences: {
      emailNotifications: user.emailNotifications,
      pushNotifications: user.pushNotifications,
      smsNotifications: user.smsNotifications,
      marketingEmails: user.marketingEmails,
      profileVisibility: 'public' as const,
    },
  };

  if (user.creatorProfile) {
    const cp = user.creatorProfile;
    return {
      ...base,
      profile: {
        ...commonProfile,
        bio: cp.bio || '',
        avatar_url: user.avatarUrl || '',
        location: cp.location || '',
        website: '',
        social_links: {},
      },
      creator: {
        id: cp.id,
        niches: csv(cp.niches),
        platforms: csv(cp.platforms),
        followers: cp.followers,
        engagementRate: cp.engagementRate,
        avgReach: cp.avgReach,
        startingPrice: cp.startingPrice,
        portfolio: cp.portfolio ? JSON.parse(cp.portfolio) : [],
        availability: cp.availability,
        verified: cp.verified,
      },
    };
  }

  if (user.brandProfile) {
    const bp = user.brandProfile;
    return {
      ...base,
      profile: {
        ...commonProfile,
        bio: bp.description || '',
        avatar_url: user.avatarUrl || bp.logoUrl || '',
        location: bp.location || '',
        website: bp.website || '',
        social_links: { instagram: bp.instagram || undefined, youtube: bp.youtube || undefined },
      },
      brand: {
        id: bp.id,
        companyName: bp.companyName,
        logoUrl: bp.logoUrl,
        website: bp.website,
        industry: bp.industry,
        location: bp.location,
        description: bp.description,
        instagram: bp.instagram,
        youtube: bp.youtube,
        verified: bp.verified,
      },
    };
  }

  return { ...base, profile: { ...commonProfile, bio: '', avatar_url: user.avatarUrl || '', location: '', website: '', social_links: {} } };
}

router.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const profile = await buildUserProfile(req.userId!);
  if (!profile) return fail(res, 'User not found', 404);
  return ok(res, { user: profile });
});

async function applyProfileUpdate(userId: string, body: Record<string, unknown>) {
  const { name, profile } = (body || {}) as { name?: string; profile?: Record<string, unknown> };
  const userData: Record<string, unknown> = {};
  if (typeof name === 'string' && name.trim()) userData.name = name.trim();
  if (profile && typeof profile.phone === 'string') userData.phone = profile.phone;
  if (profile && typeof profile.address === 'string') userData.address = profile.address;
  const preferences = profile?.preferences as Record<string, unknown> | undefined;
  if (preferences) {
    if (typeof preferences.emailNotifications === 'boolean') userData.emailNotifications = preferences.emailNotifications;
    if (typeof preferences.pushNotifications === 'boolean') userData.pushNotifications = preferences.pushNotifications;
    if (typeof preferences.smsNotifications === 'boolean') userData.smsNotifications = preferences.smsNotifications;
    if (typeof preferences.marketingEmails === 'boolean') userData.marketingEmails = preferences.marketingEmails;
  }
  if (Object.keys(userData).length) await prisma.user.update({ where: { id: userId }, data: userData });

  if (profile) {
    const socialLinks = profile.social_links as Record<string, unknown> | undefined;
    const creator = await prisma.creatorProfile.findUnique({ where: { userId } });
    if (creator) {
      await prisma.creatorProfile.update({
        where: { userId },
        data: {
          bio: (profile.bio as string) ?? undefined,
          location: (profile.location as string) ?? undefined,
        },
      });
    }
    const brand = await prisma.brandProfile.findUnique({ where: { userId } });
    if (brand) {
      await prisma.brandProfile.update({
        where: { userId },
        data: {
          description: (profile.bio as string) ?? undefined,
          location: (profile.location as string) ?? undefined,
          website: (profile.website as string) ?? undefined,
          instagram: (socialLinks?.instagram as string) ?? undefined,
          youtube: (socialLinks?.youtube as string) ?? undefined,
        },
      });
    }
  }

  return buildUserProfile(userId);
}

// Frontend calls PUT /me; /account is kept as an alias for any existing callers.
router.put(['/me', '/account'], requireAuth, async (req: AuthedRequest, res) => {
  const updated = await applyProfileUpdate(req.userId!, req.body);
  if (!updated) return fail(res, 'User not found', 404);
  return ok(res, { user: updated });
});

// Creator-specific onboarding fields (niches, platforms, followers, pricing, portfolio)
router.put('/creator', requireAuth, async (req: AuthedRequest, res) => {
  const cp = await prisma.creatorProfile.findUnique({ where: { userId: req.userId! } });
  if (!cp) return fail(res, 'Not a creator account', 403);
  const b = req.body || {};

  const updated = await prisma.creatorProfile.update({
    where: { userId: req.userId! },
    data: {
      bio: b.bio ?? undefined,
      location: b.location ?? undefined,
      niches: Array.isArray(b.niches) ? b.niches.join(',') : undefined,
      platforms: Array.isArray(b.platforms) ? b.platforms.join(',') : undefined,
      followers: b.followers !== undefined ? Number(b.followers) : undefined,
      engagementRate: b.engagementRate !== undefined ? Number(b.engagementRate) : undefined,
      avgReach: b.avgReach !== undefined ? Number(b.avgReach) : undefined,
      startingPrice: b.startingPrice !== undefined ? Number(b.startingPrice) : undefined,
      portfolio: Array.isArray(b.portfolio) ? JSON.stringify(b.portfolio) : undefined,
      availability: b.availability ?? undefined,
    },
  });
  return ok(res, { creator: updated });
});

router.put('/brand', requireAuth, async (req: AuthedRequest, res) => {
  const bp = await prisma.brandProfile.findUnique({ where: { userId: req.userId! } });
  if (!bp) return fail(res, 'Not a brand account', 403);
  const b = req.body || {};

  const updated = await prisma.brandProfile.update({
    where: { userId: req.userId! },
    data: {
      companyName: b.companyName ?? undefined,
      website: b.website ?? undefined,
      industry: b.industry ?? undefined,
      location: b.location ?? undefined,
      description: b.description ?? undefined,
      instagram: b.instagram ?? undefined,
      youtube: b.youtube ?? undefined,
    },
  });
  return ok(res, { brand: updated });
});

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
    filename: (req, file, cb) => {
      const ext = ALLOWED_AVATAR_MIME_TO_EXT[file.mimetype];
      const userId = (req as AuthedRequest).userId;
      cb(null, `${userId}-${crypto.randomBytes(8).toString('hex')}.${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_AVATAR_MIME_TO_EXT[file.mimetype]) {
      return cb(new Error('UNSUPPORTED_FILE_TYPE'));
    }
    cb(null, true);
  },
});

function handleAvatarUpload(req: AuthedRequest, res: import('express').Response, next: import('express').NextFunction) {
  avatarUpload.single('avatar')(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return fail(res, 'Image must be 5MB or smaller', 413);
    }
    if (err instanceof Error && err.message === 'UNSUPPORTED_FILE_TYPE') {
      return fail(res, 'Only JPG, PNG, or GIF images are allowed', 415);
    }
    return fail(res, 'Upload failed', 400);
  });
}

// Authorization: only req.userId from the authenticated session is ever
// used to decide whose avatar is written — no client-supplied user id is
// accepted anywhere in this route, so a user cannot touch another
// account's avatar by editing request parameters.
router.post('/avatar', requireAuth, handleAvatarUpload, async (req: AuthedRequest, res) => {
  if (!req.file) return fail(res, 'No image file provided', 422);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  const avatarUrl = `${AVATAR_URL_PREFIX}${req.file.filename}`;

  deleteAvatarFile(user.avatarUrl);
  await prisma.user.update({ where: { id: req.userId! }, data: { avatarUrl } });

  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.userId! } });
  if (brand) {
    await prisma.brandProfile.update({ where: { userId: req.userId! }, data: { logoUrl: avatarUrl } });
  }

  return ok(res, { avatar_url: avatarUrl });
});

router.delete('/avatar', requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  deleteAvatarFile(user.avatarUrl);
  await prisma.user.update({ where: { id: req.userId! }, data: { avatarUrl: null } });

  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.userId! } });
  if (brand) {
    await prisma.brandProfile.update({ where: { userId: req.userId! }, data: { logoUrl: null } });
  }

  return ok(res, { avatar_url: '' });
});

router.delete('/account', requireAuth, async (req: AuthedRequest, res) => {
  const { password } = (req.body || {}) as { password?: string };
  if (!password) return fail(res, 'Password is required to delete your account', 422);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return fail(res, 'Incorrect password', 401);

  await prisma.user.update({ where: { id: user.id }, data: { isActive: false, deletedAt: new Date() } });
  clearAuthCookies(res);
  return ok(res, { deleted: true });
});

router.put('/change-password', requireAuth, async (req: AuthedRequest, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || String(newPassword).length < 6) return fail(res, 'Invalid password input', 422);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return fail(res, 'Current password is incorrect', 401);

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return ok(res, { changed: true });
});

router.get('/stats', requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  const ageDays = Math.floor((Date.now() - user.createdAt.getTime()) / 86400000);
  return ok(res, { connectedAccounts: 0, accountAge: ageDays, isVerified: user.isVerified, profileCompleteness: 70 });
});

// GET /api/profile/creators — public creator directory (used by "Explore creators")
router.get('/creators', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const where: Record<string, unknown> = {};
  if (req.query.niche) where.niches = { contains: String(req.query.niche) };
  if (req.query.location) where.location = { contains: String(req.query.location) };
  if (req.query.platform) where.platforms = { contains: String(req.query.platform) };
  if (req.query.minFollowers) where.followers = { gte: Number(req.query.minFollowers) };

  const [creators, total] = await Promise.all([
    prisma.creatorProfile.findMany({ where, include: { user: true }, orderBy: { followers: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.creatorProfile.count({ where }),
  ]);

  return ok(res, {
    creators: creators.map((c) => ({
      _id: c.id,
      name: c.user.name,
      avatarUrl: c.user.avatarUrl || null,
      verified: c.verified,
      niches: csv(c.niches),
      location: c.location,
      followers: c.followers,
      engagementRate: c.engagementRate,
      startingPrice: c.startingPrice,
      platforms: csv(c.platforms),
    })),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});

export default router;
