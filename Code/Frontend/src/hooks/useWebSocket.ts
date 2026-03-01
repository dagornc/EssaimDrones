import { useState, useEffect, useRef, useCallback } from 'react';
import type { SimulationData, MetricsSnapshot } from '../types/simulation';

// Re-export types for backward compatibility
export type { SimulationData };
export type DroneData = number[];
export type Metrics = { cohesion: number; alignment: number; safety: number };

/** Maximum entries in the metrics ring buffer. */
const HISTORY_SIZE = 60;

/** Reconnection parameters (exponential backoff). */
const INITIAL_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;
const BACKOFF_FACTOR = 2;

export function useWebSocket(url: string = 'ws://localhost:8000/ws') {
    const [data, setData] = useState<SimulationData | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'reconnecting' | 'offline'>('connecting');
    const [metricsHistory, setMetricsHistory] = useState<MetricsSnapshot[]>([]);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectDelay = useRef(INITIAL_DELAY_MS);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mountedRef = useRef(true);

    /** Push a new metrics snapshot into the ring buffer. */
    const pushMetrics = useCallback((metrics: SimulationData['metrics']) => {
        setMetricsHistory(prev => {
            const next = [
                ...prev,
                {
                    timestamp: Date.now(),
                    cohesion: metrics.cohesion,
                    alignment: metrics.alignment,
                    safety: metrics.safety,
                },
            ];
            return next.length > HISTORY_SIZE ? next.slice(-HISTORY_SIZE) : next;
        });
    }, []);

    /** Send a JSON string through the active WebSocket connection. */
    const sendMessage = useCallback((msg: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(msg);
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;

        const connect = () => {
            if (!mountedRef.current) return;

            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                if (!mountedRef.current) return;
                setIsConnected(true);
                setConnectionState('connected');
                reconnectDelay.current = INITIAL_DELAY_MS;
            };

            ws.onclose = () => {
                if (!mountedRef.current) return;
                setIsConnected(false);
                setConnectionState(reconnectDelay.current > INITIAL_DELAY_MS ? 'reconnecting' : 'offline');
                wsRef.current = null;

                // Schedule reconnect with exponential backoff
                const delay = reconnectDelay.current;
                reconnectDelay.current = Math.min(
                    delay * BACKOFF_FACTOR,
                    MAX_DELAY_MS,
                );
                reconnectTimer.current = setTimeout(connect, delay);
            };

            ws.onerror = () => {
                // onclose will fire after onerror, triggering reconnect
                ws.close();
            };

            ws.onmessage = (event) => {
                try {
                    const parsed: SimulationData = JSON.parse(event.data);
                    setData(parsed);
                    if (parsed.metrics) {
                        pushMetrics(parsed.metrics);
                    }
                } catch (e) {
                    console.error('Error parsing websocket data', e);
                }
            };
        };

        connect();

        return () => {
            mountedRef.current = false;
            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
            }
            wsRef.current?.close();
        };
    }, [url, pushMetrics]);

    return { data, isConnected, connectionState, metricsHistory, sendMessage };
}
