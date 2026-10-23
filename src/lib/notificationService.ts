// src/lib/notificationService.ts
import { apiRequest } from '@/lib/apiClient';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'campaign_created' | 'bid_received' | 'bid_accepted' | 'bid_rejected' | 'campaign_deadline' | 'payment_received' | 'analytics_update' | 'ai_suggestion' | 'system_alert' | 'user_activity';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  link?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  data?: any;
  relatedResource?: {
    type: 'campaign' | 'bid' | 'user' | 'post' | 'analytics';
    id: string;
  };
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
    style: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  }>;
  expiresAt?: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    unreadCount: number;
  };
}

export interface NotificationUnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

export interface NotificationMarkReadResponse {
  success: boolean;
  data: {
    notification: Notification;
  };
}

export interface NotificationMarkAllReadResponse {
  success: boolean;
  data: {
    modifiedCount: number;
  };
}

export interface NotificationDeleteResponse {
  success: boolean;
  data: {
    id: string;
  };
}

class NotificationService {
  /**
   * Get notifications with pagination and filtering
   */
  async getNotifications(params: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: string;
    priority?: string;
  } = {}): Promise<NotificationListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.unreadOnly !== undefined) searchParams.set('unreadOnly', String(params.unreadOnly));
    if (params.type) searchParams.set('type', params.type);
    if (params.priority) searchParams.set('priority', params.priority);
    
    const queryString = searchParams.toString();
    const url = `/api/notifications${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<NotificationListResponse>(url);
  }

  /**
   * Get unread notification count with custom retry strategy for rate limiting
   */
  async getUnreadCount(): Promise<NotificationUnreadCountResponse> {
    // Use higher retry count and longer backoff for unread count requests
    return apiRequest<NotificationUnreadCountResponse>('/api/notifications/unread-count', {}, 3);
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<NotificationMarkReadResponse> {
    return apiRequest<NotificationMarkReadResponse>(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<NotificationMarkAllReadResponse> {
    return apiRequest<NotificationMarkAllReadResponse>('/api/notifications/mark-all-read', {
      method: 'PATCH'
    });
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<NotificationDeleteResponse> {
    return apiRequest<NotificationDeleteResponse>(`/api/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get notification statistics (admin only)
   */
  async getNotificationStats(): Promise<{ success: boolean; data: any }> {
    return apiRequest<{ success: boolean; data: any }>('/api/notifications/stats');
  }
}

export const notificationService = new NotificationService();
