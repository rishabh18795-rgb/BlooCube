"use client";
import { useState, useEffect } from 'react';
import { Search, Filter, Users, Eye, Heart, MessageCircle, Share2, BarChart3, Target, Zap, Plus, ExternalLink, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/apiClient';
import { AnalysisResultModal } from '@/Components/AnalysisResultModal';
import Link from 'next/link';
import { ChevronDownIcon } from 'lucide-react';

import { CheckIcon } from 'lucide-react';
interface Competitor {
  id: string;
  name: string;
  handle: string;
  platform: string;
  followers: number;
  engagement: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  recentPosts: number;
  growthRate: number;
  category: string;
  verified: boolean;
  profileUrl?: string;
  lastAnalyzed?: string;
  analysisId?: string;
}

interface AnalysisHistory {
  id: string;
  competitorUrls: string[];
  analysisType: string;
  competitorsAnalyzed: number;
  createdAt: string;
  status: 'completed' | 'failed' | 'processing';
}

type AnalysisDoc = {
  _id?: string;
  createdAt?: string;
  ai_metadata?: { generated_at?: string };
  competitor_analysis?: {
    competitors?: Array<{
      platform?: string;
      username?: string;
      profile_url?: string;
      verified?: boolean;
      key_metrics?: {
        followers?: number;
        engagement_rate?: number | string;
        posts_analyzed?: number;
      };
      profile_metrics?: {
        followers?: number;
        engagement_rate?: number | string;
        posts_analyzed?: number;
      };
    }>;
  };
  data?: {
    results?: {
      competitors_data?: Array<{
        platform?: string;
        username?: string;
        profile_url?: string;
        verified?: boolean;
        key_metrics?: {
          followers?: number;
          engagement_rate?: number | string;
          posts_analyzed?: number;
        };
        profile_metrics?: {
          followers?: number;
          engagement_rate?: number | string;
          posts_analyzed?: number;
        };
      }>;
    };
  };
};

export default function BrandAnalyticsPage() {
  const { user, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFollowers, setSelectedFollwers] = useState('any')
  const [selectedlevel, setSelectedLevel] = useState('all')
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [quickPlatform, setQuickPlatform] = useState('instagram');
  const [quickInput, setQuickInput] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [fetchedData, setFetchedData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [aiTestStatus, setAiTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [aiTestMessage, setAiTestMessage] = useState<string>('');
  
  // Modal state for AI analysis results
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  // Load competitor data and analysis history
  useEffect(() => {
    if (user && user.role === 'brand') {
      loadAnalysisHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'brand') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Brand access required</h1>
          <p className="text-sm text-gray-600 mb-4">Please sign in with a brand account to view competitor analysis.</p>
        </div>
      </div>
    );
  }

  // Derive competitors from latest analyses
  const loadCompetitorDataFromAnalyses = async (analyses: AnalysisHistory[]) => {
    try {
      setLoading(true);
      // Limit detail fetches to avoid flooding; take up to latest 5
      const latest = analyses.slice(0, 5);
      // Use Promise.allSettled for graceful degradation - continue even if some requests fail
      const detailResponses = await Promise.allSettled(
        latest.map(a => apiRequest<{ success: boolean; data: Record<string, unknown> }>(`/api/competitor/analysis/${a.id}`))
      );
      const items: Competitor[] = [];
      const seen = new Set<string>();
      let successCount = 0;
      for (const result of detailResponses) {
        // Handle both fulfilled and rejected promises
        if (result.status === 'rejected') {
          console.warn('Failed to load competitor analysis:', result.reason);
          continue; // Skip failed requests but continue processing successful ones
        }
        const resp = result.value;
        successCount++;
        const d = resp?.data as AnalysisDoc;
        const compList = d?.competitor_analysis?.competitors || d?.data?.results?.competitors_data || [];
        for (const c of compList) {
          const platform = (c.platform || '').toString();
          const username = (c.username || '').toString();
          const key = `${platform}:${username}`;
          if (!username || !platform || seen.has(key)) continue;
          seen.add(key);
          const metrics = c.key_metrics || c.profile_metrics || {};
          const followers = metrics.followers || 0;
          const engagement = typeof metrics.engagement_rate === 'number' ? metrics.engagement_rate : parseFloat(metrics.engagement_rate || '0');
          const postsAnalyzed = metrics.posts_analyzed || 0;
          items.push({
            id: key,
            name: username,
            handle: `@${username}`,
            platform: platform.charAt(0).toUpperCase() + platform.slice(1),
            followers,
            engagement: Number.isFinite(engagement) ? engagement : 0,
            avgLikes: 0,
            avgComments: 0,
            avgShares: 0,
            recentPosts: postsAnalyzed,
            growthRate: 0,
            category: '—',
            verified: !!c.verified,
            profileUrl: c.profile_url || c.profile_url,
            lastAnalyzed: d?.createdAt || d?.ai_metadata?.generated_at || undefined,
            analysisId: d?._id
          });
        }
      }
      // Set competitors even if some requests failed (partial success)
      setCompetitors(items);
      if (successCount < detailResponses.length) {
        console.warn(`Loaded ${successCount}/${detailResponses.length} competitor analyses successfully`);
      }
    } catch (e) {
      console.error('Failed to load competitor details:', e);
      setCompetitors([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysisHistory = async () => {
    try {
      const response = await apiRequest<{
        success: boolean;
        data: { analyses: AnalysisHistory[] };
      }>(
        '/api/competitor/history'
      );
      
      if (response.success) {
        setAnalysisHistory(response.data.analyses);
        loadCompetitorDataFromAnalyses(response.data.analyses);
      }
    } catch (error) {
      console.error('Failed to load analysis history:', error);
      // Set empty state instead of failing silently
      setAnalysisHistory([]);
      setCompetitors([]);
      setLoading(false);
    }
  };

  const filteredCompetitors = competitors.filter(competitor => {
    const matchesSearch = competitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         competitor.handle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = selectedPlatform === 'all' || competitor.platform.toLowerCase() === selectedPlatform;
    const matchesCategory = selectedCategory === 'all' || competitor.category.toLowerCase() === selectedCategory;
    
    return matchesSearch && matchesPlatform && matchesCategory;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const buildProfileUrl = (platform: string, input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    // If it's already a full URL, return as is
    try {
      const url = new URL(trimmed);
      return url.toString();
    } catch {}
    const username = trimmed.replace(/^@/, '');
    switch (platform) {
      case 'instagram':
        return `https://www.instagram.com/${username}`;
      case 'twitter':
        return `https://twitter.com/${username}`;
      case 'youtube':
        return `https://www.youtube.com/@${username}`;
      case 'linkedin':
        return `https://www.linkedin.com/in/${username}`;
      case 'facebook':
        return `https://www.facebook.com/${username}`;
      default:
        return null;
    }
  };

  // Auto-detect platform from an entered URL
  const detectPlatformFromInput = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    try {
      const url = new URL(trimmed);
      const hostname = url.hostname.toLowerCase();
      if (hostname.includes('instagram.com')) return 'instagram';
      if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
      if (hostname.includes('youtube.com')) return 'youtube';
      if (hostname.includes('linkedin.com')) return 'linkedin';
      if (hostname.includes('facebook.com')) return 'facebook';
      return null;
    } catch {
      return null;
    }
  };

  const fetchCompetitorData = async () => {
    const blocked = new Set(['instagram', 'facebook', 'linkedin']);
    if (blocked.has(quickPlatform)) {
      setQuickError('Fetching for Instagram, Facebook, and LinkedIn is currently unavailable.');
      setShowPreview(false);
      return;
    }
    const profileUrl = buildProfileUrl(quickPlatform, quickInput);
    if (!profileUrl) {
      setQuickError('Enter a valid username or full profile URL');
      return;
    }
    setQuickError(null);
    setQuickLoading(true);
    try {
      const resp = await apiRequest<{ success: boolean; data: any }>(
        '/api/competitor/fetch',
        {
          method: 'POST',
          body: JSON.stringify({
            competitorUrl: profileUrl,
            platform: quickPlatform
          })
        }
      );
      if (resp.success) {
        setFetchedData(resp.data);
        setShowPreview(true);
        setQuickError(null);
      } else {
        setQuickError('Failed to fetch competitor data. Please try again.');
      }
    } catch (e: unknown) {
      const err = e as { message?: string } | undefined;
      setQuickError(err?.message || 'Failed to fetch competitor data. Please try again.');
    } finally {
      setQuickLoading(false);
    }
  };

  const startQuickAnalysis = async () => {
    if (!fetchedData) {
      setQuickError('Please fetch competitor data first');
      return;
    }
    
    setAnalysisLoading(true);
    setQuickError(null);
    setShowAnalysisModal(true);
    
    try {
      const resp = await apiRequest<{ success: boolean; data: any }>(
        '/api/competitor/analyze',
        {
          method: 'POST',
          body: JSON.stringify({
            competitorUrls: [fetchedData.profile.profileUrl],
            analysisType: 'comprehensive',
            platforms: [quickPlatform],
            options: { 
              maxPosts: 30, 
              timePeriodDays: 30, 
              includeContentAnalysis: true, 
              includeEngagementAnalysis: true, 
              includeAudienceAnalysis: true, 
              includeCompetitiveInsights: true, 
              includeRecommendations: true,
              fetchRealTimeData: true,
              platformSpecific: true
            }
          })
        }
      );
      
      if (resp.success) {
        setAnalysisResults(resp.data);
        // Update list immediately from returned data
        await loadAnalysisHistory();
        // Reset form
        setFetchedData(null);
        setShowPreview(false);
        setQuickInput('');
        setQuickError(null);
      } else {
        setQuickError('Analysis failed. Please try again.');
        setShowAnalysisModal(false);
      }
    } catch (e: unknown) {
      const err = e as { message?: string } | undefined;
      setQuickError(err?.message || 'Analysis failed. Please try again.');
      setShowAnalysisModal(false);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 7) return 'text-green-600 bg-green-100';
    if (engagement >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getGrowthColor = (growth: number) => {
    if (growth >= 10) return 'text-green-600';
    if (growth >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const testAIServices = async () => {
    setAiTestStatus('testing');
    setAiTestMessage('Testing AI Services connection...');
    
    try {
      const response = await apiRequest<{ success: boolean; data: any; message: string }>(
        '/api/competitor/test-ai'
      );
      
      if (response.success) {
        setAiTestStatus('success');
        const processingTime = response.data.test_analysis?.processing_time || 'N/A';
        setAiTestMessage(`AI Services connected successfully! Processing time: ${processingTime}ms`);
      } else {
        setAiTestStatus('error');
        setAiTestMessage('AI Services test failed');
      }
    } catch (error: any) {
      console.error('AI Services test error:', error);
      setAiTestStatus('error');
      setAiTestMessage(`AI Services connection failed: ${error.message || 'Please check if the backend server is running'}`);
    }
  };

 

  const platformOptions = [
    { value: 'all', label: 'All Platforms' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'twitter', label: 'Twitter'},
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'tiktok', label: 'TikTok' }
  ];
  const categoryOptions = [
    { value: 'all', label: 'All Categories'},
    { value: 'fashion', label: 'Fashion' },
    { value: 'technology', label: 'Technology' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'lifestyle', label: 'Lifestyle'},
    { value: 'beauty', label: 'Beauty' },
    { value: 'food', label: 'Food' },
    { value: 'travel', label: 'Travel' }
  ];
    const followersrange = [
    { value: 'any', label: 'Any Size' },
    { value: 'micro', label: 'Micro' },
    { value: 'mid', label: 'Mid-tier' },
    { value: 'macro', label: 'Macro' },
   
  ];
  const engagementlevel = [
    { value: 'all', label: 'Any Level' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'price-low', label: 'Low' },
   
  ];

  return (
    <div className="max-w-7xl mx-auto mt-4">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Competitor Analysis</h1>
            <p className="text-gray-600 mt-1">Analyze your competitors and discover market opportunities</p>
          </div>
          
          <div className='flex gap-2'>
          
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="border border-gray-200/08 text-gray-800 px-3 py-1.5 rounded-sm hover:bg-gray-50 transition-colors flex items-center space-x-2 text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              <span>History</span>
            </button>
           
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 w-4 h-4" />
              <input
                type="text"
                placeholder="Search competitors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-200/04 rounded-sm  bg-white  focus:outline-none transition-colors duration-200 w-full sm:min-w-[260px] text-sm"
              />
            </div>
            </div>
        </div>
      </div>

      {/* AI Services Status */}
      {aiTestMessage && (
        <div className={`mb-4 p-4 rounded-lg border ${
          aiTestStatus === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : aiTestStatus === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">{aiTestMessage}</span>
          </div>
        </div>
      )}

      {/* Quick Analysis Form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-sm hovershadow-sm border border-gray-200/04 p-3 mb-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3 sm:gap-3 ">
  <div className="w-10 h-8 lg:w-10 lg:h-10  bg-gradient-to-r from-blue-500 to-purple-600 rounded-sm flex items-center justify-center">
    <Search className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
  </div>
  
  <div className="flex flex-col leading-tight mt-2">
    <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
      Quick Competitor Analysis
    </h3>
    <p className="text-xs text-gray-600 lg:text-sm">
      Select a platform and enter a profile URL or username
    </p>
  </div>
</div>

        </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          {/* Platform Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">Platform</label>
            <select 
              className="w-full border text-black border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-800 transition-colors duration-200" 
              value={quickPlatform}
              onChange={(e) => setQuickPlatform(e.target.value)}
            >
              <option value="instagram" disabled>Instagram (disabled)</option>
              <option value="youtube">YouTube</option>
              <option value="twitter">Twitter</option>
              <option value="linkedin" disabled>LinkedIn (disabled)</option>
              <option value="facebook" disabled>Facebook (disabled)</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-800">Profile URL or Username</label>
            <input
              type="text"
              value={quickInput}
              onChange={(e) => {
                const val = e.target.value;
                setQuickInput(val);
                const detected = detectPlatformFromInput(val);
                if (detected) setQuickPlatform(detected);
              }}
              placeholder="e.g. https://youtube.com/@channel or https://twitter.com/username"
              className="w-full border text-black border-gray-200/04 rounded-sm px-3 py-3 text-sm  focus:outline-none bg-white  transition-colors duration-200"
            />
            {quickError && <div className="text-sm text-red-600">{quickError}</div>}
          </div>
          <div>
            <button
              onClick={fetchCompetitorData}
              disabled={quickLoading || !quickInput.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600  text-white px-4 py-3 rounded-sm hover:bg-blue-700 transition-colors disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70 text-sm"
            >
              {quickLoading ? 'Fetching Data…' : showPreview ? 'Refetch Competitor Data' : 'Fetch Competitor Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Competitor Data Preview */}
      {showPreview && fetchedData && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-800/50 p-6 mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Competitor Data Preview</h3>
                <p className="text-sm text-gray-900">Review the fetched data before AI analysis</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowPreview(false);
                setFetchedData(null);
              }}
              className="text-gray-800 hover:text-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Profile Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-800">Platform:</span>
                  <span className="font-medium text-gray-600 capitalize">{fetchedData.profile.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-800">Username:</span>
                  <span className="font-medium text-gray-600">@{fetchedData.profile.username}</span>
                </div>
                {fetchedData.profile.followers && (
                  <div className="flex justify-between">
                    <span className="text-gray-800">Followers:</span>
                    <span className="font-medium text-gray-600">{formatNumber(fetchedData.profile.followers)}</span>
                  </div>
                )}
                {fetchedData.profile.verified && (
                  <div className="flex justify-between">
                    <span className="text-gray-800">Verified:</span>
                    <span className="text-green-600 font-medium">✓ Yes</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content Statistics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Content Statistics
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-800">Recent Posts:</span>
                  <span className="font-medium text-gray-700">{fetchedData.content.totalPosts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-800">Posts/Week:</span>
                  <span className="font-medium text-gray-700">{fetchedData.content.averagePostsPerWeek.toFixed(1)}</span>
                </div>
                {fetchedData.content.topHashtags && fetchedData.content.topHashtags.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-800">Top Hashtag:</span>
                    <span className="font-medium text-gray-700">#{fetchedData.content.topHashtags[0]?.tag}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Heart className="w-4 h-4 mr-2" />
                Engagement Metrics
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-800">Engagement Rate:</span>
                  <span className={`font-medium text-gray-700 ${getEngagementColor(parseFloat(fetchedData.engagement.engagementRate))}`}>
                    {fetchedData.engagement.engagementRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-800">Avg Likes:</span>
                  <span className="font-medium text-gray-700">{formatNumber(fetchedData.engagement.averageLikes || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-800">Avg Comments:</span>
                  <span className="font-medium text-gray-700">{formatNumber(fetchedData.engagement.averageComments || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data Quality Indicator */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  fetchedData.dataQuality.level === 'high' ? 'bg-green-500' :
                  fetchedData.dataQuality.level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium text-gray-800">
                  Data Quality: {fetchedData.dataQuality.level.toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-900">
                Fetched: {new Date(fetchedData.fetchedAt).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* AI Services Section */}
          <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center">
                <Zap className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-sm font-medium text-yellow-800">
                  AI Services: Ready for Analysis
                </span>
              </div>
              <button
                onClick={startQuickAnalysis}
                disabled={analysisLoading}
                className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-800 text-xs"
              >
                {analysisLoading ? 'AI Analyzing…' : 'Start AI Analysis'}
              </button>
            </div>
            <p className="text-xs text-yellow-700 mt-2">
              Enhanced AI analysis will be performed. If AI services are unavailable, basic analysis will be provided.
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Filters Section */}
      {!loading && filteredCompetitors.length > 0 && (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-800/50 p-5 mb-8 hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
           <div className="flex items-center gap-3 sm:gap-3 ">
  <div className="w-10 h-8 lg:w-10 lg:h-10  bg-gradient-to-r from-blue-500 to-purple-600 rounded-sm flex items-center justify-center">
              <Filter className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col leading-tight mt-2">
    <h3 className="text-sm font-semibold text-gray-900 sm:text-base">
     Filter Competitors
    </h3>
    <p className="text-xs text-gray-600 lg:text-sm">
      Refine your analysis to focus on relevant competitors
    </p>
  </div>
           
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-900">{filteredCompetitors.length} competitors found</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">Platform</label>
            <select 
              className="w-full border text-black border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-800 transition-colors duration-200" 
              value={selectedPlatform} 
              onChange={(e) => setSelectedPlatform(e.target.value)}
            >
              <option value="all">All Platforms</option>
              <option value="youtube"> YouTube</option>
              <option value="instagram"> Instagram</option>
              <option value="twitter"> Twitter</option>
              <option value="linkedin"> LinkedIn</option>
              <option value="facebook"> Facebook</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">Category</label>
            <select 
              className="w-full border text-black border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-800 transition-colors duration-200" 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="technology">Technology</option>
              <option value="fashion"> Fashion</option>
              <option value="fitness"> Fitness</option>
              <option value="food"> Food</option>
              <option value="travel"> Travel</option>
              <option value="beauty"> Beauty</option>
              <option value="gaming"> Gaming</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">Follower Range</label>
            <select 
              className="w-full border text-black border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-800 transition-colors duration-200"
              value={selectedFollowers}
              onChange={(e) => setSelectedFollwers(e.target.value)}
            >
              <option value="any">Any Size</option>
              <option value="micro"> Micro (1K-100K)</option>
              <option value="mid">Mid-tier (100K-1M)</option>
              <option value="macro"> Macro (1M+)</option>
              <option value="mega"> Mega (10M+)</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">Engagement Level</label>
            <select 
              className="w-full border text-black border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-800 transition-colors duration-200"
              value={selectedlevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              <option value="all">Any Level</option>
              <option value="high"> High (7%+)</option>
              <option value="medium"> Medium (4-7%)</option>
              <option value="low"> Low (&lt;4%)</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-900">Quick filters:</span>
            <button className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors duration-200">
              High Engagement
            </button>
            <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors duration-200">
              Verified Only
            </button>
            <button className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors duration-200">
              Fast Growing
            </button>
          </div>
          <button className="text-sm text-gray-900 hover:text-gray-800 transition-colors duration-200 w-full sm:w-auto text-left sm:text-right">
            Clear all filters
          </button>
        </div>
      </div>
      )}

      {/* Analysis History Section */}
      {showHistory && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Analysis History</h2>
          {analysisHistory.length > 0 ? (
            <div className="space-y-4">
              {analysisHistory.slice(0, 5).map((analysis) => (
                <div key={analysis.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium">
                      {analysis.competitorsAnalyzed} competitors analyzed
                    </div>
                    <div className="text-sm text-gray-800">
                      {analysis.analysisType} • {new Date(analysis.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-900 mt-1">
                      {analysis.competitorUrls.slice(0, 2).join(', ')}
                      {analysis.competitorUrls.length > 2 && ` +${analysis.competitorUrls.length - 2} more`}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      analysis.status === 'completed' ? 'bg-green-100 text-green-800' :
                      analysis.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {analysis.status}
                    </span>
                    {analysis.status === 'completed' && (
                      <button className="text-blue-600 hover:text-blue-700">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-900">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-800" />
              <p>No analysis history yet</p>
              <p className="text-sm">Start your first competitor analysis to see results here</p>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-800">Loading competitors...</span>
          <div className="mt-4 text-sm text-gray-900 text-center max-w-md">
            <p>Fetching real-time data from social media platforms...</p>
            <p className="mt-1">This may take a few moments as we collect fresh data.</p>
          </div>
        </div>
      )}

      {/* API Error State */}
      {!loading && competitors.length === 0 && analysisHistory.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <BarChart3 className="w-12 h-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Competitor Analysis Unavailable</h3>
          <p className="text-sm text-gray-500 mb-4">
            The competitor analysis service is currently unavailable. Please ensure the backend server is running.
          </p>
          <button
            onClick={() => {
              setLoading(true);
              loadAnalysisHistory();
            }}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600  text-white rounded-sm hover:bg-blue-700 transition-colors"
          >
            <Zap className="w-4 h-4 mr-2" />
            Retry Connection
          </button>
        </div>
      )}

      {/* Competitors Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompetitors.map(competitor => (
            <div key={competitor.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-gray-900" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{competitor.name}</h3>
                        {competitor.verified && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-900">{competitor.handle}</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {competitor.platform}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-800">Followers</span>
                    <span className="font-semibold">{formatNumber(competitor.followers)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-800">Engagement</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEngagementColor(competitor.engagement)}`}>
                      {competitor.engagement}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-800">Growth Rate</span>
                    <span className={`font-semibold ${getGrowthColor(competitor.growthRate)}`}>
                      +{competitor.growthRate}%
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <Heart className="w-4 h-4 text-red-500 mx-auto mb-1" />
                    <div className="text-xs text-gray-800">Likes</div>
                    <div className="text-sm font-semibold">{formatNumber(competitor.avgLikes)}</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <MessageCircle className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                    <div className="text-xs text-gray-800">Comments</div>
                    <div className="text-sm font-semibold">{formatNumber(competitor.avgComments)}</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <Share2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
                    <div className="text-xs text-gray-800">Shares</div>
                    <div className="text-sm font-semibold">{formatNumber(competitor.avgShares)}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link 
                    href={`/creator/competitors/analyze?url=${encodeURIComponent(competitor.profileUrl || '')}`}
                    className="flex-1"
                  >
                    <button className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                      <Eye className="w-4 h-4 inline mr-1" />
                      Analyze
                    </button>
                  </Link>
                  {competitor.lastAnalyzed && (
                    <button 
                      className="px-3 py-2 border border-gray-800 text-gray-800 text-sm rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                      title="View last analysis"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Last analyzed info */}
                {competitor.lastAnalyzed && (
                  <div className="mt-2 text-xs text-gray-900 text-center">
                    Last analyzed: {new Date(competitor.lastAnalyzed).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCompetitors.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-800">
            <Target className="w-12 h-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No competitors found</h3>
          <p className="mt-1 text-sm text-gray-900">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Insights Section */}
      {!loading && filteredCompetitors.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center mb-4">
            <Zap className="w-5 h-5 text-yellow-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Key Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Top Performer</div>
              <div className="text-lg font-bold text-blue-900">
                {filteredCompetitors.reduce((prev, current) => 
                  prev.engagement > current.engagement ? prev : current
                ).name}
              </div>
              <div className="text-xs text-blue-600">
                {Math.max(...filteredCompetitors.map(c => c.engagement))}% engagement
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Fastest Growing</div>
              <div className="text-lg font-bold text-green-900">
                {filteredCompetitors.reduce((prev, current) => 
                  prev.growthRate > current.growthRate ? prev : current
                ).name}
              </div>
              <div className="text-xs text-green-600">
                +{Math.max(...filteredCompetitors.map(c => c.growthRate))}% growth
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Largest Audience</div>
              <div className="text-lg font-bold text-purple-900">
                {filteredCompetitors.reduce((prev, current) => 
                  prev.followers > current.followers ? prev : current
                ).name}
              </div>
              <div className="text-xs text-purple-600">
                {formatNumber(Math.max(...filteredCompetitors.map(c => c.followers)))} followers
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Results Modal */}
      <AnalysisResultModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        results={analysisResults}
        loading={analysisLoading}
      />
    </div>
  );
}