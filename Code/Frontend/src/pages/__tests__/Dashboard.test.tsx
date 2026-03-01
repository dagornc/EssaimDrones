import { render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import React from 'react';

const mockSendMessage = vi.fn();
const mockToast = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useOutletContext: () => ({
            data: {
                drones: [[10, 20], [30, 40]],
                targets: [[50, 50]],
                friends: [[10, 10]],
                mode: 'PATROL',
                metrics: { cohesion: 0.85, alignment: 0.90, safety: 2 }
            },
            metricsHistory: [
                { cohesion: 0.80, alignment: 0.85 },
                { cohesion: 0.85, alignment: 0.90 }
            ],
            sendMessage: mockSendMessage
        })
    };
});

vi.mock('../../components/ui/Toast', () => ({
    useToast: () => ({ toast: mockToast })
}));

// Recharts throws in JSDOM sometimes if width/height are 0, mock it with a simple wrapper
vi.mock('recharts', async () => {
    const actual = await vi.importActual('recharts');
    return {
        ...actual,
        ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
        AreaChart: ({ children }: any) => <div data-testid="recharts-areachart">{children}</div>,
        Area: () => <div data-testid="recharts-area" />,
        XAxis: () => <div />,
        YAxis: () => <div />,
        CartesianGrid: () => <div />,
        Tooltip: () => <div />
    };
});

describe('Dashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state when data is null', async () => {
        vi.mocked(await import('react-router-dom')).useOutletContext = vi.fn().mockReturnValue({
            data: null,
            metricsHistory: [],
            sendMessage: mockSendMessage
        });

        render(<Dashboard />);
        expect(screen.getByText('empty_no_backend_desc')).toBeInTheDocument();
    });

    it('renders dashboard with data', async () => {
        // Restore mock to normal data
        vi.mocked(await import('react-router-dom')).useOutletContext = vi.fn().mockReturnValue({
            data: {
                drones: [[10, 20], [30, 40]],
                targets: [[50, 50]],
                friends: [[10, 10]],
                mode: 'PATROL',
                metrics: { cohesion: 0.85, alignment: 0.90, safety: 2 }
            },
            metricsHistory: [
                { cohesion: 0.80, alignment: 0.85 },
                { cohesion: 0.85, alignment: 0.90 }
            ],
            sendMessage: mockSendMessage
        });

        render(<Dashboard />);

        // Active Drones
        expect(screen.getByText('active_drones')).toBeInTheDocument();
        expect(screen.getByText((_, element) => element?.textContent === '2/50')).toBeInTheDocument();

        // Mode
        expect(screen.getByText('current_mode')).toBeInTheDocument();
        const modeCard = screen.getByText('current_mode').closest('div');
        expect(modeCard).toHaveTextContent('PATROL');

        // Cohesion
        expect(screen.getByText('cohesion_index')).toBeInTheDocument();
        expect(screen.getByText('0.85')).toBeInTheDocument();

        // Safety
        expect(screen.getByText('safety_violations')).toBeInTheDocument();
        expect(screen.getByText((_, element) => {
            return element?.tagName.toLowerCase() === 'span' && element.textContent === '2' && !element.parentElement?.textContent?.includes('/30');
        })).toBeInTheDocument();

        // Swarm modes
        expect(screen.getByText('swarm_modes')).toBeInTheDocument();
        // The attack button
        expect(screen.getByRole('button', { name: /ATTACK/i })).toBeInTheDocument();

        expect(screen.getByTestId('recharts-areachart')).toBeInTheDocument();
    });

    it('renders dashboard with minimal metrics history', async () => {
        vi.mocked(await import('react-router-dom')).useOutletContext = vi.fn().mockReturnValue({
            data: {
                drones: [],
                mode: 'ATTACK',
                metrics: { cohesion: 0.5, alignment: 0.5, safety: 0 }
            },
            metricsHistory: [],
            sendMessage: mockSendMessage
        });

        render(<Dashboard />);
        expect(screen.getByText('0.50')).toBeInTheDocument();
    });

    it('handles mode switching', async () => {
        vi.mocked(await import('react-router-dom')).useOutletContext = vi.fn().mockReturnValue({
            data: {
                drones: [],
                mode: 'PATROL',
                metrics: { cohesion: 0.85, alignment: 0.90, safety: 2 }
            },
            metricsHistory: [],
            sendMessage: mockSendMessage
        });

        const user = userEvent.setup();
        render(<Dashboard />);

        const attackBtn = screen.getByRole('button', { name: /ATTACK/i });
        await user.click(attackBtn);

        expect(mockSendMessage).toHaveBeenCalledWith(JSON.stringify({ mode: 'ATTACK' }));
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            title: 'mode_changed',
            description: '→ ATTACK',
            variant: 'info'
        }));
    });
});
