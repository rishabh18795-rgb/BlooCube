"use client";
import { Suspense, useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCampaigns, getCampaign } from '@/hooks/useCampaigns';
import { useBids, createBidApi } from '@/hooks/useBids';
import type { Campaign } from '@/types/campaign';
import { cookieAuthUtils } from '@/lib/cookieAuth';
import { CheckIcon } from 'lucide-react';

import { Search, Filter, IndianRupee, Calendar, Users, Globe, CheckCircle, Clock, XCircle, Cross, X } from 'lucide-react';
import CreatorLayout from '@/Components/Creater/CreatorLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/Select";
import { ChevronDownIcon } from 'lucide-react';
function CreatorMarketplace() {
  const searchParams = useSearchParams();
  const { data: campaigns, loading, error, params, setParams, refetch } = useCampaigns({ status: 'active', limit: 10 });
  const { data: bids, loading: bidsLoading, refetch: refetchBids } = useBids({});
  const [placing, setPlacing] = useState<string | null>(null);
  const [proposal, setProposal] = useState('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const user = (cookieAuthUtils.getUser?.() as { role?: string } | null) || null;
  const isCreator = user?.role === 'creator';
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBudget, setSelectedBudget] = useState('rating')
  const[selectedSort,setSelectedSort]=useState('all')
 
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isBudgetDropdownOpen, setIsBudgetDropdownOpen] = useState(false);
const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Helper function to get bid status for a campaign
  const getBidStatus = (campaignId: string) => {
    const userBid = bids.find(bid => {
      // Handle both string and object campaign_id
      const bidCampaignId = typeof bid.campaign_id === 'string' 
        ? bid.campaign_id 
        : bid.campaign_id?._id;
      
      console.log('Comparing:', {
        campaignId,
        bidCampaignId,
        bidId: bid._id,
        match: bidCampaignId === campaignId
      });
      
      return bidCampaignId === campaignId;
    });
    
    console.log('Bid status result:', {
      campaignId,
      foundBid: userBid,
      status: userBid?.status || 'not_applied'
    });
    
    if (!userBid) return { status: 'not_applied', bid: null };
    return { status: userBid.status, bid: userBid };
  };

  const filtered = useMemo(() => {
    const now = new Date();
    // First filter out expired campaigns (deadline has passed)
    const activeCampaigns = campaigns.filter((c) => {
      if (!c.deadline) return false; // Exclude campaigns without deadline
      const deadlineDate = new Date(c.deadline);
      return deadlineDate > now; // Only include campaigns with future deadlines
    });

    // Then apply search filter if search query exists
    if (!search.trim()) return activeCampaigns;
    const q = search.toLowerCase();
    return activeCampaigns.filter((c) => {
      const titleMatch = c.title?.toLowerCase().includes(q);
      const descMatch = (c.description || '').toLowerCase().includes(q);
      const platformMatch = Array.isArray(c.requirements?.platforms)
        ? c.requirements.platforms.some((p) => String(p).toLowerCase().includes(q))
        : false;
      const brandMatch = typeof (c as any).brand_id?.name === 'string'
        ? (c as any).brand_id.name.toLowerCase().includes(q)
        : false;
      return titleMatch || descMatch || platformMatch || brandMatch;
    });
  }, [campaigns, search]);

  // Debounce search input and update params
  useEffect(() => {
    const id = setTimeout(() => {
      setParams({ page: 1, search: search || undefined });
    }, 300);
    return () => clearTimeout(id);
  }, [search, setParams]);

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Fetch bids when component mounts
  useEffect(() => {
    if (isCreator) {
      refetchBids();
    }
  }, [isCreator, refetchBids]);

  // Deep-link support: /creator/marketplace?campaign=... (optionally
  // &apply=1) opens that campaign's bid drawer directly, instead of
  // silently dropping the parameter and landing on the generic list.
  // Every existing "Apply Now" / "Place Bid" link elsewhere in the app
  // (the public campaigns page, the creator dashboard's recommendations,
  // and bid-related notifications) points here with this exact param -
  // none of them worked before this, since it was never read at all.
  //
  // deepLinkAttempted is a ref, not state: this effect's dependencies
  // (campaigns, loading) churn several times in quick succession right
  // after mount (the debounced search filter alone triggers a second
  // fetch), and each change tears down the previous effect invocation's
  // closure before its in-flight getCampaign() promise resolves. A
  // `cancelled` flag scoped to one invocation (the usual pattern for this)
  // ends up true by the time *any* invocation's promise settles, so
  // nothing ever opens. A ref persists across all of those re-invocations
  // on the same mount, so it correctly guards "attempt this exactly once"
  // without being torn down by unrelated dependency changes.
  const deepLinkAttempted = useRef(false);
  useEffect(() => {
    if (loading || selectedCampaign || deepLinkAttempted.current) return;
    const campaignId = searchParams.get('campaign');
    if (!campaignId) return;
    deepLinkAttempted.current = true;

    const openCampaign = (c: Campaign) => {
      setSelectedCampaign(c);
      setDrawerOpen(true);
    };

    const inLoadedList = campaigns.find((c) => c._id === campaignId);
    if (inLoadedList) {
      openCampaign(inLoadedList);
      return;
    }

    // Not in the first page of active campaigns (e.g. a different status,
    // or beyond the default page size) - fetch it directly by id rather
    // than silently failing to find it.
    getCampaign(campaignId)
      .then((c) => {
        if (c) openCampaign(c);
      })
      .catch(() => {
        setMessage({ type: 'error', text: 'That campaign could not be found. It may have been removed or closed.' });
      });
  }, [loading, campaigns, searchParams, selectedCampaign]);

  // Debug: Log bids data when it changes
  useEffect(() => {
    console.log('Bids data updated:', {
      bidsCount: bids.length,
      bids: bids.map(b => ({
        id: b._id,
        campaign_id: b.campaign_id,
        status: b.status
      }))
    });
  }, [bids]);

  const placeBid = async () => {
    if (!isCreator) {
      setMessage({ type: 'error', text: 'Only creator accounts can place bids. Please login as a creator.' });
      return;
    }
    if (!selectedCampaign) return;
    try {
      setPlacing(selectedCampaign._id);
      await createBidApi({ campaign_id: selectedCampaign._id, proposal_text: proposal, bid_amount: amount, currency: 'INR' });
      // Close the modal immediately on success
      setDrawerOpen(false);
      setTimeout(() => {
        setSelectedCampaign(null);
      }, 300);
      setMessage({ type: 'success', text: 'Bid submitted successfully! Your platform profiles have been attached to your proposal.' });
      // Reset inputs
      setProposal('');
      setAmount(0);
      setAmountInput('');
      // Refresh data in the background
      void Promise.allSettled([refetch(), refetchBids()]);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to place bid';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setPlacing(null);
    }
  };
// 🧠 When user selects a filter
  const handleSelectFilter = (label: string, setter: any, closeDropdown: any) => {
    setter(label);
    closeDropdown(false);

    // Add filter if not already in list
    setActiveFilters((prev) =>
      label && !prev.includes(label) ? [...prev, label] : prev
    );
  };
 // 🧹 Clear all filters
  const handleClearFilters = () => {
    setActiveFilters([]);
    setSelectedPlatform("");
    setSelectedCategory("");
    setSelectedBudget("");
  };
  const closeDrawer = () => {
  setDrawerOpen(false);
  setTimeout(() => {
  setSelectedCampaign(null);
  }, 300); // wait for animation to complete
};

  const [showConfirmation, setShowConfirmation] = useState(false);

const [isExpanded, setIsExpanded] = useState(false);


const platformOptions = [
    { value: 'all', label: 'All Platforms' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'twitter', label: 'Twitter'},
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'tiktok', label: 'TikTok' }
  ];

  const SortOptions = [
    { value: 'all', label: 'All Sort'},
    { value: 'fashion', label: 'Newest first' },
    { value: 'technology', label: 'Oldest First' },
    { value: 'fitness', label: 'Highest Budget' },
    { value: 'lifestyle', label: 'Lowest Budget'},
   
  ];
    

  const BudgetOptions = [
    { value: 'rating', label: 'Any Budget' },
    { value: 'followers', label: '₹0 - ₹10K' },
    { value: 'engagement', label: '₹10K - ₹50K' },
    { value: 'price-low', label: '₹50K - ₹1L' },
    { value: 'price-high', label: '₹1L+' }
  ];


  
  return (
    <CreatorLayout 
      title="Creator Marketplace" 
      subtitle="Discover and bid on brand campaigns"
    >
      {/* Header Section */}
      <div className="mb-8">
  <div className="flex flex-col">
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        placeholder="Search campaigns..."
        className="pl-10 pr-4 py-3 border border-gray-300 rounded-sm 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                  bg-white hover:border-gray-200 transition-colors duration-200 
                  w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  </div>
</div>



    
      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-sm border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <XCircle className="w-5 h-5 mr-2" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Filters Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-sm hovershadow-sm border border-gray-200/04 p-3 mb-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3 sm:gap-3 ">
  <div className="w-10 h-8 lg:w-10 lg:h-10  bg-gradient-to-r from-blue-500 to-purple-600 rounded-sm flex items-center justify-center">
              <Filter className="w-5 h-5 text-white" />
            </div>
           <div className="flex flex-col leading-tight mt-2">
               <h3 className="text-sm font-semibold text-gray-900 sm:text-base">Filter Campaigns</h3>
              <p className="text-xs text-gray-600 lg:text-sm">Refine your search to find the perfect campaigns</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-sm text-gray-500">{filtered.length} campaigns found</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
       
          {/* <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Campaign Type</label>
            <select 
           className="w-full border  border-gray-300 rounded-sm px-4 py-3 text-sm  focus:border-gray-300 bg-white hover:border-gray-300 transition-colors duration-200" 
              defaultValue=""
            >
              <option value="">All Types</option>
              <option value="sponsored"> Sponsored Posts</option>
              <option value="collaboration"> Collaborations</option>
              <option value="review"> Product Reviews</option>
              <option value="brand"> Brand Partnerships</option>
            </select>
          </div> */}

{/*  plateform  */}
<div className="relative" data-dropdown>
                <button
                  type="button"
             className="w-full inline-flex items-center gap-2 px-4 py-3 border border-gray-200/04 rounded-sm focus:outline-none transition-colors text-left"

                  onClick={() => setIsPlatformDropdownOpen(!isPlatformDropdownOpen)}
                >
                  <span className="text-gray-700">
                    {platformOptions.find(opt => opt.value === selectedPlatform)?.label}
                  </span>
                  <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ml-auto ${isPlatformDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isPlatformDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200/04 rounded-sm shadow-sm">
                    <div className="p-1">
                      {platformOptions.map((option) => (
                        <button
                          key={option.value}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded text-left transition-colors"
                          onClick={() => {
                            setSelectedPlatform(option.value);
                            setIsPlatformDropdownOpen(false);
                            if (option.value !== "all" && !activeFilters.includes(option.label)) {
    setActiveFilters([...activeFilters, option.label]);
  }
                          }}
                        >
                        
                          <span className="text-sm text-gray-700">{option.label}</span>
                          {selectedPlatform === option.value && (
                            <CheckIcon className="w-4 h-4 text-blue-600 " />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Category Filter */}
              <div className="relative" data-dropdown>
                <button
                  type="button"
              className="w-full inline-flex items-center gap-2 px-4 py-3 border border-gray-200/04 rounded-sm focus:outline-none transition-colors text-left"

                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                >
                 <span className="text-gray-700">
  {SortOptions.find(opt => opt.value === selectedCategory)?.label}
</span>
                  <ChevronDownIcon className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isSortDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200/04 rounded-sm shadow-lg">
                    <div className="p-2">
                      {SortOptions.map((option) => (
                        <button
                          key={option.value}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded text-left transition-colors"
                          onClick={() => {
                            setSelectedSort(option.value);
                            setIsSortDropdownOpen(false);
                            if (option.value !== "all" && !activeFilters.includes(option.label)) {
    setActiveFilters([...activeFilters, option.label]);
  }
                          }}
                        >
                          {/* <span>{option.icon}</span> */}
                          <span className="text-sm text-gray-700 ">{option.label}</span>
                          {selectedCategory === option.value && (
                            <CheckIcon className="w-4 h-4 text-blue-600 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sort Filter */}
              <div className="relative" data-dropdown>
                <button
                  type="button"
              className="w-full inline-flex items-center gap-2 px-4 py-3 border border-gray-200/04 rounded-sm focus:outline-none transition-colors text-left"

                  onClick={() => setIsBudgetDropdownOpen(!isBudgetDropdownOpen)}
                >
                  <span className="text-gray-700">
                    {BudgetOptions.find(opt => opt.value === selectedBudget)?.label}
                  </span>
                  <ChevronDownIcon className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${isBudgetDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isBudgetDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200/04 rounded-sm shadow-lg">
                    <div className="p-2">
                      {BudgetOptions.map((option) => (
                        <button
                          key={option.value}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded text-left transition-colors"
                          onClick={() => {
                            setSelectedBudget(option.value);
                            setIsBudgetDropdownOpen(false);
                            if (option.value !== "all" && !activeFilters.includes(option.label)) {
    setActiveFilters([...activeFilters, option.label]);
  }
                          }}
                        >
                          {/* <span>{option.icon}</span> */}
                          <span className="text-sm text-gray-700">{option.label}</span>
                          {selectedBudget === option.value && (
                            <CheckIcon className="w-4 h-4 text-blue-600 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
        </div>
        
       {/* <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-400 flex-wrap gap-2 mb-3 mt-3">
          <div className="flex flex-wrap mb-1 items-center space-x-2 gap-2">
            <span className="text-xs text-gray-500">Quick filters:</span>
            <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700  border border-blue-700 rounded-full hover:bg-blue-200 transition-colors duration-200">
              High Budget
            </button>
            <button className="px-3 py-1 text-xs bg-green-100 text-green-700 border border-green-700 rounded-full hover:bg-green-200 transition-colors duration-200">
              Instagram
            </button>
            <button className="px-3 py-1 text-xs bg-purple-100 text-purple-700   border border-purple-700 rounded-full hover:bg-purple-200 transition-colors duration-200">
              YouTube
            </button>
          </div>
          <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 w-full sm:w-auto text-left sm:text-right">
            Clear all filters
          </button>
        </div> */}


        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-400 flex-wrap gap-2 mb-3">
  <div className="flex flex-wrap mb-1 items-center space-x-2 gap-2">
    <span className="text-xs text-gray-500">Quick filters:</span>

    {activeFilters.length > 0 ? (
      activeFilters.map((filter, index) => (
        <button
          key={index}
          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 border border-blue-700 rounded-full hover:bg-blue-200 transition-colors duration-200 flex items-center gap-1"
        >
          {filter}
          <span
            onClick={() =>
              setActiveFilters(activeFilters.filter((f) => f !== filter))
            }
            className="ml-1 text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            ✕
          </span>
        </button>
      ))
    ) : (
      <span className="text-xs text-gray-400">No active filters</span>
    )}
  </div>

  {activeFilters.length > 0 && (
    <button
      onClick={() => {
        setActiveFilters([]);
        setSelectedPlatform("all");
        setSelectedCategory("all");
        setSelectedBudget("rating");
      }}
      className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 w-full sm:w-auto text-left sm:text-right"
    >
      Clear all filters
    </button>
  )}
</div>

       </div>

      {/* Loading and Error States */}
      {(loading || bidsLoading) && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">
            {loading ? 'Loading campaigns...' : 'Loading bid status...'}
          </span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading campaigns</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(c => {
          const bidStatus = getBidStatus(c._id);
          const brandName = (c as any).brand_id?.name || 'Brand';
          console.log('Rendering campaign:', c.title, 'bid status:', bidStatus, 'brand:', brandName);
          return (
            <div key={c._id} className="bg-white rounded-sm  border hover:shadow-sm transition-shadow duration-200">
              <div className="p-3">
                <div className="flex  items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex  items-center justify-between mb-2">
                      <div className="flex-2">
                        <h3 className="text-lg font-semibold text-gray-900">{c.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">by {brandName}</p>
                      </div>
                      {/* Bid Status Badge - Always show */}
                      <div className={`flex flex-1 items-center px-2 py-1.5 rounded-xl text-xs font-sm ${
                        bidStatus.status === 'accepted' ? 'bg-green-100 text-green-800 border border-green-300 items-center' :
                        bidStatus.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-800 items-center' :
                        bidStatus.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-800 items-center ' :
                        bidStatus.status === 'not_applied' ? 'bg-gray-100 text-gray-600 border border-gray-400 items-center ' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {bidStatus.status === 'accepted' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {bidStatus.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                        {bidStatus.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {bidStatus.status === 'not_applied' && <XCircle className="w-3 h-3 mr-1" />}
                        {bidStatus.status === 'accepted' ? 'Accepted' :
                         bidStatus.status === 'rejected' ? 'Rejected' :
                         bidStatus.status === 'pending' ? 'Pending' :
                         bidStatus.status === 'not_applied' ? 'Not Applied' : 'Applied'}
                      </div>
                    </div>
                   <div>
  <p className={`text-sm text-gray-600 mt-2 mb-1 ${isExpanded ? '' : 'line-clamp-2'}`}>
    {c.description}
  </p>

  {c.description.length > 120 && (
    <button
      onClick={() => setIsExpanded(!isExpanded)}
      className="text-blue-600 mt-1  mb-4 text-xs hover:underline"
    >
      {isExpanded ? "Read less" : "Read more"}
    </button>
  )}
</div> 
 </div>
  </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-green-600">
                  <IndianRupee className="w-4 h-4 mr-1" />
                    <span className="text-lg font-bold">{c.budget.toLocaleString()}</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Active</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center mb-3">
                  <Globe className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Platforms</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.requirements.platforms.map(p => (
                    <span key={p} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 border border-purple-700 text-purple-800">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

                 <div className="text-gray-500 text-sm">
                {c?.deadline ? (
  <span>
    Expiry date : {new Date(c.deadline).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}
  </span>
) : null}



                  </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-500 text-sm">
                  <Users className="w-4 h-4 mr-1" />
                  <span>Target: {(c as Campaign & { targetAudience?: string }).targetAudience || 'General'}</span>
                  </div>
                 
                <button 
                    className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${bidStatus.status === 'accepted'
                        ? 'border-green-700 text-green-700 bg-green-200 hover:bg-green-100 focus:ring-green-500' :
                        bidStatus.status === 'rejected'
                          ? 'border-red-700 text-red-700 bg-red-200 hover:bg-red-200 focus:ring-red-500' :
                          bidStatus.status === 'pending'
                            ? 'border-yellow-700 text-yellow-700 bg-yellow-200 hover:bg-yellow-200 focus:ring-yellow-500' :
                            bidStatus.status !== 'not_applied'
                              ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:ring-blue-500' :
                              ' text-blue-700 border border-blue-700 bg-blue-200 hover:bg-blue-200 focus:ring-blue-500'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={!isCreator || bidStatus.status !== 'not_applied'}
                    onClick={() => {
                      bidStatus.status === 'not_applied' ? setSelectedCampaign(c) : null
                      setDrawerOpen(true);
                    }
                    }>
                  {!isCreator ? 'Login Required' :
                   bidStatus.status === 'accepted' ? 'Accepted ✓' :
                   bidStatus.status === 'rejected' ? 'Rejected ✗' :
                   bidStatus.status === 'pending' ? 'Pending ⏳' :
                   bidStatus.status !== 'not_applied' ? 'Applied ✓' :
                   'Place Bid'}
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && !bidsLoading && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or check back later.</p>
        </div>
      )}
{selectedCampaign && (
  <div className="fixed inset-0 z-[9999] p-2">

    {/* Overlay */}
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
        drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={closeDrawer}
    />


    {/* Drawer */}
    <div
      className={`fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        drawerOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="h-full flex flex-col p-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-2 ">
          <h2 className="text-xl font-semibold text-gray-900">Place Your Bid</h2>
          <button onClick={closeDrawer} className="text-gray-500 hover:text-gray-700 text-xl leading-none">
            ×
          </button>
        </div>

        {/* Campaign Card */}
        <div className="p-4 bg-gray-50 rounded-md border border-gray-200/02">
                <h3 className="font-medium text-gray-900">{selectedCampaign.title}</h3>
                
                <div>
  <p className={`text-sm text-gray-600 mt-2 mb-1 ${isExpanded ? '' : 'line-clamp-2'}`}>
    {selectedCampaign.description}
  </p>

  {selectedCampaign.description.length > 120 && (
    <button
      onClick={() => setIsExpanded(!isExpanded)}
      className="text-blue-600 mt-1  mb-4 text-xs hover:underline"
    >
      {isExpanded ? "Read less" : "Read more"}
    </button>
  )}
</div> 
       
          <p className="text-sm text-gray-600">Budget: ₹{selectedCampaign.budget.toLocaleString()}</p>
        </div>
           
             
        {/* Inputs */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">

          {/* Proposal */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block"> Write your proposal</label>
            <textarea
              rows={4}
               className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg 
  focus:outline-none resize-none"
              value={proposal}
              onChange={e => setProposal(e.target.value)}
              placeholder="Describe your approach..."
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Bid Amount (INR)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center justify-center pl-2 text-gray-400">
                <IndianRupee className="h-4 w-4" />
              </span>
              <input
                type="number"
                min="0"
               className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-lg 
   focus:outline-none "
                value={amountInput}
                onChange={(e) => {
                  const val = e.target.value;
                   setAmountInput(val);
                    setAmount(val ? Number(val) : 0);
                }}
                placeholder="0"
              />
            </div>
          </div>

        </div>

        {/* Buttons */}
              <div className="space-y-3 w-full">
                 <button
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-sm hover:opacity-90 disabled:opacity-50"
            disabled={!isCreator || placing === selectedCampaign._id || !proposal || !amount}
           onClick={() => {
    // Only ask for confirmation here - placeBid() fires solely from the
    // confirmation dialog's "Yes, Submit" button below. It used to also
    // fire from this click, submitting the bid for real before the user
    // ever saw the "Are you sure?" dialog - so "Cancel" on that dialog
    // never actually canceled anything.
    setDrawerOpen(false);
    setShowConfirmation(true);
  }}
          >
            {placing === selectedCampaign._id ? "Submitting..." : "Submit Bid"}
                </button>
                
          <button
            className="w-full border border-gray-300 px-4 py-2 rounded-sm hover:bg-gray-50"
            onClick={closeDrawer}
          >
            Cancel
          </button>

         
        </div>

      </div>
    </div>
  </div>
)}

{showConfirmation && (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-[9999]">
    <div className="bg-white w-110 p-6 rounded-sm shadow-xl relative">

      {/* Close Button */}
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-lg"
        onClick={() => { setShowConfirmation(false); setDrawerOpen(true); }}
      >
        <X/>
      </button>

      <h2 className="text-lg font-semibold mb-2 text-center">Confirm Bid Submission</h2>
      <p className="text-md text-gray-600 mb-6 text-center">
        Are you sure you want to submit this bid?
      </p>

      <div className="flex flex-col gap-3">
        <button
          className="w-full px-4 py-2  text-white rounded-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          onClick={() => {
            setShowConfirmation(false);
            placeBid();
          }}
        >
          Yes, Submit
        </button>

        <button
          className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-sm hover:bg-gray-300"
          onClick={() => { setShowConfirmation(false); setDrawerOpen(true); }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}



    </CreatorLayout>
  );
}

export default function CreatorMarketplacePage() {
  return (
    <Suspense fallback={null}>
      <CreatorMarketplace />
    </Suspense>
  );
}


