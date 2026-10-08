'use client'
import React, { useState, useEffect, Suspense } from "react";
import { Eye, EyeOff, User, Mail, Phone, MapPin, Globe, Calendar, Languages, Clock, Save, Upload, Trash2, AlertTriangle, Image as ImageIcon, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import CreatorLayout from '@/Components/Creater/CreatorLayout';
import { TwitterIntegrationWithSuspense } from "@/Components/LazyComponents";
import { LinkedInIntegrationWithSuspense } from "@/Components/LazyComponents";
import { YouTubeIntegrationWithSuspense } from "@/Components/LazyComponents";
import { InstagramIntegrationWithSuspense } from "@/Components/LazyComponents";
import { FacebookIntegrationWithSuspense } from "@/Components/LazyComponents";
import type { TwitterIntegrationRef } from "@/Components/Twitter/TwitterIntegration";
import type { LinkedInIntegrationRef } from "@/Components/LinkedIn/LinkedInIntegration";
import type { YouTubeIntegrationRef } from "@/Components/YouTube/YouTubeIntegration";
import type { InstagramIntegrationRef } from "@/Components/Instagram/InstagramIntegration";
import type { FacebookIntegrationRef } from "@/Components/Facebook/FacebookIntegration";
import { useRef } from "react";
import { profileApi, UserProfile, ProfileUpdateData, ChangePasswordData, formatPhoneNumber, parsePhoneNumber, getProfileCompletenessColor, getProfileCompletenessMessage, getAvatarUrl } from '@/lib/profile';
import { useTextPersistence } from '@/hooks/useTextPersistence';
import { useUserProfile } from '@/hooks/useUserProfile';
import { apiRequest } from '@/lib/apiClient';

interface NotificationState {
  type: 'success' | 'error' | 'warning' | null;
  message: string;
}

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onToggle, disabled = false }) => (
  <button
    onClick={onToggle}
    disabled={disabled}
    type="button"
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      enabled ? "bg-blue-600" : "bg-gray-700"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        enabled ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const { profile: userProfileFromHook, refreshProfile } = useUserProfile();
  
  // State management
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ type: null, message: '' });
  const [tokenPresent, setTokenPresent] = useState<boolean>(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string | null>(null);
  
  // Use profile from hook if available (for latest avatar data)
  const displayUser = userProfileFromHook || user;
  

  const linkedAccountRef = useRef(null);


  // Debug: Log avatar URL when it changes
  useEffect(() => {
    if (displayUser?.profile?.avatar_url) {
      console.log('🔍 Display User Avatar URL:', displayUser.profile.avatar_url);
      console.log('🔍 Processed Avatar URL:', getAvatarUrl(displayUser.profile.avatar_url));
    } else {
      console.log('⚠️ No avatar URL found in displayUser:', displayUser);
    }
  }, [displayUser?.profile?.avatar_url]);
  
  // Notification preferences state (maps to backend-supported fields)
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  
  // Form data
  // Use persistence for profile data
  const { value: profileName, setValue: setProfileName } = useTextPersistence({ key: 'settings_profile_name' });
  const { value: profileEmail, setValue: setProfileEmail } = useTextPersistence({ key: 'settings_profile_email' });
  const { value: profilePhone, setValue: setProfilePhone } = useTextPersistence({ key: 'settings_profile_phone' });
  
  const [profileData, setProfileData] = useState<ProfileUpdateData>({});
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: ''
  });
  const [deleteData, setDeleteData] = useState({ password: '' });
  
  // Refs to trigger connection checks
  const twitterRef = useRef<TwitterIntegrationRef>(null);
  const linkedinRef = useRef<LinkedInIntegrationRef>(null);
  const youtubeRef = useRef<YouTubeIntegrationRef>(null);
  const instagramRef = useRef<InstagramIntegrationRef>(null);
  const facebookRef = useRef<FacebookIntegrationRef>(null);

  // Cache helpers shared with Posts page
  const CONNECTIONS_CACHE_KEY = 'platform_connections_v1';
  const CONNECTIONS_CACHE_TTL = 5 * 60 * 1000;
  const loadConnectionsCache = (): { platforms: string[]; timestamp: number } | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(CONNECTIONS_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.platforms) || typeof parsed.timestamp !== 'number') return null;
      return parsed;
    } catch {
      return null;
    }
  };
  const saveConnectionsCache = (platforms: string[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CONNECTIONS_CACHE_KEY, JSON.stringify({ platforms, timestamp: Date.now() }));
    } catch {}
  };
  const addPlatformToCache = (platform: string) => {
    const cached = loadConnectionsCache();
    const set = new Set(cached?.platforms || []);
    set.add(platform);
    saveConnectionsCache(Array.from(set));
  };
  const removePlatformFromCache = (platform: string) => {
    const cached = loadConnectionsCache();
    const set = new Set(cached?.platforms || []);
    set.delete(platform);
    saveConnectionsCache(Array.from(set));
  };

  // Load user profile
  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await profileApi.getProfile();
      if (response.success) {
        setUser(response.data.user);
        // Enhanced logging for avatar URL
        const avatarUrl = response.data.user.profile?.avatar_url;
        console.log('📥 Profile loaded:', {
          hasAvatar: !!avatarUrl,
          avatarUrl: avatarUrl,
          processedUrl: avatarUrl ? getAvatarUrl(avatarUrl) : null,
          fullUser: response.data.user
        });
        setProfileData({
          name: response.data.user.name,
          email: response.data.user.email,
          profile: {
            bio: response.data.user.profile.bio,
            phone: response.data.user.profile.phone,
            location: response.data.user.profile.location,
            website: response.data.user.profile.website,
            dateOfBirth: response.data.user.profile.dateOfBirth,
            gender: response.data.user.profile.gender,
            language: response.data.user.profile.language,
            timezone: response.data.user.profile.timezone,
            social_links: response.data.user.profile.social_links,
            preferences: response.data.user.profile.preferences,
            avatar_url: response.data.user.profile.avatar_url
          }
        });

        // Initialize toggle UI from backend preferences
        const prefs = response.data.user.profile.preferences || {} as any;
        setMarketingEmails(prefs.marketingEmails ?? true);
        setEmailNotifications(prefs.emailNotifications ?? true);
        setPushNotifications(prefs.pushNotifications ?? false);
        setSmsNotifications(prefs.smsNotifications ?? false);
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  // Save profile changes
  const saveProfile = async () => {
    try {
      setSaving(true);
      
      // Build update payload - ensure all account details are included
      // Get current values from formData to ensure we have the latest
      const currentName = profileName || profileData.name || user?.name || '';
      const currentPhone = profilePhone || profileData.profile?.phone || user?.profile?.phone || '';
      
      const updateData: ProfileUpdateData = {};
      
      // Include name if it exists
      if (currentName.trim()) {
        updateData.name = currentName.trim();
      }
      
      // Build profile object with phone and other fields
      // Only include fields that have actual values (not empty strings or null)
      const profileFields: any = {};
      
      // Include phone if it has a value (allow empty string to clear it, but filter out undefined/null)
      if (currentPhone !== undefined && currentPhone !== null && currentPhone !== '') {
        profileFields.phone = currentPhone;
      }
      
      // Include other profile fields only if they have actual values
      // Filter out empty strings and null values to avoid validation errors
      if (profileData.profile?.bio !== undefined && profileData.profile.bio !== '' && profileData.profile.bio !== null) {
        profileFields.bio = profileData.profile.bio;
      }
      if (profileData.profile?.location !== undefined && profileData.profile.location !== '' && profileData.profile.location !== null) {
        profileFields.location = profileData.profile.location;
      }
      if (profileData.profile?.website !== undefined && profileData.profile.website !== '' && profileData.profile.website !== null) {
        profileFields.website = profileData.profile.website;
      }
      // Only include dateOfBirth if it's a valid date string
      if (profileData.profile?.dateOfBirth !== undefined && profileData.profile.dateOfBirth !== null && profileData.profile.dateOfBirth !== '') {
        profileFields.dateOfBirth = profileData.profile.dateOfBirth;
      }
      if (profileData.profile?.gender !== undefined && profileData.profile.gender !== null) {
        const genderValue = profileData.profile.gender;
        // Only include if it's a valid non-empty string
        if (typeof genderValue === 'string' && genderValue.trim() !== '') {
          profileFields.gender = genderValue;
        }
      }
      if (profileData.profile?.language !== undefined && profileData.profile.language !== '' && profileData.profile.language !== null) {
        profileFields.language = profileData.profile.language;
      }
      if (profileData.profile?.timezone !== undefined && profileData.profile.timezone !== '' && profileData.profile.timezone !== null) {
        profileFields.timezone = profileData.profile.timezone;
      }
      // Social links and preferences - only include if they exist and have values
      if (profileData.profile?.social_links && Object.keys(profileData.profile.social_links).length > 0) {
        profileFields.social_links = profileData.profile.social_links;
      }
      if (profileData.profile?.preferences && Object.keys(profileData.profile.preferences).length > 0) {
        profileFields.preferences = profileData.profile.preferences;
      }
      
      // Only add profile object if it has fields
      if (Object.keys(profileFields).length > 0) {
        updateData.profile = profileFields;
      }
      
      // Email is excluded - it cannot be changed
      
      console.log('Saving profile data:', updateData);
      
      const response = await profileApi.updateProfile(updateData);
      if (response.success) {
        setUser(response.data.user);
        
        // Update local profile data with server response
        setProfileData({
          name: response.data.user.name,
          profile: {
            bio: response.data.user.profile.bio,
            phone: response.data.user.profile.phone,
            location: response.data.user.profile.location,
            website: response.data.user.profile.website,
            dateOfBirth: response.data.user.profile.dateOfBirth,
            gender: response.data.user.profile.gender,
            language: response.data.user.profile.language,
            timezone: response.data.user.profile.timezone,
            social_links: response.data.user.profile.social_links,
            preferences: response.data.user.profile.preferences,
            avatar_url: response.data.user.profile.avatar_url
          }
        });
        
        // Update persisted values
        setProfileName(response.data.user.name);
        setProfilePhone(response.data.user.profile.phone || '');
        
        // Refresh profile from hook to ensure consistency
        await refreshProfile();
        
        setNotification({ type: 'success', message: 'Profile updated successfully!' });
        setTimeout(() => setNotification({ type: null, message: '' }), 5000);
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      setNotification({ type: 'error', message: error.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const changePassword = async () => {
    try {
      setSaving(true);
      const response = await profileApi.changePassword(passwordData);
      if (response.success) {
        setNotification({ type: 'success', message: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '' });
        setTimeout(() => setNotification({ type: null, message: '' }), 5000);
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setNotification({ type: 'error', message: 'Please upload an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setNotification({ type: 'error', message: 'Image size must be less than 5MB' });
      return;
    }

    try {
      setUploadingAvatar(true);
      const response = await profileApi.uploadAvatar(file);
      if (response.success) {
        console.log('Avatar upload response:', response);
        
        // Update local user state immediately with the new avatar URL
        if (response.data?.avatar_url) {
          setUser(prev => prev ? {
            ...prev,
            profile: {
              ...prev.profile,
              avatar_url: response.data.avatar_url
            }
          } : null);
        }
        
        // Force refresh both local state and hook - use await to ensure completion
        await refreshProfile();
        await loadProfile();
        
        // Small delay to ensure state updates propagate
        setTimeout(() => {
          setNotification({ type: 'success', message: 'Profile picture updated successfully!' });
          setTimeout(() => setNotification({ type: null, message: '' }), 5000);
        }, 100);
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      setNotification({ type: 'error', message: error.message || 'Failed to upload profile picture' });
    } finally {
      setUploadingAvatar(false);
      // Reset input
      e.target.value = '';
    }
  };

  // Handle avatar removal
  const handleRemoveAvatar = async () => {
    if (!displayUser?.profile?.avatar_url) {
      setNotification({ type: 'error', message: 'No profile picture to remove' });
      return;
    }

    if (!confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    try {
      setRemovingAvatar(true);
      const response = await profileApi.removeAvatar();
      if (response.success) {
        // Update local user state immediately
        setUser(prev => prev ? {
          ...prev,
          profile: {
            ...prev.profile,
            avatar_url: ''
          }
        } : null);
        
        // Force refresh both local state and hook - use await to ensure completion
        await refreshProfile();
        await loadProfile();
        
        // Small delay to ensure state updates propagate
        setTimeout(() => {
          setNotification({ type: 'success', message: 'Profile picture removed successfully!' });
          setTimeout(() => setNotification({ type: null, message: '' }), 5000);
        }, 100);
      }
    } catch (error: any) {
      console.error('Avatar removal error:', error);
      setNotification({ type: 'error', message: error.message || 'Failed to remove profile picture' });
    } finally {
      setRemovingAvatar(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = forgotPasswordEmail || formData.email;
    
    if (!email) {
      setNotification({ type: 'error', message: 'Please enter your email address' });
      setForgotPasswordMessage('Please enter your email address');
      return;
    }

    try {
      setForgotPasswordLoading(true);
      setForgotPasswordMessage(null);
      
      // Use apiRequest instead of direct fetch for consistent error handling, caching, and retry logic
      await apiRequest<{ success?: boolean; message?: string; error?: string }>(
        '/api/auth/request-password-reset',
        {
          method: 'POST',
          body: JSON.stringify({ email, fromSettings: true }), // Indicate this is from settings page
        }
      );

      setForgotPasswordMessage('If an account exists with this email, a password reset link has been sent. Please check your inbox and follow the instructions to reset your password.');
      setNotification({ type: 'success', message: 'Password reset link sent successfully! Check your email.' });
      setTimeout(() => {
        setNotification({ type: null, message: '' });
      }, 5000);
      
      // Clear the email field after successful submission
      setForgotPasswordEmail('');
    } catch (error: any) {
      console.error('Password reset error:', error);
      const errorMessage = error.message || 'Failed to send reset email. Please try again.';
      setForgotPasswordMessage(`Error: ${errorMessage}`);
      setNotification({ type: 'error', message: errorMessage });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // Delete account
  const deleteAccount = async () => {
    try {
      setSaving(true);
      const response = await profileApi.deleteAccount(deleteData);
      if (response.success) {
        setNotification({ type: 'success', message: 'Account deleted successfully. You will be redirected to login.' });
        setTimeout(() => {
          // Clear user data and redirect (cookies will be cleared by server)
          const { cookieAuthUtils } = require('@/lib/cookieAuth');
          cookieAuthUtils.clearAuth();
          window.location.href = '/auth/login';
        }, 3000);
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to delete account' });
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  // Handle profile field changes
  const handleProfileChange = (field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value
      }
    }));
  };

  // Handle social links changes
  const handleSocialLinkChange = (platform: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        social_links: {
          ...prev.profile?.social_links,
          [platform]: value
        }
      }
    }));
  };

  // Handle preferences changes
  const handlePreferenceChange = (preference: string, value: boolean) => {
    setProfileData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        preferences: {
          ...prev.profile?.preferences,
          [preference]: value
        }
      }
    }));
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    if (field === 'name') {
      setProfileName(value);
      setProfileData(prev => ({ ...prev, name: value }));
    } else if (field === 'email') {
      // Email cannot be changed - ignore this field
      return;
    } else if (field === 'currentPassword') {
      setPasswordData(prev => ({ ...prev, currentPassword: value }));
    } else if (field === 'newPassword') {
      setPasswordData(prev => ({ ...prev, newPassword: value }));
    } else if (field === 'phone') {
      setProfilePhone(value);
      handleProfileChange('phone', value);
    }
  };

  // Get form data for display
  const formData = {
    name: profileName || profileData.name || user?.name || '',
    email: profileEmail || profileData.email || user?.email || '',
    phone: profilePhone || profileData.profile?.phone || user?.profile?.phone || '',
    currentPassword: passwordData.currentPassword,
    newPassword: passwordData.newPassword
  };

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  // Sync with userProfileFromHook when it updates - especially for avatar changes
  useEffect(() => {
    if (userProfileFromHook) {
      // Always update to get the latest avatar data from the hook
      const currentAvatar = user?.profile?.avatar_url;
      const hookAvatar = userProfileFromHook.profile?.avatar_url;
      
      // Update if user is null or if avatar URL has changed
      if (!user || currentAvatar !== hookAvatar) {
        console.log('🔄 Syncing profile from hook:', { currentAvatar, hookAvatar });
        setUser(userProfileFromHook);
      }
    }
  }, [userProfileFromHook, userProfileFromHook?.profile?.avatar_url, user]);

  // Handle URL parameters for social media connection status
  useEffect(() => {
    const twitterStatus = searchParams.get('twitter');
    const linkedinStatus = searchParams.get('linkedin');
    const youtubeStatus = searchParams.get('youtube');
    const instagramStatus = searchParams.get('instagram');
    const facebookStatus = searchParams.get('facebook');
    const message = searchParams.get('message');
    
    if (twitterStatus === 'success') {
      setNotification({ type: 'success', message: 'Twitter account connected successfully!' });
      addPlatformToCache('twitter');
      try { sessionStorage.setItem('invalidate_connections_cache', '1'); } catch {}
      setTimeout(() => twitterRef.current?.checkConnection(), 1000);
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        setNotification({ type: null, message: '' });
      }, 5000);
    } else if (twitterStatus === 'error') {
      setNotification({ type: 'error', message: message ? decodeURIComponent(message) : 'Failed to connect Twitter account' });
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        setNotification({ type: null, message: '' });
      }, 5000);
    } else if (linkedinStatus === 'success') {
      setNotification({ type: 'success', message: 'LinkedIn account connected successfully!' });
      addPlatformToCache('linkedin');
      try { sessionStorage.setItem('invalidate_connections_cache', '1'); } catch {}
      setTimeout(() => linkedinRef.current?.checkConnection(), 1000);
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        setNotification({ type: null, message: '' });
      }, 5000);
    } else if (linkedinStatus === 'error') {
      setNotification({ type: 'error', message: message ? decodeURIComponent(message) : 'Failed to connect LinkedIn account' });
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        setNotification({ type: null, message: '' });
      }, 5000);
    } else if (youtubeStatus === 'success') {
      setNotification({ type: 'success', message: 'YouTube account connected successfully!' });
      addPlatformToCache('youtube');
      try { sessionStorage.setItem('invalidate_connections_cache', '1'); } catch {}
      setTimeout(() => youtubeRef.current?.checkConnection(), 3000);
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        setNotification({ type: null, message: '' });
      }, 5000);
    } else if (youtubeStatus === 'error') {
      setNotification({ type: 'error', message: message ? decodeURIComponent(message) : 'Failed to connect YouTube account' });
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        setNotification({ type: null, message: '' });
      }, 5000);
    } else if (instagramStatus === 'success') {
      setNotification({ type: 'success', message: 'Instagram account connected successfully!' });
      addPlatformToCache('instagram');
      try { sessionStorage.setItem('invalidate_connections_cache', '1'); } catch {}
      setTimeout(() => instagramRef.current?.checkConnection(), 1500);
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        setNotification({ type: null, message: '' });
      }, 5000);
    } else if (instagramStatus === 'error') {
      setNotification({ type: 'error', message: message ? decodeURIComponent(message) : 'Failed to connect Instagram account' });
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        setNotification({ type: null, message: '' });
      }, 5000);
    } else if (facebookStatus === 'success') {
      setNotification({ type: 'success', message: 'Facebook account connected successfully!' });
      addPlatformToCache('facebook');
      try { sessionStorage.setItem('invalidate_connections_cache', '1'); } catch {}
      setTimeout(() => facebookRef.current?.checkConnection(), 1500);
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        setNotification({ type: null, message: '' });
      }, 5000);
    } else if (facebookStatus === 'error') {
      setNotification({ type: 'error', message: message ? decodeURIComponent(message) : 'Failed to connect Facebook account' });
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        setNotification({ type: null, message: '' });
      }, 5000);
    }
  }, [searchParams]);

  // Check for auth token on mount (using cookie-based auth)
  useEffect(() => {
    try {
      const { cookieAuthUtils } = require('@/lib/cookieAuth');
      const isAuthenticated = cookieAuthUtils.isAuthenticated();
      setTokenPresent(isAuthenticated);
    } catch {
      setTokenPresent(false);
    }
  }, []);

  // Auto-check social connections on load after login
  useEffect(() => {
    const twitterStatus = searchParams.get('twitter');
    const linkedinStatus = searchParams.get('linkedin');
    const youtubeStatus = searchParams.get('youtube');
    const instagramStatus = searchParams.get('instagram');

    // Use cache instead of auto-checking to avoid repeated API calls on refresh
    if (tokenPresent && !twitterStatus && !linkedinStatus && !youtubeStatus && !instagramStatus) {
      const cached = loadConnectionsCache();
      const fresh = cached && (Date.now() - cached.timestamp < CONNECTIONS_CACHE_TTL);
      if (!fresh) {
        // If no fresh cache, check all platforms with slight staggering to avoid bursts
        const timers: number[] = [];
        timers.push(window.setTimeout(() => youtubeRef.current?.checkConnection?.(), 300));
        timers.push(window.setTimeout(() => twitterRef.current?.checkConnection?.(), 500));
        timers.push(window.setTimeout(() => instagramRef.current?.checkConnection?.(), 700));
        timers.push(window.setTimeout(() => linkedinRef.current?.checkConnection?.(), 900));
        timers.push(window.setTimeout(() => facebookRef.current?.checkConnection?.(), 1100));
        return () => timers.forEach((id) => clearTimeout(id));
      }
    }
  }, [tokenPresent, searchParams]);

  // Re-validate connections when window regains focus (lightweight and throttled by session flags in components)
  useEffect(() => {
    const onFocus = () => {
      const timers: number[] = [];
      timers.push(window.setTimeout(() => youtubeRef.current?.checkConnection?.(), 200));
      timers.push(window.setTimeout(() => twitterRef.current?.checkConnection?.(), 300));
      timers.push(window.setTimeout(() => instagramRef.current?.checkConnection?.(), 400));
      timers.push(window.setTimeout(() => linkedinRef.current?.checkConnection?.(), 500));
      timers.push(window.setTimeout(() => facebookRef.current?.checkConnection?.(), 600));
      return () => timers.forEach((id) => clearTimeout(id));
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Visibility-aware background refresh with in-flight guard (every 5 minutes while visible)
  useEffect(() => {
    let timerId: number | null = null;
    let inFlight = false;

    const tick = () => {
      if (inFlight || document.hidden) {
        schedule();
        return;
      }
      inFlight = true;
      // Stagger calls lightly to avoid bursts
      youtubeRef.current?.checkConnection?.();
      setTimeout(() => twitterRef.current?.checkConnection?.(), 200);
      setTimeout(() => instagramRef.current?.checkConnection?.(), 400);
      setTimeout(() => linkedinRef.current?.checkConnection?.(), 600);
      setTimeout(() => facebookRef.current?.checkConnection?.(), 800);
      // Release lock after a short window; integration components debounce internally
      setTimeout(() => {
        inFlight = false;
        schedule();
      }, 1500);
    };

    const schedule = () => {
      if (timerId) window.clearTimeout(timerId);
      // 5 minutes cadence when visible; if hidden, wait until visible
      const delay = document.hidden ? 60 * 60 * 1000 : 5 * 60 * 1000;
      timerId = window.setTimeout(tick, delay);
    };

    const onVisibility = () => {
      if (!document.hidden) {
        // immediate check when returning visible
        if (timerId) window.clearTimeout(timerId);
        timerId = window.setTimeout(tick, 250);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    // kick off
    schedule();
    return () => {
      if (timerId) window.clearTimeout(timerId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  if (loading) {
    return (
      <CreatorLayout title="Settings" subtitle="Manage your account settings and integrations">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading profile...</span>
        </div>
      </CreatorLayout>
    );
  }

  if (!user) {
    return (
      <CreatorLayout title="Settings" subtitle="Manage your account settings and integrations">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">Failed to load profile</div>
          <button 
            onClick={loadProfile}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout 
      title="Settings" 
      subtitle="Manage your account settings and integrations"
    >
      {/* Notification Banner */}
      {notification.type && (
        <div className={`mb-6 p-4 rounded-2xl backdrop-blur-sm border ${
          notification.type === 'success' 
            ? 'bg-green-50/80 border-green-200/50 text-green-800 shadow-sm' 
            : notification.type === 'error'
            ? 'bg-red-50/80 border-red-200/50 text-red-800 shadow-sm'
            : 'bg-yellow-50/80 border-yellow-200/50 text-yellow-800 shadow-sm'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                notification.type === 'success' ? 'bg-green-100' : 
                notification.type === 'error' ? 'bg-red-100' : 'bg-yellow-100'
              }`}>
                <span className={`text-sm ${
                  notification.type === 'success' ? 'text-green-600' : 
                  notification.type === 'error' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {notification.type === 'success' ? '✓' : '!'}
                </span>
              </div>
              <span className="font-semibold">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification({ type: null, message: '' })}
              className="text-gray-800 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Auth Token Banner */}
      {!tokenPresent && (
        <div className="mb-6 p-4 rounded-sm bg-yellow-50/80 backdrop-blur-sm border border-yellow-200/50 text-yellow-900 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm">!</span>
              </div>
              <span className="font-semibold">You are not logged in. Please log in to connect accounts.</span>
            </div>
            <button
              onClick={() => {
                try {
                  const { cookieAuthUtils } = require('@/lib/cookieAuth');
                  const isAuthenticated = cookieAuthUtils.isAuthenticated();
                  setTokenPresent(isAuthenticated);
                } catch {}
              }}
              className="text-yellow-700 hover:text-yellow-900 text-sm font-medium px-3 py-1 rounded-lg hover:bg-yellow-100/50 transition-colors"
            >
              Recheck
            </button>
          </div>
        </div>
      )}

      <div className="bg-white/80  rounded-sm hover:shadow-sm border border-gray-200/04">
        <div className="p-4 md:p-6 space-y-6 md:space-y-8">
          {/* Profile Information */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Profile Information
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Change your personal data and account credentials
            </p>

            <div className="space-y-6">
              {/* Profile Picture */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  Profile Picture
                </h3>
                <div className="pl-4 space-y-4">
                  <p className="text-xs text-gray-900">
                    Upload a profile picture to personalize your account
                  </p>

                  <div className="flex  flex-col items-center gap-4">
                  <div className="
  flex 
  justify-center sm:justify-start 
  w-full
">
  <div className="relative">
    {(() => {
      const profileAvatar = userProfileFromHook?.profile?.avatar_url;
      const userProfileAvatar = user?.profile?.avatar_url;
      const rawAvatarUrl = profileAvatar || userProfileAvatar;
      const avatarUrl = rawAvatarUrl ? getAvatarUrl(rawAvatarUrl) : null;

      const userName = userProfileFromHook?.name || user?.name || 'User';
      const firstLetter = userName.charAt(0).toUpperCase();

      if (avatarUrl) {
        return (
          <div
            className="w-20 h-20 relative rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100"
            key={`avatar-${rawAvatarUrl}`}
          >
            <Image
              src={avatarUrl}
              alt={userName}
              width={80}
              height={80}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />

            <div className="hidden absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center">
              <span className="text-white text-2xl font-semibold">
                {firstLetter}
              </span>
            </div>
          </div>
        );
      } else {
        return (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold">
            {firstLetter}
          </div>
        );
      }
    })()}
  </div>
</div>

                   <div className="
  flex flex-col gap-1 
  w-full
">

  {/* Buttons section */}
  <div
    className="
      flex flex-col sm:flex-row 
      items-center sm:items-start 
      gap-3 sm:gap-2
      w-full
    "
  >
    <label className="block w-full sm:w-auto">
      <input
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        disabled={uploadingAvatar || removingAvatar}
        className="hidden"
        id="avatar-upload"
      />
      <span className="
        inline-flex items-center justify-center gap-2
        px-4 py-2 
        bg-gradient-to-r from-blue-600 to-purple-600
        text-white rounded-sm
        hover:bg-blue-700 transition-colors
        cursor-pointer text-sm font-medium
        disabled:opacity-50 disabled:cursor-not-allowed
        w-full sm:w-auto
      ">
        {uploadingAvatar ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            {displayUser?.profile?.avatar_url ? 'Change Picture' : 'Upload Picture'}
          </>
        )}
      </span>
    </label>

    {displayUser?.profile?.avatar_url && (
      <button
        onClick={handleRemoveAvatar}
        disabled={removingAvatar || uploadingAvatar}
        className="
          inline-flex items-center justify-center gap-2
          px-4 py-2 
          bg-red-600 text-white rounded-md
          hover:bg-red-700 transition-colors
          text-sm font-medium
          disabled:opacity-50 disabled:cursor-not-allowed
          w-full sm:w-auto
        "
      >
        {removingAvatar ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Removing...
          </>
        ) : (
          <>
            <Trash2 className="w-4 h-4" />
            Remove
          </>
        )}
      </button>
    )}
  </div>

  {/* Text Note */}
  <p className="text-xs text-gray-500 text-center sm:text-left">
    JPG, PNG or GIF. Max size 5MB
  </p>
</div>

                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  Account Details
                </h3>
                <div className="pl-4 space-y-4">
                  <p className="text-xs text-gray-900">
                    Manage your basic account information
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200/04 rounded-sm focus:outline-none "
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      readOnly
                      className="w-full px-3 py-2 border border-gray-200/04 rounded-sm  cursor-not-allowed text-gray-600"
                      placeholder="Enter your email address"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email address cannot be changed. Please contact support if you need to update your email.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200/04 rounded-sm focus:outline-none "
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
                  </div>

              {/* Password Reset */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                  Password Reset
                </h3>
                <div className="pl-4 space-y-4">
                  <p className="text-xs text-gray-900">
                    Forgot your password? Request a password reset link via email verification. You'll receive an email with instructions to reset your password.
                  </p>

                  <form onSubmit={handleForgotPassword} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={forgotPasswordEmail || formData.email}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full px-3 py-2 border border-gray-200/04 rounded-sm focus:outline-none  "
                        disabled={forgotPasswordLoading}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        We'll send a password reset link to this email address
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={forgotPasswordLoading || (!forgotPasswordEmail && !formData.email)}
                      className=" bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-md  bg-gradient-to-r from-blue-600 to-purple-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {forgotPasswordLoading ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                    {forgotPasswordMessage && (
                      <div className={`p-3 rounded-md ${forgotPasswordMessage.includes('error') || forgotPasswordMessage.includes('Error') || forgotPasswordMessage.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        <p className="text-sm">{forgotPasswordMessage}</p>
                      </div>
                    )}
                  </form>
                </div>
              </div>


              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className=" bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-sm hover: bg-gradient-to-r from-blue-600 to-purple-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setProfileName('');
                    setProfileEmail('');
                    setProfilePhone('');
                    setProfileData({});
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-700 rounded-md hover:bg-gray-50 transition-colors w-full sm:w-auto text-center"
                >
                  Clear Form
                </button>
              </div>
            </div>
          </section>

          {/* Linked Accounts */}
          <section id="linked_account">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Linked Accounts</h2>
            <p className="text-sm text-gray-600 mb-6">Connect other accounts with external providers to access your content</p>
            
            <div className="space-y-4">
              <InstagramIntegrationWithSuspense ref={instagramRef} />
              <FacebookIntegrationWithSuspense ref={facebookRef} />
              <TwitterIntegrationWithSuspense ref={twitterRef} />
              <LinkedInIntegrationWithSuspense ref={linkedinRef} />
              <YouTubeIntegrationWithSuspense ref={youtubeRef} />
            </div>
          </section>

          {/* Notification Preferences */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Notification Preferences</h2>
            <p className="text-sm text-gray-600 mb-6">Choose how you&apos;d like to receive updates about your Bloocube Vision</p>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
             <div >
                  <p className="font-medium text-gray-900">Marketing Emails</p>
                  <p className="text-sm text-gray-900">Receive product news, feature updates and special offers via email</p>
                </div>
                <div>
                  <ToggleSwitch 
                  enabled={marketingEmails} 
                  onToggle={() => {
                    const next = !marketingEmails;
                    setMarketingEmails(next);
                    handlePreferenceChange('marketingEmails', next);
                  }} 
                  
                />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-900">Get email alerts about your tasks, posts and activity</p>
                </div>
                <div>
                   <ToggleSwitch 
                  enabled={emailNotifications} 
                  onToggle={() => {
                    const next = !emailNotifications;
                    setEmailNotifications(next);
                    handlePreferenceChange('emailNotifications', next);
                  }} 
                />
               </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-900">Get push notifications on your mobile device and browser</p>
                </div>
                <div>
                  <ToggleSwitch 
                  enabled={pushNotifications} 
                  onToggle={() => {
                    const next = !pushNotifications;
                    setPushNotifications(next);
                    handlePreferenceChange('pushNotifications', next);
                  }} 
                />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-900">Receive SMS reminders for upcoming posts or urgent deadlines</p>
                </div>
                <div>
                  <ToggleSwitch 
                  enabled={smsNotifications} 
                  onToggle={() => {
                    const next = !smsNotifications;
                    setSmsNotifications(next);
                    handlePreferenceChange('smsNotifications', next);
                  }} 
                />
                </div>
              </div>
            </div>
          </section>

          

          {/* Danger Zone */}
          <section>
            <h2 className="text-lg font-medium text-red-600 mb-2">Danger Zone</h2>
            <p className="text-sm text-gray-600 mb-6">Irreversible and destructive actions</p>
            
            <div className="space-y-4">
              <div className="p-4 border border-red-200 rounded-lg bg-red-50/50">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-medium text-red-900">Delete Account</h3>
                    <p className="text-sm text-red-700">Once you delete your account, there is no going back. Please be certain.</p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-sm hover:bg-red-700 transition-colors text-sm font-medium w-full sm:w-auto"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="text-red-600 mr-2" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
            </div>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. This will permanently delete your account and remove all data from our servers.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={deleteData.password}
                onChange={(e) => setDeleteData({ password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="••••••••••••"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-700 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={saving || !deleteData.password}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </CreatorLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsPageContent />
    </Suspense>
  );
}
