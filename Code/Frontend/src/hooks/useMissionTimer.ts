import { useState, useEffect, useRef } from 'react';

/**
 * Hook that tracks elapsed mission time since first WebSocket data reception.
 * Returns a formatted string "HH:MM:SS".
 */
export function useMissionTimer(isConnected: boolean): string {
    const [elapsed, setElapsed] = useState(0);
    const startRef = useRef<number | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (isConnected && startRef.current === null) {
            startRef.current = Date.now();
        }

        if (isConnected) {
            intervalRef.current = setInterval(() => {
                if (startRef.current !== null) {
                    setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
                }
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isConnected]);

    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
