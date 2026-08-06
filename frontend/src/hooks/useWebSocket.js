import { useEffect, useCallback, useRef } from 'react';
import { ws } from '../services/api.js';

export function useWebSocket(channel, onEvent) {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    ws.connect();
    if (channel) ws.subscribe(channel);

    const unsubMessage = ws.on('message', (data) => {
      if (!channel || data.channel === channel) callbackRef.current?.(data);
    });

    const unsubNotification = ws.on('notification', (data) => callbackRef.current?.(data));

    return () => {
      unsubMessage();
      unsubNotification();
      if (channel) ws.unsubscribe(channel);
    };
  }, [channel]);

  const send = useCallback((data) => ws.send(data), []);
  const isConnected = ws.isConnected;

  return { send, isConnected };
}

export default useWebSocket;
