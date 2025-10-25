import { useState, useEffect, useRef, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface UseBookingHistorySSEOptions {
  enableSSE?: boolean;
  autoRefresh?: boolean;
}

export function useBookingHistorySSE(options: UseBookingHistorySSEOptions = {}) {
  const { enableSSE = true, autoRefresh = true } = options;
  const [shouldRefresh, setShouldRefresh] = useState(0);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enableSSE || !autoRefresh) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No user token found, skipping SSE connection');
      return;
    }

    // Create SSE connection
    const apiUrl = API_URL?.replace('/api', '') || 'http://localhost:3005';
    const eventSource = new EventSource(
      `${apiUrl}/api/bookings/stream?token=${encodeURIComponent(token)}`
    );

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('📡 Booking history SSE connected - Real-time updates active');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Booking SSE event received:', data.type, data);

        setLastEvent(data);

        // Trigger refresh on booking events
        if (data.type === 'booking.payment_confirmed' || 
            data.type === 'booking.cancelled' ||
            data.type === 'booking.status_updated') {
          console.log('🔄 Triggering booking history refresh due to:', data.type);
          setShouldRefresh(prev => prev + 1);
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ Booking history SSE error:', error);
      eventSource.close();
      
      // Reconnect after 3 seconds
      setTimeout(() => {
        console.log('🔄 Reconnecting booking history SSE...');
        setShouldRefresh(prev => prev + 1);
      }, 3000);
    };

    // Cleanup on unmount
    return () => {
      console.log('📡 Closing booking history SSE connection');
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
