import { render, screen, act, fireEvent } from '@testing-library/react';
import Logs from '../Logs';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock OutletContext
let mockContextData: any = {
    data: null,
    isConnected: false,
};

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useOutletContext: () => mockContextData
    };
});

// We need to test scrolling which accesses scrollHeight/scrollTop
// JSDOM doesn't support them well, so we mock them if necessary.
// Actually, setting scrollTop in JSDOM does not throw, it just does nothing visually.

describe('Logs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        // Reset state for each test
        mockContextData = {
            data: null,
            isConnected: false,
        };
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders empty state initially', () => {
        const { unmount } = render(<Logs />);
        expect(screen.getByText('log_events')).toBeInTheDocument();
        expect(screen.getByText('empty_no_backend_desc')).toBeInTheDocument();
        unmount();
    });

    it('logs connection changes', () => {
        const { rerender, unmount } = render(<Logs />);

        // Connect
        mockContextData = { ...mockContextData, isConnected: true };
        rerender(<Logs />);
        expect(screen.getByText('ws_connected')).toBeInTheDocument();

        // Disconnect
        mockContextData = { ...mockContextData, isConnected: false };
        rerender(<Logs />);
        expect(screen.getByText('ws_disconnected')).toBeInTheDocument();

        unmount();
    });

    it('logs mode changes and data', () => {
        const { rerender, unmount } = render(<Logs />);

        // Initial data
        mockContextData = {
            isConnected: true,
            data: {
                drones: [1, 2],
                mode: 'PATROL',
                metrics: { cohesion: 0.5, alignment: 0.5, safety: 0 }
            }
        };
        rerender(<Logs />);

        // Data log should trigger immediately because it's the first data (lastDataLog is 0)
        expect(screen.getByText(/\[WS\] drones=2 mode=PATROL/)).toBeInTheDocument();

        // Mode change
        mockContextData = {
            ...mockContextData,
            data: {
                ...mockContextData.data,
                mode: 'ATTACK'
            }
        };
        rerender(<Logs />);
        expect(screen.getByText('mode_changed: PATROL → ATTACK')).toBeInTheDocument();

        // Advance time to trigger another data log
        act(() => {
            vi.advanceTimersByTime(2500);
        });

        mockContextData = {
            ...mockContextData,
            data: {
                ...mockContextData.data,
                drones: [1, 2, 3] // new data
            }
        };
        rerender(<Logs />);
        expect(screen.getByText(/\[WS\] drones=3 mode=ATTACK/)).toBeInTheDocument();

        unmount();
    });

    it('filters logs via search', async () => {
        const user = userEvent.setup({ delay: null }); // using delay: null with fake timers is okay if we use advanceTimers, but we'll use fireEvent if we hang

        const { rerender, unmount } = render(<Logs />);

        // Generate some logs
        mockContextData = { ...mockContextData, isConnected: true };
        rerender(<Logs />); // generates 'ws_connected'

        mockContextData = { ...mockContextData, isConnected: false };
        rerender(<Logs />); // generates 'ws_disconnected'

        const searchInput = screen.getByLabelText('Filter logs');
        fireEvent.change(searchInput, { target: { value: 'disconnected' } });

        act(() => {
            vi.advanceTimersByTime(300);
        });

        // wait for filter
        expect(screen.queryByText('ws_connected')).not.toBeInTheDocument();
        expect(screen.getByText('ws_disconnected')).toBeInTheDocument();

        unmount();
    });

    it('toggles auto-scroll and clears logs', async () => {
        const { rerender, unmount } = render(<Logs />);

        // Generate log
        mockContextData = { ...mockContextData, isConnected: true };
        rerender(<Logs />);
        expect(screen.getByText('ws_connected')).toBeInTheDocument();

        // Toggle auto-scroll
        const scrollBtn = screen.getByLabelText('Toggle auto-scroll');
        fireEvent.click(scrollBtn); // disable
        fireEvent.click(scrollBtn); // enable

        // Clear logs
        const clearBtn = screen.getByLabelText('Clear logs');
        fireEvent.click(clearBtn);

        expect(screen.queryByText('ws_connected')).not.toBeInTheDocument();
        expect(screen.getByText('empty_no_backend_desc')).toBeInTheDocument();

        // If filtered array is empty and logs length > 0
        mockContextData = { ...mockContextData, isConnected: false };
        rerender(<Logs />); // generates new log

        const searchInput = screen.getByLabelText('Filter logs');
        fireEvent.change(searchInput, { target: { value: 'NOMATCH123' } });

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(screen.getByText('No matching entries')).toBeInTheDocument();

        unmount();
    });
});
