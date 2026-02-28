import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Metrics from '../Metrics';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock OutletContext
let mockContextData: any = {};

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useOutletContext: () => mockContextData
    };
});

// Mock Recharts
vi.mock('recharts', async () => {
    const actual = await vi.importActual('recharts');
    return {
        ...actual,
        ResponsiveContainer: ({ children }: any) => <div data-testid="recharts-responsive">{children}</div>,
        LineChart: ({ children }: any) => <div data-testid="recharts-linechart">{children}</div>,
        BarChart: ({ children }: any) => <div data-testid="recharts-barchart">{children}</div>,
        AreaChart: ({ children }: any) => <div data-testid="recharts-areachart">{children}</div>,
        Line: () => <div />,
        Bar: ({ children }: any) => <div>{children}</div>,
        Area: () => <div />,
        XAxis: () => <div />,
        YAxis: () => <div />,
        CartesianGrid: () => <div />,
        Tooltip: () => <div />,
        Cell: () => <div />
    };
});

describe('Metrics', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
        global.URL.revokeObjectURL = vi.fn();
    });

    it('renders loader when data is incomplete', () => {
        // We set data to an object missing metrics to trigger the loading state
        mockContextData = {
            data: {
                drones: []
            },
            metricsHistory: []
        };
        const { container } = render(<Metrics />);
        expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('renders correctly with default/offline data', () => {
        mockContextData = {
            data: null, // this will make safeData use fallback
            metricsHistory: []
        };
        render(<Metrics />);
        expect(screen.getByText('cohesion_over_time')).toBeInTheDocument();
    });

    it('renders with populated data and generates heatmap metrics', () => {
        mockContextData = {
            data: {
                mode: 'ATTACK',
                drones: [
                    [50, 50, 50], // proper drone
                    [1000, 1000, 50], // out of bounds
                    [-10, -10, 50], // negative bounds
                    [], // length < 2
                    [undefined, 50, 50] as any, // d[0] not a number
                    [50, undefined, 50] as any, // d[1] not a number
                    [50, 50, 'invalid'] as any, // d[2] not a number
                    Object.assign([90, 90, 90], { active: false }) as any // inactive drone
                ],
                targets: [],
                friends: [],
                metrics: { cohesion: 0.85, alignment: 0.90, safety: 3 }
            },
            metricsHistory: [
                { cohesion: 0.8, alignment: 0.8, safety: 1 },
                { cohesion: undefined, alignment: undefined, safety: undefined },
                { cohesion: 0.85, alignment: 0.9, safety: 3 }
            ]
        };

        render(<Metrics />);

        // Check charts
        expect(screen.getByText('cohesion_over_time')).toBeInTheDocument();
        expect(screen.getByText('0.8m')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();

        // Heatmap
        expect(screen.getByText('spatial_coverage_heatmap')).toBeInTheDocument();

        // Table
        expect(screen.getByText('AS-001')).toBeInTheDocument();
    });

    it('searches, sorts table and exports CSV', () => {
        mockContextData = {
            data: {
                mode: 'PATROL',
                drones: [ // positions [x,y,z]
                    [50, 50, 50], // speed will be 0 since it compares to 50,50
                    [90, 50, 50], // speed > 0
                    [10, 50, 50], // speed > 0
                    Object.assign([90, 90, 90], { active: false }) as any // inactive drone
                ],
                metrics: { cohesion: 0.5, alignment: 0.5, safety: 0 }
            },
            metricsHistory: []
        };

        render(<Metrics />);

        // ID sort
        const idHeader = screen.getByText('drone_id');
        fireEvent.click(idHeader); // Asc
        fireEvent.click(idHeader); // Desc

        // Speed sort
        const speedHeader = screen.getByText('speed');
        fireEvent.click(speedHeader); // Asc
        fireEvent.click(speedHeader); // Desc
        fireEvent.click(idHeader); // switch back to ID to cover else branch `setSortField(field)`

        // Filter
        const searchInput = screen.getByRole('textbox', { name: "Search drones" });
        fireEvent.change(searchInput, { target: { value: '002' } });

        expect(screen.queryByText('AS-001')).not.toBeInTheDocument();
        expect(screen.getByText('AS-002')).toBeInTheDocument();

        // Download
        const aClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { });
        const exportBtn = screen.getByText('export_csv');
        fireEvent.click(exportBtn);

        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(aClickSpy).toHaveBeenCalled();
        expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
});
