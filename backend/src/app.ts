import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import { AVATAR_DIR } from './services/avatarStorage';

import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import campaignRoutes from './routes/campaigns';
import bidRoutes from './routes/bids';
import messageRoutes from './routes/messages';
import paymentRoutes from './routes/payments';
import walletRoutes from './routes/wallet';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';
import configRoutes from './routes/config';
import stubRoutes from './routes/stubs';
import contactRoutes from './routes/contact';
import collaborationRoutes from './routes/collaborations';

const app = express();
const ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3080';

// Railway terminates TLS and proxies requests through its own edge, so
// req.ip/req.secure only reflect the real client when Express is told to
// trust the X-Forwarded-* headers from that one hop. Required for the
// auth rate limiters (routes/auth.ts) to key on real client IPs instead
// of Railway's proxy IP.
app.set('trust proxy', 1);

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ success: true, status: 'ok' }));

// Uploaded avatars live outside /api since they're plain static files, not
// API responses — matches what the frontend's getAvatarUrl() already
// expects (an "uploads are served from backend root" relative path).
app.use('/uploads/avatars', express.static(AVATAR_DIR));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/conversations', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/config', configRoutes);
app.use('/api', stubRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/collaborations', collaborationRoutes);

// Google OAuth and other third-party integrations are not configured for
// local dev. Returning a clear 501 here is honest; faking a redirect would not be.
app.post('/api/google/auth-url', (req, res) => {
  res.status(501).json({ success: false, message: 'Google sign-in requires GOOGLE_CLIENT_ID/SECRET. Not available in local dev.', code: 'NOT_CONFIGURED' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `No route for ${req.method} ${req.path}` });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

export default app;
