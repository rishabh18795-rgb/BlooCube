import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db';
import { signAccessToken } from '../../utils/jwt';
import app from '../../app';

// POST /api/bids had no dedicated test coverage at all before this -
// including its duplicate-application rejection, which the frontend fix in
// this pass (the marketplace drawer's confirm/cancel flow) depends on
// behaving correctly: a user clicking "Submit Bid" twice, or the
// confirmation dialog firing twice, must not create two applications.

let brandUserId: string;
let brandProfileId: string;
let creatorCookie: string;

async function createActiveCampaign(overrides: Partial<{ applicationDeadline: Date; status: 'ACTIVE' | 'DRAFT' | 'CLOSED' }> = {}) {
  const campaign = await prisma.campaign.create({
    data: {
      brandId: brandProfileId,
      title: 'Bids Test Campaign',
      objective: 'test',
      description: 'test',
      deliverables: '{}',
      platforms: 'instagram',
      categories: 'tech',
      status: overrides.status ?? 'ACTIVE',
      applicationDeadline: overrides.applicationDeadline ?? new Date(Date.now() + 86400000),
    },
  });
  return campaign;
}

before(async () => {
  const suffix = Date.now();
  const passwordHash = await bcrypt.hash('Test@12345', 10);

  const brandUser = await prisma.user.create({
    data: { email: `bidstest-brand+${suffix}@example.invalid`, passwordHash, name: 'Bids Test Brand', role: 'BRAND' },
  });
  brandUserId = brandUser.id;
  const brandProfile = await prisma.brandProfile.create({ data: { userId: brandUserId, companyName: 'Bids Test Co' } });
  brandProfileId = brandProfile.id;

  const creatorUser = await prisma.user.create({
    data: {
      email: `bidstest-creator+${suffix}@example.invalid`,
      passwordHash,
      name: 'Bids Test Creator',
      role: 'CREATOR',
      creatorProfile: { create: { niches: 'tech', platforms: 'instagram' } },
    },
  });
  // requireRole() checks the raw Prisma enum value ('CREATOR'), not the
  // lowercased 'creator' the login route only uses for the public-facing
  // user JSON - signing it lowercase here would make every requireRole()
  // check 403 regardless of whether the route logic itself is correct.
  creatorCookie = `access_token=${signAccessToken({ sub: creatorUser.id, role: 'CREATOR' })}`;
});

test('POST /api/bids creates a bid for a valid, active, not-yet-applied campaign', async () => {
  const campaign = await createActiveCampaign();
  const res = await request(app)
    .post('/api/bids')
    .set('Cookie', creatorCookie)
    .send({ campaign_id: campaign.id, proposal_text: 'A detailed proposal for this campaign.', bid_amount: 5000 });

  assert.equal(res.status, 201);
  assert.equal(res.body.data.bid.status, 'pending');
  assert.equal(res.body.data.bid.bid_amount, 5000);
});

test('POST /api/bids rejects a second application to the same campaign with 409 (prevents duplicate bids)', async () => {
  const campaign = await createActiveCampaign();
  const first = await request(app)
    .post('/api/bids')
    .set('Cookie', creatorCookie)
    .send({ campaign_id: campaign.id, proposal_text: 'First application to this campaign.', bid_amount: 4000 });
  assert.equal(first.status, 201);

  const second = await request(app)
    .post('/api/bids')
    .set('Cookie', creatorCookie)
    .send({ campaign_id: campaign.id, proposal_text: 'A second, different proposal text.', bid_amount: 6000 });
  assert.equal(second.status, 409);
  assert.match(second.body.message, /already applied/i);

  // Confirms the duplicate attempt didn't overwrite or create a second row.
  const applications = await prisma.campaignApplication.findMany({ where: { campaignId: campaign.id } });
  assert.equal(applications.length, 1);
  assert.equal(applications[0].bidAmount, 4000);
});

test('POST /api/bids rejects a proposal shorter than 10 characters (failed submission, not silently accepted)', async () => {
  const campaign = await createActiveCampaign();
  const res = await request(app)
    .post('/api/bids')
    .set('Cookie', creatorCookie)
    .send({ campaign_id: campaign.id, proposal_text: 'short', bid_amount: 5000 });

  assert.equal(res.status, 422);
  const applications = await prisma.campaignApplication.findMany({ where: { campaignId: campaign.id } });
  assert.equal(applications.length, 0);
});

test('POST /api/bids rejects a zero or negative bid amount (failed submission)', async () => {
  const campaign = await createActiveCampaign();
  const res = await request(app)
    .post('/api/bids')
    .set('Cookie', creatorCookie)
    .send({ campaign_id: campaign.id, proposal_text: 'A perfectly valid length proposal.', bid_amount: 0 });

  assert.equal(res.status, 422);
});

test('POST /api/bids rejects applying to a campaign past its deadline', async () => {
  const campaign = await createActiveCampaign({ applicationDeadline: new Date(Date.now() - 86400000) });
  const res = await request(app)
    .post('/api/bids')
    .set('Cookie', creatorCookie)
    .send({ campaign_id: campaign.id, proposal_text: 'Trying to apply after the deadline.', bid_amount: 5000 });

  assert.equal(res.status, 400);
  assert.match(res.body.message, /deadline/i);
});

test('POST /api/bids rejects applying to a campaign that is not ACTIVE', async () => {
  const campaign = await createActiveCampaign({ status: 'DRAFT' });
  const res = await request(app)
    .post('/api/bids')
    .set('Cookie', creatorCookie)
    .send({ campaign_id: campaign.id, proposal_text: 'Trying to apply to a draft campaign.', bid_amount: 5000 });

  assert.equal(res.status, 400);
});

test('POST /api/bids rejects unauthenticated requests', async () => {
  const campaign = await createActiveCampaign();
  const res = await request(app)
    .post('/api/bids')
    .send({ campaign_id: campaign.id, proposal_text: 'No cookie attached to this request.', bid_amount: 5000 });

  assert.equal(res.status, 401);
});
