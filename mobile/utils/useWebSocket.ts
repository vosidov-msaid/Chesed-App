import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';

const WS_URL = process.env.EXPO_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:8000';

export interface WebSocketMessage {
  type: 'message_created' | 'message_updated' | 'message_deleted';
  data: any;
}

export const useWebSocket = () => {
  const { user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;

  const connect = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const token = await useAuthStore.getState().getCurrentUser;
      const authStore = useAuthStore.getState();
      const tokenStored = await (window as any).SecureStore?.getItemAsync?.('chesed_access_token') ||
                          await (window as any).AsyncStorage?.getItem?.('chesed_access_token');

      if (!tokenStored) {
        console.warn('No token available for WebSocket connection');
        return;
      }

      const wsUrl = `${WS_URL}/ws/messages/${user.id}?token=${tokenStored}`;
      console.log('🔌 Connecting to WebSocket:', wsUrl.replace(tokenStored, '****'));

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message:', message.type);
          setMessages((prev) => [...prev, message]);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      wsRef.current.onerror = (event) => {
        const errorMsg = 'WebSocket error occurred';
        console.error('❌ WebSocket error:', errorMsg);
        setError(errorMsg);
        setIsConnected(false);
      };

      wsRef.current.onclose = () => {
        console.log('⚠️ WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Attempting to reconnect... (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY);
        }
      };
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      setError(String(err));
    }
  }, [user?.id]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    messages,
    error,
    sendMessage,
    disconnect,
  };
};
