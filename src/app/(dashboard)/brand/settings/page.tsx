"use client";
import { useState, useEffect } from 'react';
import { 
  UserIcon, 
  BuildingOfficeIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  CreditCardIcon,
  KeyIcon,
  TrashIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { profileApi, type UserProfile } from '@/lib/profile';

export default function BrandSettingsPage() {
  const { user, isLoading } = useAuth();
  const { profile, loading: profileLoading, refreshProfile } = useUserProfile();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    bio: '',
    location: '',
    address: '',
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: true
    }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'company', name: 'Company', icon: BuildingOfficeIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'billing', name: 'Billing', icon: CreditCardIcon }
  ];

  // Load profile data when component mounts or profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.profile?.phone || '',
        website: profile.profile?.website || '',
        bio: profile.profile?.bio || '',
        location: profile.profile?.location || '',
        address: profile.profile?.address || '',
        notifications: {
          email: profile.profile?.preferences?.emailNotifications ?? true,
          push: profile.profile?.preferences?.pushNotifications ?? true,
          sms: profile.profile?.preferences?.smsNotifications ?? false,
          marketing: profile.profile?.preferences?.marketingEmails ?? true
        }
      });
    }
  }, [profile]);

  // Save profile changes
  const saveProfile = async () => {
    if (!profile) return;
    
    setSaving(true);
    setNotification(null);
    
    try {
      // Build profile object, only including fields that have values
      const profileData: any = {
        bio: formData.bio,
        phone: formData.phone,
        website: formData.website,
        preferences: {
          emailNotifications: formData.notifications.email,
          pushNotifications: formData.notifications.push,
          smsNotifications: formData.notifications.sms,
          marketingEmails: formData.notifications.marketing
        }
      };

      // Only add location and address if they have values
      if (formData.location && formData.location.trim()) {
        profileData.location = formData.location;
      }
      if (formData.address && formData.address.trim()) {
        profileData.address = formData.address;
      }

      const updateData = {
        name: formData.name,
        profile: profileData
      };

      const response = await profileApi.updateProfile(updateData);
      
      if (response.success) {
        setNotification({
          type: 'success',
          message: 'Your profile has been updated successfully! All changes have been saved.'
        });
        await refreshProfile();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (error.message) {
        if (error.message.includes('validation')) {
          errorMessage = 'Please check your input and try again. Some fields may have invalid values.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (error.message.includes('forbidden') || error.message.includes('403')) {
          errorMessage = 'You do not have permission to update this profile.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setNotification({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete account
  const deleteAccount = async () => {
    try {
      setDeleting(true);
      const response = await profileApi.deleteAccount({ password: deletePassword });
      if (response.success) {
        setNotification({ type: 'success', message: 'Account deleted successfully. You will be redirected to login.' });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to delete account' });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDeletePassword('');
    }
  };

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'brand') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Brand access required</h1>
          <p className="text-sm text-gray-600 mb-4">Please sign in with a brand account to access settings.</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const renderProfileTab = () => (
    <div className="space-y-2">
      <div className="">
        <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <UserIcon className="w-6 h-6 text-white" />
          </div>
          Profile Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">Name</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full text-gray-900 px-4 py-3 border border-gray-200/04 rounded-sm  focus:outline-none transition-all duration-200 bg-white hover:shadow-sm"
              placeholder="Enter your name"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">Email</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full text-gray-900 px-4 py-3 border border-gray-200/04 rounded-sm  focus:outline-none transition-all duration-200 bg-white hover:shadow-sm"
              placeholder="Enter your email"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-3">Phone</label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
  className="w-full text-gray-900 px-4 py-3 border border-gray-200/04 rounded-sm  focus:outline-none transition-all duration-200 bg-white hover:shadow-sm"
              placeholder="Enter your phone number"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="website" className="block text-sm font-semibold text-gray-700 mb-3">Website</label>
            <input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
            className="w-full text-gray-900 px-4 py-3 border border-gray-200/04 rounded-sm  focus:outline-none transition-all duration-200 bg-white hover:shadow-sm"
              placeholder="Enter your website URL"
            />
          </div>
        </div>
        <div className="mt-8 space-y-2">
          <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 mb-3">Bio</label>
          <textarea
            id="bio"
            rows={4}
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
         className="w-full text-gray-900 px-4 py-3 border border-gray-200/04 rounded-sm  focus:outline-none transition-all duration-200 bg-white hover:shadow-sm"
            placeholder="Tell us about yourself..."
          />
        </div>
      </div>
    </div>
  );

  const renderCompanyTab = () => (
    <div className="space-y-8">
      <div className="">
        <h3 className="text-xl lg:text-2xl  font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-sm">
            <BuildingOfficeIcon className="w-6 h-6 text-white" />
          </div>
          Company Details
        </h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-3">Location</label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full text-gray-900 px-4 py-3 border border-gray-200/04 rounded-sm focus:outline-none transition-all duration-200 bg-white hover:shadow-sm"
              placeholder="Enter your city, state, country..."
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-3">Company Address</label>
            <textarea
              id="address"
              rows={4}
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full text-gray-900 px-4 py-3 border border-gray-200 rounded-sm focus:outline-none transition-all duration-200 bg-white  hover:shadow-sm resize-none"
              placeholder="Enter your complete company address..."
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-8">
      <div className="">
        <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-sm">
            <BellIcon className="w-6 h-6 text-white" />
          </div>
          Notification Preferences
        </h3>
        <div className="space-y-6">
          {Object.entries(formData.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-6 bg-white rounded-sm hover:shadow-sm border border-gray-200/04  transition-all duration-200">
              <div className="flex-1 ">
                <h4 className="font-semibold text-gray-900 capitalize text-md lg:text-lg mb-2">{key} Notifications</h4>
                <p className="text-sm text-gray-600 ">
                  {key === 'email' && 'Receive notifications via email'}
                  {key === 'push' && 'Receive push notifications in browser'}
                  {key === 'sms' && 'Receive SMS notifications'}
                  {key === 'marketing' && 'Receive marketing and promotional emails'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleNotificationChange(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none  rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-600"></div>
                <span className="sr-only">Toggle {key} notifications</span>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-8">
      <div className="">
        <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-sm">
            <ShieldCheckIcon className="w-6 h-6 text-white" />
          </div>
          Security Settings
        </h3>
       <div className="space-y-6 ">
  <div className="p-6 bg-white rounded-sm hover:shadow-sm border border-gray-200/40 transition-all duration-200">
    
    <div className="flex flex-col lg:flex-row items-center lg:items-start lg:justify-between gap-6">

      {/* LEFT CONTENT */}
      <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-3 max-w-sm">

        <div className="p-3 bg-blue-100 rounded-sm">
          <KeyIcon className="w-6 h-6 text-blue-600" />
        </div>

        <h4 className="font-semibold text-gray-900 text-lg">
          Change Password
        </h4>

        <p className="text-sm text-gray-600">
          Update your account password to keep your account secure
        </p>

        <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto">
          Change Password
        </button>

      </div>

    </div>

  </div>
</div>

      </div>
    </div>
  );

  const renderBillingTab = () => (
    <div className="space-y-8">
      <div className="">
        <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600  rounded-sm">
            <CreditCardIcon className="w-6 h-6 text-white" />
          </div>
          Billing Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 bg-white rounded-sm hover:shadow-sm border border-gray-200/04 transition-all duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-sm">
                <CreditCardIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 text-lg">Current Plan</h4>
            </div>
            <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Pro Plan</p>
            <p className="text-md text-gray-600">₹2,999/month</p>
          </div>
            <div className="p-6 bg-white rounded-sm hover:shadow-sm border border-gray-200/04 transition-all duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-100 rounded-sm">
                <CreditCardIcon className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 text-lg">Next Billing</h4>
            </div>
            <p className="text-xl font-bold text-gray-900 mb-2">Dec 15, 2024</p>
            <p className="text-md text-gray-600">Auto-renewal enabled</p>
          </div>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-sm hover: bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105">
            Update Payment Method
          </button>
          <button className="flex-1 px-6 py-3 border border-gray-200/04 text-gray-700 rounded-sm hover:bg-gray-50  transition-all duration-200 font-medium">
            Download Invoice
          </button>
        </div>
      </div>
    </div>
  );


  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'company':
        return renderCompanyTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'security':
        return renderSecurityTab();
      case 'billing':
        return renderBillingTab();
      default:
        return renderProfileTab();
    }
  };

  return (
    <div className="max-w-6xl mx-auto ">
      {/* Enhanced Notification Banner */}
      {notification && (
        <div className={`mb-6  rounded-sm  border flex items-center gap-4 animate-in slide-in-from-top-2 duration-300 ${
          notification.type === 'success' 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-800' 
            : notification.type === 'error'
            ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300 text-red-800'
            : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300 text-blue-800'
        }`}>
          <div className={`p-2 rounded-sm ${
            notification.type === 'success' 
              ? 'bg-green-100' 
              : notification.type === 'error'
              ? 'bg-red-100'
              : 'bg-blue-100'
          }`}>
            {notification.type === 'success' ? (
              <CheckIcon className="w-6 h-6 text-green-600" />
            ) : notification.type === 'error' ? (
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            ) : (
              <ExclamationTriangleIcon className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">
              {notification.type === 'success' ? 'Success!' : notification.type === 'error' ? 'Error!' : 'Info'}
            </h3>
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className={`p-2 rounded-full hover:bg-opacity-20 transition-colors ${
              notification.type === 'success' 
                ? 'hover:bg-green-600' 
                : notification.type === 'error'
                ? 'hover:bg-red-600'
                : 'hover:bg-blue-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="  text-gray-800 mt-4">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-800 text-lg">Manage your brand account settings and preferences</p>
        </div>
      </div>

      <div className="bg-white rounded-sm hover:shadow-sm border border-gray-200/04 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar */}
          <div className="lg:w-80 bg-gradient-to-b from-gray-50 to-gray-100 border-b lg:border-b-0 lg:border-r border-gray-200">
            <nav className="p-6 space-y-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-md'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {renderTabContent()}
            
            {/* Save Button */}
            <div className="mt-10 pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-start gap-4">
               
                  <button 
                    onClick={saveProfile}
                    disabled={saving}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-sm hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4" />
                    Save Changes
                      </>
                    )}
                </button>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-sm hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto justify-center"
                  disabled={saving}
                  onClick={() => setShowDeleteModal(true)}
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete Account
                </button>
                
                 <button 
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50  transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    disabled={saving}
                    onClick={() => {
                      // Reset form to original values
                      if (profile) {
                        setFormData({
                          name: profile.name || '',
                          email: profile.email || '',
                          phone: profile.profile?.phone || '',
                          website: profile.profile?.website || '',
                          bio: profile.profile?.bio || '',
                          location: profile.profile?.location || '',
                          address: profile.profile?.address || '',
                          notifications: {
                            email: profile.profile?.preferences?.emailNotifications ?? true,
                            push: profile.profile?.preferences?.pushNotifications ?? true,
                            sms: profile.profile?.preferences?.smsNotifications ?? false,
                            marketing: profile.profile?.preferences?.marketingEmails ?? true
                          }
                        });
                        setNotification(null);
                      }
                    }}
                  >
                    Reset
                  </button>
              </div>
              
              {/* Status indicator */}
              {saving && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-blue-800 font-medium">Updating your profile...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="text-red-600 mr-2 w-6 h-6" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
            </div>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. This will permanently deactivate your account.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="••••••••••••"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); }}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleting || !deletePassword}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


