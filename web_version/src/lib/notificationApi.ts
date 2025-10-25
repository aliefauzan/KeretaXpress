// Notification API service
import { Notification, NotificationResponse, UnreadCountResponse } from '@/types/notification';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper function to get the auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Helper function for making API requests
async function apiRequest<T>(
  endpoint: string,
  method: string = 'GET',
  data?: any
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (method !== 'GET' && data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      response: {
        status: response.status,
        data: errorData
      }
    };
  }

  return response.status !== 204 ? await response.json() : {} as T;
}

export const notificationApi = {
  /**
   * Get user notifications with filters and pagination
   */
  getNotifications: async (params?: {
    type?: string;
    read?: boolean;
    page?: number;
    limit?: number;
  }): Promise<NotificationResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.type) queryParams.append('type', params.type);
    if (params?.read !== undefined) queryParams.append('read', String(params.read));
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    return apiRequest<NotificationResponse>(`/notifications?${queryParams.toString()}`);
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await apiRequest<UnreadCountResponse>('/notifications/unread-count');
    return response.unreadCount;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (uuid: string): Promise<Notification> => {
    const response = await apiRequest<{ notification: Notification }>(`/notifications/${uuid}/read`, 'PUT');
    return response.notification;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ count: number }> => {
    return apiRequest<{ count: number }>('/notifications/read-all', 'PUT');
  },
};

export default notificationApi;
