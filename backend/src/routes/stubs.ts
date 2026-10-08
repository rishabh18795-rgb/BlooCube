import { Router } from 'express';
import { ok, fail } from '../utils/responses';
import { requireAuth } from '../middleware/auth';

/**
 * Social-media management / AI features (post scheduling, engagement sync,
 * competitor analysis, AI scoring) require real third-party integrations
 * (Instagram/YouTube/etc APIs, an AI provider) that are not configured in
 * local dev. Rather than fake successful integrations, these routes return
 * honest empty/zero state so the existing UI renders its real empty states
 * instead of crashing on a 404. See project constraints (section 32).
 */
const router = Router();

router.get('/posts', requireAuth, (req, res) => ok(res, { posts: [], pagination: { page: 1, limit: 20, total: 0, pages: 1 } }));
router.get('/posts/scheduled', requireAuth, (req, res) => ok(res, { posts: [] }));
router.get('/posts/:id', requireAuth, (req, res) => fail(res, 'Post not found', 404));

router.get('/engagement', requireAuth, (req, res) => ok(res, { engagement: [] }));
router.get('/engagement/platforms/support', (req, res) => ok(res, { platforms: [] }));
router.get('/engagement/:platform', requireAuth, (req, res) => ok(res, { engagement: null }));

router.get('/analytics', requireAuth, (req, res) => ok(res, { analytics: [] }));
router.post('/analytics/user/:userId/sync', requireAuth, (req, res) =>
  fail(res, 'Analytics sync requires a connected social account. Not available in local dev.', 501, 'NOT_CONFIGURED')
);

router.get('/competitor/history', requireAuth, (req, res) => ok(res, { analyses: [], pagination: { page: 1, limit: 5, total: 0, pages: 1 } }));
router.get('/competitor/analysis/:id', requireAuth, (req, res) => fail(res, 'Not found', 404));
router.post('/competitor/analyze', requireAuth, (req, res) =>
  fail(res, 'Competitor analysis requires an AI provider to be configured. Not available in local dev.', 501, 'NOT_CONFIGURED')
);
router.post('/competitor/fetch', requireAuth, (req, res) =>
  fail(res, 'Competitor analysis requires an AI provider to be configured. Not available in local dev.', 501, 'NOT_CONFIGURED')
);

router.post('/ai/score', requireAuth, (req, res) =>
  fail(res, 'AI scoring requires an AI provider to be configured. Not available in local dev.', 501, 'NOT_CONFIGURED')
);
router.get('/ai/suggestions', requireAuth, (req, res) => ok(res, { suggestions: [] }));

router.get('/admin/ai-providers/status', requireAuth, (req, res) => ok(res, { providers: [], active: null }));
router.get('/admin/ai-providers/usage-stats', requireAuth, (req, res) => ok(res, { stats: [] }));
router.post('/admin/ai-providers/switch', requireAuth, (req, res) => fail(res, 'No AI providers configured', 501, 'NOT_CONFIGURED'));
router.post('/admin/ai-providers/test', requireAuth, (req, res) => fail(res, 'No AI providers configured', 501, 'NOT_CONFIGURED'));

// Social platform OAuth (Instagram/Facebook/Twitter/LinkedIn/YouTube) is not
// configured. "Not connected" is an honest, real state here — these were
// 404ing instead (no route at all), which the Settings page's "Linked
// Accounts" section degrades gracefully on, but it spammed the console on
// every load. success:true + connected:false matches what these clients
// (src/lib/instagram.ts etc.) already expect from a real backend.
for (const platform of ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube']) {
  router.get(`/${platform}/status`, requireAuth, (req, res) => ok(res, { connected: false }));
}

export default router;
