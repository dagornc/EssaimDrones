import { renderHook, act } from '@testing-library/react';
import { useMissionTimer } from '../useMissionTimer';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useMissionTimer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Mock Date.now() to have consistent increments
        let now = 1000000;
        vi.spyOn(Date, 'now').mockImplementation(() => {
            const current = now;
            now += 1000;
            return current;
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('starts at 00:00:00 and increments when isConnected is true', () => {
        const { result, rerender } = renderHook(({ isConnected }) => useMissionTimer(isConnected), {
            initialProps: { isConnected: false }
        });

        expect(result.current).toBe('00:00:00');

        // Connect
        rerender({ isConnected: true });

        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(result.current).toBe('00:00:01');

        act(() => {
            vi.advanceTimersByTime(60000);
        });
        expect(result.current).toBe('00:01:01');
    });

    it('clears interval on unmount', () => {
        const spy = vi.spyOn(global, 'clearInterval');
        const { unmount } = renderHook(() => useMissionTimer(true));

        unmount();
        expect(spy).toHaveBeenCalled();
    });
});
