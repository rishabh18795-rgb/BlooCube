import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db';
import { PaymentService } from '../paymentService';

// Integration tests against the real local dev SQLite DB (never the
// production Railway volume) — builds a full brand/creator/campaign/
// application/collaboration fixture chain since release/refund logic reads
// through that whole relation to find the creator's wallet.

let brandUserId: string;
let creatorUserId: string;
let brandProfileId: string;
let creatorProfileId: string;
const createdCampaignIds: string[] = [];

// One campaign per call (campaignId+creatorId is unique on
// CampaignApplication, so each test needs its own campaign to apply to —
// a fresh application row rather than colliding with a previous test's).
async function createCollaborationWithPayment(status: 'INITIATED' | 'IN_ESCROW' = 'IN_ESCROW') {
  const campaign = await prisma.campaign.create({
    data: {
      brandId: brandProfileId,
      title: 'Payment Test Campaign',
      objective: 'test',
      description: 'test',
      deliverables: '{}',
      platforms: 'instagram',
      categories: 'tech',
      applicationDeadline: new Date(Date.now() + 86400000),
    },
  });
  createdCampaignIds.push(campaign.id);

  const application = await prisma.campaignApplication.create({
    data: {
      campaignId: campaign.id,
      creatorId: creatorProfileId,
      bidAmount: 10000,
      proposal: 'Test proposal for payment service regression test',
      deliveryDays: 7,
      status: 'ACCEPTED',
    },
  });
  const collaboration = await prisma.collaboration.create({
    data: { campaignId: campaign.id, applicationId: application.id, amount: 10000 },
  });
  const payment = await prisma.payment.create({
    data: { collaborationId: collaboration.id, amount: 10000, platformFee: 1000, status, providerRef: `test_${collaboration.id}` },
  });
  return { application, collaboration, payment };
}

before(async () => {
  const suffix = Date.now();
  const brandUser = await prisma.user.create({
    data: { email: `paymenttest-brand+${suffix}@example.invalid`, passwordHash: await bcrypt.hash('x', 10), name: 'Test Brand', role: 'BRAND' },
  });
  const creatorUser = await prisma.user.create({
    data: { email: `paymenttest-creator+${suffix}@example.invalid`, passwordHash: await bcrypt.hash('x', 10), name: 'Test Creator', role: 'CREATOR' },
  });
  brandUserId = brandUser.id;
  creatorUserId = creatorUser.id;

  const brandProfile = await prisma.brandProfile.create({ data: { userId: brandUserId, companyName: 'Test Co' } });
  const creatorProfile = await prisma.creatorProfile.create({ data: { userId: creatorUserId, niches: 'tech', platforms: 'instagram' } });
  brandProfileId = brandProfile.id;
  creatorProfileId = creatorProfile.id;
});

after(async () => {
  await prisma.walletTransaction.deleteMany({ where: { wallet: { userId: creatorUserId } } });
  await prisma.payment.deleteMany({ where: { collaboration: { campaignId: { in: createdCampaignIds } } } });
  await prisma.collaboration.deleteMany({ where: { campaignId: { in: createdCampaignIds } } });
  await prisma.campaignApplication.deleteMany({ where: { campaignId: { in: createdCampaignIds } } });
  await prisma.campaign.deleteMany({ where: { id: { in: createdCampaignIds } } });
  await prisma.wallet.deleteMany({ where: { userId: creatorUserId } });
  await prisma.creatorProfile.delete({ where: { id: creatorProfileId } });
  await prisma.brandProfile.delete({ where: { id: brandProfileId } });
  await prisma.user.delete({ where: { id: creatorUserId } });
  await prisma.user.delete({ where: { id: brandUserId } });
  await prisma.$disconnect();
});

test('releasing an escrowed payment credits the wallet exactly once', async () => {
  const { payment } = await createCollaborationWithPayment('IN_ESCROW');
  const result = await PaymentService.releasePayment(payment.id);
  assert.ok(result, 'release should succeed for an IN_ESCROW payment');
  assert.equal(result!.status, 'RELEASED');

  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: creatorUserId } });
  assert.equal(wallet.availableBalance, 9000, 'net amount (10000 - 1000 fee) should be credited');
  assert.equal(wallet.totalEarnings, 9000);
});

test('releasing the same payment twice only credits the wallet once (no double-release)', async () => {
  const { payment } = await createCollaborationWithPayment('IN_ESCROW');
  const walletBefore = await prisma.wallet.findUnique({ where: { userId: creatorUserId } });
  const startingBalance = walletBefore?.availableBalance ?? 0;

  const firstRelease = await PaymentService.releasePayment(payment.id);
  assert.ok(firstRelease, 'first release should succeed');

  const secondRelease = await PaymentService.releasePayment(payment.id);
  assert.equal(secondRelease, null, 'second release attempt on an already-RELEASED payment must be rejected');

  const walletAfter = await prisma.wallet.findUniqueOrThrow({ where: { userId: creatorUserId } });
  assert.equal(walletAfter.availableBalance, startingBalance + 9000, 'balance must reflect exactly one credit, not two');
});

test('releasing a payment that was never escrowed (still INITIATED) is rejected, not silently applied', async () => {
  const { payment } = await createCollaborationWithPayment('INITIATED');
  const result = await PaymentService.releasePayment(payment.id);
  assert.equal(result, null, 'a payment that was never escrowed must not be releasable');
});
