import { useState, useEffect, useRef } from 'react';

interface UseMaintenanceStreamOptions {
  enableSSE?: boolean;
  autoRefresh?: boolean;
  pollingInterval?: number; // milliseconds
}

export function useMaintenanceStream(options: UseMaintenanceStreamOptions = {}) {
  const { 
    enableSSE = true, 
    autoRefresh = true,
    pollingInterval = 5000 // Poll every 5 seconds
  } = options;
  
  const [shouldRefresh, setShouldRefresh] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    if (!enableSSE || !autoRefresh) return;

    const url = `${process.env.NEXT_PUBLIC_API_URL}/maintenance/stream`;
    
    try {
      const eventSource = new EventSource(url);

      eventSource.onopen = () => {
        console.log('✅ Connected to maintenance stream');
        isConnectedRef.current = true;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Only trigger refresh on actual maintenance events, not heartbeats or connected messages
          if (data.type === 'maintenance_created' || 
              data.type === 'maintenance_cancelled' || 
              data.type === 'maintenance_updated') {
            console.log('🔄 Maintenance event received:', data.type);
            setShouldRefresh(prev => prev + 1);
          }
        } catch (error) {
          console.error('Error parsing maintenance event:', error);
        }
      };

      eventSource.onerror = () => {
        console.log('❌ Maintenance stream disconnected');
        isConnectedRef.current = false;
        eventSource.close();
      };

      eventSourceRef.current = eventSource;

      return () => {
        console.log('🔌 Closing maintenance stream');
        eventSource.close();
        isConnectedRef.current = false;
      };
    } catch (error) {
      console.error('Failed to connect to maintenance stream:', error);
    }
  }, [enableSSE, autoRefresh]);

  return { 
    shouldRefresh,
    isConnected: isConnectedRef.current
  };
}
