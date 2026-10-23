"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BellIcon, 
  CheckIcon, 
  XMarkIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { type Notification } from '@/lib/notificationService';

export default function BrandNotificationsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  
  const {
    notifications,
    loading: notificationsLoading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    hasMore,
    loadMore
  } = useNotifications({
    unreadOnly: filter === 'unread',
    type: typeFilter || undefined,
    priority: priorityFilter || undefined,
    autoRefresh: true,
    refreshInterval: 30000
  });

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
          <p className="text-sm text-gray-600 mb-4">Please sign in with a brand account to view notifications.</p>
        </div>
      </div>
    );
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'bid_accepted':
      case 'payment_received':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'campaign_deadline':
      case 'system_alert':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case 'bid_rejected':
        return <XMarkIcon className="w-5 h-5 text-red-600" />;
      case 'bid_received':
      case 'campaign_created':
        return <InformationCircleIcon className="w-5 h-5 text-blue-600" />;
      case 'analytics_update':
        return <CheckCircleIcon className="w-5 h-5 text-purple-600" />;
      case 'ai_suggestion':
        return <CheckCircleIcon className="w-5 h-5 text-indigo-600" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBgColor = (type: string, priority: string) => {
    const priorityColors = {
      urgent: 'bg-red-50 border-red-300',
      high: 'bg-orange-50 border-orange-200',
      medium: 'bg-blue-50 border-blue-200',
      low: 'bg-gray-50 border-gray-200'
    };

    const typeColors = {
      bid_accepted: 'bg-green-50 border-green-200',
      payment_received: 'bg-green-50 border-green-200',
      campaign_deadline: 'bg-yellow-50 border-yellow-200',
      system_alert: 'bg-red-50 border-red-200',
      bid_rejected: 'bg-red-50 border-red-200',
      bid_received: 'bg-blue-50 border-blue-200',
      campaign_created: 'bg-blue-50 border-blue-200',
      analytics_update: 'bg-purple-50 border-purple-200',
      ai_suggestion: 'bg-indigo-50 border-indigo-200'
    };

    return typeColors[type as keyof typeof typeColors] || priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-50 border-gray-200';
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

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-4">
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">Stay updated with your campaign activities</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto sm:justify-end">
            <button
              onClick={handleRefresh}
              disabled={notificationsLoading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-sm transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-5 h-5 ${notificationsLoading ? 'animate-spin' : ''}`} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={notificationsLoading}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
            <div className="relative">
              <BellIcon className="w-6 h-6 text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-sm border border-gray-200/04 w-fit">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'read', label: 'Read', count: notifications.length - unreadCount }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              disabled={notificationsLoading}
              className={`px-4 py-2 text-sm font-medium rounded-sm transition-colors disabled:opacity-50 ${
                filter === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notificationsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading notifications</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : notifications.length > 0 ? (
          notifications.map(notification => (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                notification.isRead
                  ? 'bg-white border-gray-200'
                  : `${getNotificationBgColor(notification.type, notification.priority)} border-l-4`
              } ${notification.link ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1">
                      <h3 className={`font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      <p className={`text-sm mt-1 ${notification.isRead ? 'text-gray-500' : 'text-gray-600'}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        {!notification.isRead && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                        {notification.priority === 'urgent' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4 flex-wrap justify-end">
                      {notification.actions && notification.actions.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {notification.actions.map((action, index) => (
                            <a
                              key={index}
                              href={action.url || '#'}
                              className={`text-sm font-medium px-3 py-1 rounded-md transition-colors ${
                                action.style === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                                action.style === 'success' ? 'bg-green-600 text-white hover:bg-green-700' :
                                action.style === 'warning' ? 'bg-yellow-600 text-white hover:bg-yellow-700' :
                                action.style === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
                                'bg-gray-600 text-white hover:bg-gray-700'
                              }`}
                            >
                              {action.label}
                            </a>
                          ))}
                        </div>
                      )}
                      
                      {!notification.isRead && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification._id); }}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Mark as read"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteNotification(notification._id); }}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete notification"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <BellIcon className="w-12 h-12" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              {(() => {
                if (filter === 'unread') return 'No unread notifications';
                if (filter === 'read') return 'No read notifications';
                return 'No notifications';
              })()}
            </h3>
            <p className="text-sm text-gray-500">
              {(() => {
                if (filter === 'unread') return 'You\'re all caught up!';
                if (filter === 'read') return 'No notifications have been read yet';
                return 'You\'ll see notifications here when they arrive';
              })()}
            </p>
          </div>
        )}
        
        {/* Load More Button */}
        {hasMore && (
          <div className="text-center pt-6">
            <button
              onClick={loadMore}
              disabled={notificationsLoading}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {notificationsLoading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="mt-12 bg-white rounded-sm p-6 hover:shadow-sm border border-gray-200/04">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="sr-only">Toggle email notifications</span>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Push Notifications</h4>
                <p className="text-sm text-gray-500">Receive browser push notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="sr-only">Toggle email notifications</span>
              </label>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                <p className="text-sm text-gray-500">Receive SMS for urgent updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="sr-only">Toggle SMS notifications</span>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Marketing Updates</h4>
                <p className="text-sm text-gray-500">Receive promotional content</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="sr-only">Toggle email notifications</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

