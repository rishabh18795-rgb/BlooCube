import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Campaign } from '@/types/campaign';

// This page previously had two confirmed, demonstrated bugs:
//   1. ?campaign=<id> (used by "View Details"/"Apply Now"/"Place Bid" links
//      everywhere else in the app) was never read, so deep links always
//      landed on the generic campaign list instead of opening the intended
//      campaign's bid drawer.
//   2. The "Submit Bid" button fired the real API submission immediately,
//      *before* the "Are you sure?" confirmation dialog appeared - so
//      clicking Cancel on that dialog never actually canceled anything.
// These tests cover both fixes directly, plus the drawer open/close and a
// failed-submission path, by mocking every data dependency and driving the
// real component through React Testing Library - not just asserting on
// the underlying hooks/helpers in isolation.

const mockCampaign: Campaign = {
  _id: 'campaign-1',
  title: 'Test Campaign One',
  description: 'A campaign used for marketplace page tests.',
  budget: 15000,
  deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
  status: 'active',
  isPublic: true,
  requirements: { platforms: ['instagram'] },
  payment: { type: 'performance', amount: 15000, currency: 'INR' },
};

const searchParamsStore = { campaign: '' as string | null };

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'campaign' ? searchParamsStore.campaign : null),
  }),
}));

vi.mock('@/Components/Creater/CreatorLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/lib/cookieAuth', () => ({
  cookieAuthUtils: {
    getUser: () => ({ role: 'creator' }),
  },
}));

const useCampaignsMock = vi.fn();
const getCampaignMock = vi.fn();
vi.mock('@/hooks/useCampaigns', () => ({
  useCampaigns: (...args: unknown[]) => useCampaignsMock(...args),
  getCampaign: (...args: unknown[]) => getCampaignMock(...args),
}));

const useBidsMock = vi.fn();
const createBidApiMock = vi.fn();
vi.mock('@/hooks/useBids', () => ({
  useBids: (...args: unknown[]) => useBidsMock(...args),
  createBidApi: (...args: unknown[]) => createBidApiMock(...args),
}));

import CreatorMarketplacePage from '../page';

function setCampaigns(campaigns: Campaign[], loading = false) {
  useCampaignsMock.mockReturnValue({
    data: campaigns,
    loading,
    error: null,
    params: {},
    setParams: vi.fn(),
    refetch: vi.fn(),
  });
}

function setBids(bids: Array<{ _id: string; campaign_id: string; status: string }> = []) {
  useBidsMock.mockReturnValue({
    data: bids,
    loading: false,
    refetch: vi.fn(),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  searchParamsStore.campaign = null;
  setCampaigns([mockCampaign]);
  setBids([]);
});

describe('campaign deep-link handling', () => {
  test('opens the bid drawer for the campaign in ?campaign= when it is already in the loaded list', async () => {
    searchParamsStore.campaign = 'campaign-1';
    render(<CreatorMarketplacePage />);

    expect(await screen.findByText('Place Your Bid')).toBeInTheDocument();
    // Appears twice once the drawer is open: once on the campaign card
    // behind it, once in the drawer's own campaign summary.
    expect(screen.getAllByText('Test Campaign One')).toHaveLength(2);
  });

  test('falls back to fetching the campaign directly when it is not in the loaded list', async () => {
    searchParamsStore.campaign = 'campaign-not-in-list';
    const fetchedCampaign: Campaign = { ...mockCampaign, _id: 'campaign-not-in-list', title: 'Fetched Separately' };
    getCampaignMock.mockResolvedValue(fetchedCampaign);

    render(<CreatorMarketplacePage />);

    expect(await screen.findByText('Fetched Separately')).toBeInTheDocument();
    expect(getCampaignMock).toHaveBeenCalledWith('campaign-not-in-list');
  });

  test('shows an error message, not a blank screen, when the deep-linked campaign cannot be found', async () => {
    searchParamsStore.campaign = 'nonexistent-id';
    getCampaignMock.mockRejectedValue(new Error('Not found'));

    render(<CreatorMarketplacePage />);

    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument();
    expect(screen.queryByText('Place Your Bid')).not.toBeInTheDocument();
  });

  test('does not reopen the drawer after it has already been closed once', async () => {
    searchParamsStore.campaign = 'campaign-1';
    const user = userEvent.setup();
    render(<CreatorMarketplacePage />);

    await screen.findByText('Place Your Bid');
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    // Give the close animation's setTimeout and any re-render a chance to
    // run, then confirm the drawer is still gone - the original bug
    // reopened it immediately because the query string is never cleared.
    await new Promise((r) => setTimeout(r, 400));
    expect(screen.queryByText('Place Your Bid')).not.toBeInTheDocument();
  });

  test('without a campaign param, no drawer opens and the campaign list renders normally', () => {
    render(<CreatorMarketplacePage />);
    expect(screen.queryByText('Place Your Bid')).not.toBeInTheDocument();
    expect(screen.getByText('Test Campaign One')).toBeInTheDocument();
  });
});

describe('bid drawer open/close and submit confirmation', () => {
  async function openDrawerAndFillForm() {
    const user = userEvent.setup();
    render(<CreatorMarketplacePage />);

    await user.click(screen.getByRole('button', { name: /place bid/i }));
    await screen.findByText('Place Your Bid');

    await user.type(screen.getByPlaceholderText(/describe your approach/i), 'A sufficiently detailed proposal.');
    await user.type(screen.getByPlaceholderText('0'), '5000');
    return user;
  }

  test('opening the drawer via the card button does not submit a bid', async () => {
    const user = userEvent.setup();
    render(<CreatorMarketplacePage />);
    await user.click(screen.getByRole('button', { name: /place bid/i }));
    await screen.findByText('Place Your Bid');
    expect(createBidApiMock).not.toHaveBeenCalled();
  });

  test('clicking "Submit Bid" shows the confirmation dialog and does NOT call the API yet (the original bug)', async () => {
    const user = await openDrawerAndFillForm();
    await user.click(screen.getByRole('button', { name: 'Submit Bid' }));

    expect(await screen.findByText('Confirm Bid Submission')).toBeInTheDocument();
    expect(createBidApiMock).not.toHaveBeenCalled();
  });

  test('clicking "Yes, Submit" in the confirmation dialog submits exactly once', async () => {
    createBidApiMock.mockResolvedValue({ _id: 'bid-1', status: 'pending' });
    const user = await openDrawerAndFillForm();
    await user.click(screen.getByRole('button', { name: 'Submit Bid' }));
    await screen.findByText('Confirm Bid Submission');

    await user.click(screen.getByRole('button', { name: 'Yes, Submit' }));

    await waitFor(() => expect(createBidApiMock).toHaveBeenCalledTimes(1));
    expect(createBidApiMock).toHaveBeenCalledWith(
      expect.objectContaining({ campaign_id: 'campaign-1', proposal_text: 'A sufficiently detailed proposal.', bid_amount: 5000 })
    );
  });

  test('clicking "Cancel" on the confirmation dialog submits nothing and returns to the editable drawer', async () => {
    const user = await openDrawerAndFillForm();
    await user.click(screen.getByRole('button', { name: 'Submit Bid' }));
    const confirmationHeading = await screen.findByText('Confirm Bid Submission');
    // The underlying drawer stays mounted (just visually hidden) behind the
    // confirmation dialog, so it has its own "Cancel" button too - scope to
    // the dialog specifically rather than getting an ambiguous match.
    const dialog = confirmationHeading.closest('div')!.parentElement!;

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(createBidApiMock).not.toHaveBeenCalled();
    // Back on the editable drawer, not left with nothing visible.
    expect(await screen.findByText('Place Your Bid')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/describe your approach/i)).toHaveValue('A sufficiently detailed proposal.');
  });

  test('a failed submission (e.g. duplicate bid) shows an error and does not show a false success message', async () => {
    createBidApiMock.mockRejectedValue(new Error('You have already applied to this campaign'));
    const user = await openDrawerAndFillForm();
    await user.click(screen.getByRole('button', { name: 'Submit Bid' }));
    await screen.findByText('Confirm Bid Submission');
    await user.click(screen.getByRole('button', { name: 'Yes, Submit' }));

    expect(await screen.findByText('You have already applied to this campaign')).toBeInTheDocument();
    expect(screen.queryByText(/submitted successfully/i)).not.toBeInTheDocument();
  });
});
