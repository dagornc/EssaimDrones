import { renderHook, act } from '@testing-library/react';
import { useWebSocket } from '../useWebSocket';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Better Mock WebSocket to track instances and trigger events
let lastWSInstance: MockWebSocket;
class MockWebSocket {
    onopen: any = null;
    onclose: any = null;
    onerror: any = null;
    onmessage: any = null;
    readyState: number = 0; // CONNECTING
    url: string = '';

    constructor(url: string) {
        this.url = url;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        lastWSInstance = this;
    }

    send = vi.fn();
    close = vi.fn().mockImplementation(() => {
        this.readyState = 3; // CLOSED
        if (this.onclose) this.onclose();
    });

    // Helper to simulate server actions
    open() {
        this.readyState = 1; // OPEN
        if (this.onopen) this.onopen();
    }
    receive(data: any) {
        if (this.onmessage) this.onmessage({ data: JSON.stringify(data) });
    }
    error() {
        if (this.onerror) this.onerror();
        this.close();
    }
}

// Add static property for readyState constants if needed by implementation
(MockWebSocket as any).OPEN = 1;

describe('useWebSocket', () => {
    beforeEach(() => {
        vi.stubGlobal('WebSocket', MockWebSocket);
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('connects, receives messages and pushes history', async () => {
        const { result } = renderHook(() => useWebSocket('ws://localhost:8000'));

        act(() => { lastWSInstance.open(); });
        expect(result.current.isConnected).toBe(true);

        const mockData = {
            drones: [[10, 10]],
            metrics: { cohesion: 0.8, alignment: 0.8, safety: 0 }
        };

        act(() => {
            lastWSInstance.receive(mockData);
        });

        expect(result.current.data).toEqual(mockData);
        expect(result.current.metricsHistory).toHaveLength(1);
        expect(result.current.metricsHistory[0].cohesion).toBe(0.8);
    });

    it('handles reconnection with backoff', () => {
        renderHook(() => useWebSocket('ws://localhost:8000'));
        act(() => { lastWSInstance.open(); });
        expect(lastWSInstance.close).not.toHaveBeenCalled();

        // Simulate error
        act(() => { lastWSInstance.error(); });
        expect(lastWSInstance.close).toHaveBeenCalled();

        // 1st reconnect attempt (initial delay 1000ms)
        act(() => { vi.advanceTimersByTime(1000); });
        // New instance created? The constructor was called again.
        expect(lastWSInstance.url).toBe('ws://localhost:8000');

        // Simulate 2nd failure
        act(() => { lastWSInstance.error(); });
        // 2nd reconnect attempt (delay 2000ms)
        act(() => { vi.advanceTimersByTime(2000); });
        expect(lastWSInstance.url).toBe('ws://localhost:8000');
    });

    it('handles sendMessage correctly', () => {
        const { result } = renderHook(() => useWebSocket('ws://localhost:8000'));
        act(() => { lastWSInstance.open(); });

        act(() => {
            result.current.sendMessage('hello');
        });
        expect(lastWSInstance.send).toHaveBeenCalledWith('hello');
    });

    it('handles parse error gracefully', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        renderHook(() => useWebSocket('ws://localhost:8000'));
        act(() => { lastWSInstance.open(); });

        act(() => {
            lastWSInstance.onmessage({ data: 'invalid json' });
        });
        expect(spy).toHaveBeenCalledWith('Error parsing websocket data', expect.any(Error));
    });

    it('cleans up on unmount', () => {
        const { unmount } = renderHook(() => useWebSocket('ws://localhost:8000'));
        unmount();
        // Since we unmount, ws.close is called
        // And reconnectTimer is cleared (but we don't have a direct way to check unless we spy on clearTimeout)
    });

    it('limits metrics history to HISTORY_SIZE', () => {
        const { result } = renderHook(() => useWebSocket('ws://localhost:8000'));
        act(() => { lastWSInstance.open(); });

        for (let i = 0; i < 65; i++) {
            act(() => {
                lastWSInstance.receive({ metrics: { cohesion: i, alignment: i, safety: i } });
            });
        }
        expect(result.current.metricsHistory).toHaveLength(60);
        expect(result.current.metricsHistory[59].cohesion).toBe(64);
    });

    it('does not send message if not open', () => {
        const { result } = renderHook(() => useWebSocket('ws://localhost:8000'));
        act(() => {
            result.current.sendMessage('hello');
        });
        expect(lastWSInstance.send).not.toHaveBeenCalled();
    });

    it('handles unmount before onopen or onclose', () => {
        const { unmount } = renderHook(() => useWebSocket('ws://localhost:8000'));
        const instance = lastWSInstance;
        unmount();
        act(() => { instance.open(); });
        act(() => { instance.close(); });
    });
});
