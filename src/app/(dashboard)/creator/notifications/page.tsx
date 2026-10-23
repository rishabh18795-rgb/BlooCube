'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Check, 
  Trash2, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  Filter,
  Search,
  Clock
} from 'lucide-react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import CreatorLayout from '@/Components/Creater/CreatorLayout';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { CheckIcon } from 'lucide-react';
import { ChevronDownIcon } from 'lucide-react';
export default function CreatorNotificationsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchTerm, setSearchTerm] = useState('');
   const [selectedPlatform, setSelectedPlatform] = useState('all');
  
  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false);
  const platformOptions = [
    { value: 'all', label: 'All ' },
    { value: 'any', label: 'Any' },
    { value: 'none', label: 'None' },
    
  ];

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    hasMore,
    loadMore
  } = useNotifications({ 
    unreadOnly: filter === 'unread',
    autoRefresh: true,
    refreshInterval: 30000
  });

  const getTypeIconComponent = (type: string) => {
    switch (type) {
      case 'bid_accepted':
      case 'payment_received':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'campaign_deadline':
      case 'system_alert':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'bid_rejected':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'bid_received':
      case 'campaign_created':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'analytics_update':
        return <CheckCircle className="w-5 h-5 text-purple-600" />;
      case 'ai_suggestion':
        return <CheckCircle className="w-5 h-5 text-indigo-600" />;
      case 'user_activity':
        return <Info className="w-5 h-5 text-gray-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🔵';
      case 'low':
        return '⚪';
      default:
        return '⚪';
    }
  };

  const formatTimeAgo = (createdAt: string) => {
    const now = new Date();
    const notificationDate = new Date(createdAt);
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return notificationDate.toLocaleDateString();
  };

  const handleRefresh = async () => {
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.isRead) || 
      (filter === 'read' && notification.isRead);
    
    const matchesSearch = searchTerm === '' || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (isLoading) {
    return (
      <CreatorLayout 
        title="Notifications" 
        subtitle="Stay updated with your latest activities and important updates"
      >
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </CreatorLayout>
    );
  }

  if (!user || user.role !== 'creator') {
    return (
      <CreatorLayout 
        title="Notifications" 
        subtitle="Stay updated with your latest activities and important updates"
      >
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <h1 className="text-lg font-semibold text-gray-900 mb-2">Creator access required</h1>
            <p className="text-sm text-gray-600 mb-4">Please sign in with a creator account to view notifications.</p>
          </div>
        </div>
      </CreatorLayout>
    );
  }

  return (
    <CreatorLayout 
      title="Notifications" 
      subtitle="Stay updated with your latest activities and important updates"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80  rounded-sm  mb-6 ">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-sm">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600">
                  {unreadCount > 0 
                    ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                    : 'All caught up!'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto sm:justify-end">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 w-full sm:w-auto justify-center"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg  focus:outline-none"
              />
            </div>
            
            
              
            <div className="relative" data-dropdown>
                <button
                  type="button"
             className="w-full inline-flex items-center gap-2 px-4 py-2 border border-gray-200/04 rounded-sm focus:outline-none transition-colors text-left"

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
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading && (
            <div className="bg-white/80 backdrop-blur-sm rounded-sm p-8 border border-gray-200/04 hover:shadow-sm">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                <span className="ml-3 text-gray-600">Loading notifications...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm rounded-sm p-6 border border-red-200/50 hovershadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm">!</span>
                </div>
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            </div>
          )}

          {!loading && !error && filteredNotifications.length === 0 && (
            <div className="bg-white/80  rounded-sm p-8 border border-gray-200/04 hover:shadow-sm text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'You\'re all caught up! New notifications will appear here.'
                }
              </p>
            </div>
          )}

          {!loading && !error && filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => {
                if (!notification.isRead) markAsRead(notification._id);
                if (notification.link) router.push(notification.link);
              }}
              className={`bg-white/80 backdrop-blur-sm rounded-sm p-6 border border-gray-200/50 hover:shadow-sm  transition-all duration-200 ${
                !notification.isRead ? 'ring-2 ring-blue-100 bg-blue-50/30' : ''
              } ${notification.link ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-start space-x-4">
                {/* Type Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getTypeIconComponent(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {notification.title}
                      </h3>
                      <p className="text-gray-600 mb-3 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                    
                    {/* Priority Badge */}
                    <div className={`ml-4 px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(notification.priority)} shrink-0`}> 
                      {getPriorityIcon(notification.priority)} {notification.priority}
                    </div>
                  </div>

                  {/* Time and Actions */}
                  <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      {!notification.isRead && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 w-full sm:w-auto sm:justify-end">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsRead(notification._id); }}
                          className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors duration-200 flex items-center space-x-1 w-full sm:w-auto justify-center"
                        >
                          <Check className="w-4 h-4" />
                          <span>Mark read</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notification._id); }}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200 flex items-center space-x-1 w-full sm:w-auto justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {notification.actions && notification.actions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        {notification.actions.map((action, index) => (
                          <a
                            key={index}
                            href={action.url}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                              action.style === 'primary' 
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                : action.style === 'success'
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : action.style === 'warning'
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : action.style === 'danger'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {action.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Load More Button */}
        {hasMore && (
          <div className="text-center pt-6">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
        </div>
        </div>
    </CreatorLayout>
  );
}
