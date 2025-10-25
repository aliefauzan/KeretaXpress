// Custom hook for notification management
import { useState, useEffect, useCallback, useRef } from 'react';
import { Notification } from '@/types/notification';
import notificationApi from '@/lib/notificationApi';
import { useAuth } from '@/contexts/AuthContext';

export const useNotifications = (enableSSE = true, pollingInterval = 60000) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await notificationApi.getNotifications({ limit: 20 });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch unread count only
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (err: any) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [user]);

  // Mark as read
  const markAsRead = useCallback(async (uuid: string) => {
    try {
      await notificationApi.markAsRead(uuid);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.uuid === uuid ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Failed to mark as read:', err);
      throw err;
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
      throw err;
    }
  }, []);

  // 🔔 SSE Connection for real-time notifications
  useEffect(() => {
    if (!user || !enableSSE) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '');
    const eventSource = new EventSource(
      `${apiUrl}/api/notifications/stream?token=${encodeURIComponent(token)}`
    );

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('📡 SSE connected - Real-time notifications active');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
          console.log('✅ SSE connection established');
        } else if (data.type === 'notification') {
          // New notification received
          console.log('🔔 New notification:', data.notification);
          
          // Add to notifications list
          setNotifications(prev => [data.notification, ...prev]);
          
          // Update unread count
          setUnreadCount(prev => prev + 1);
        } else if (data.type === 'unread_count') {
          // Unread count update
          setUnreadCount(data.unreadCount);
        }
      } catch (err) {
        console.error('SSE message parse error:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('❌ SSE connection error:', err);
      console.log('🔄 Will attempt to reconnect...');
      eventSource.close();
    };

    // Cleanup on unmount
    return () => {
      console.log('📡 SSE disconnected');
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [user, enableSSE]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Fallback polling (only if SSE is disabled or fails)
  useEffect(() => {
    if (!user || enableSSE) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [user, enableSSE, pollingInterval, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
};

export default useNotifications;
