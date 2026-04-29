import { useEffect, useCallback } from 'react';
import examService from '../services/examService';

export const useHeartbeat = (attemptId: number | null, intervalMs: number = 30000) => {
    const sendHeartbeat = useCallback(async (status: 'active' | 'suspended' | 'disconnected' = 'active') => {
        if (!attemptId) return;

        const result = await examService.sendHeartbeat(attemptId, status);

        if (!result.success) {
            console.warn('[Heartbeat] Failed to send heartbeat', result.error);
            // Fallback: log to local storage if server is unreachable
            const pendingLogs = JSON.parse(localStorage.getItem('pending_heartbeats') || '[]');
            pendingLogs.push({ attemptId, status, timestamp: new Date().toISOString() });
            localStorage.setItem('pending_heartbeats', JSON.stringify(pendingLogs));
        }
    }, [attemptId]);

    useEffect(() => {
        if (!attemptId) return;

        // Initial heartbeat
        sendHeartbeat('active');

        const timer = setInterval(() => {
            sendHeartbeat('active');
        }, intervalMs);

        // Visibility change detection (Tab switching)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                sendHeartbeat('suspended');
            } else {
                sendHeartbeat('active');
            }
        };

        // Connection status detection
        const handleOffline = () => sendHeartbeat('disconnected');
        const handleOnline = () => sendHeartbeat('active');

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, [attemptId, intervalMs, sendHeartbeat]);

    return { sendHeartbeat };
};
