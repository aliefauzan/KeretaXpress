import { useState, useEffect, useRef, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface UseAdminBookingsSSEOptions {
  enableSSE?: boolean;
  autoRefresh?: boolean;
}

export function useAdminBookingsSSE(options: UseAdminBookingsSSEOptions = {}) {
  const { enableSSE = true, autoRefresh = true } = options;
  const [shouldRefresh, setShouldRefresh] = useState(0);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enableSSE || !autoRefresh) return;

    const token = localStorage.getItem('adminToken');
    if (!token) {
      console.log('No admin token found, skipping SSE connection');
      return;
    }

    // Create SSE connection
    const apiUrl = API_URL?.replace('/api', '') || 'http://localhost:3005';
    const eventSource = new EventSource(
      `${apiUrl}/api/admin/bookings/stream?token=${encodeURIComponent(token)}`
    );

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('📡 Admin bookings SSE connected - Real-time updates active');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Admin SSE event received:', data.type, data);

        setLastEvent(data);

        // Trigger refresh on booking events
        if (data.type === 'booking.created' || 
            data.type === 'booking.payment_updated' ||
            data.type === 'booking.cancelled') {
          console.log('🔄 Triggering bookings refresh due to:', data.type);
          setShouldRefresh(prev => prev + 1);
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ Admin bookings SSE error:', error);
      eventSource.close();
      
      // Reconnect after 3 seconds
      setTimeout(() => {
        console.log('🔄 Reconnecting admin bookings SSE...');
        setShouldRefresh(prev => prev + 1);
      }, 3000);
    };

    // Cleanup on unmount
    return () => {
      console.log('📡 Closing admin bookings SSE connection');
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [enableSSE, autoRefresh, shouldRefresh]);

  const triggerRefresh = useCallback(() => {
    setShouldRefresh(prev => prev + 1);
  }, []);

  return {
    shouldRefresh,
    lastEvent,
    triggerRefresh,
    isConnected: eventSourceRef.current !== null
  };
}
