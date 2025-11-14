import { useEffect, useRef, useCallback } from 'react';

type MessageHandler = (data: any) => void;

export function useWebSocket(
  onNoticesUpdate?: MessageHandler,
  onAttendanceUpdate?: MessageHandler,
  onQuizzesUpdate?: MessageHandler,
  onTimetableUpdate?: MessageHandler
) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host.replace(':5173', ':5004')}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        // Optionally send a subscription message
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({ type: 'subscribe', role: 'student' }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 WebSocket message:', message);

          if (message.type === 'notice_created' || message.type === 'notice_updated') {
            onNoticesUpdate?.(message.data);
          } else if (message.type === 'attendance_updated' || message.type === 'attendance_marked') {
            onAttendanceUpdate?.(message.data);
          } else if (message.type === 'quiz_created' || message.type === 'quiz_updated' || message.type === 'quiz_submitted') {
            onQuizzesUpdate?.(message.data);
          } else if (message.type === 'timetable_updated') {
            onTimetableUpdate?.(message.data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
      };

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
    }
  }, [onNoticesUpdate, onAttendanceUpdate, onQuizzesUpdate, onTimetableUpdate]);

  return {
    send: useCallback((message: any) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
      }
    }, []),
    ws: wsRef.current
  };
}
