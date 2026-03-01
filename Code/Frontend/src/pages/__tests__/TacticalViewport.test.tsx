import { render, screen, fireEvent, act } from '@testing-library/react';
import TacticalViewport from '../TacticalViewport';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import * as THREE from 'three';

// Mock OutletContext
let mockContextData: any = {};

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useOutletContext: () => mockContextData
    };
});

// Mock three.js OrbitControls
vi.mock('three/examples/jsm/controls/OrbitControls.js', () => {
    return {
        OrbitControls: class {
            target = { set: vi.fn() };
            enableDamping = false;
            dampingFactor = 0;
            maxPolarAngle = 0;
            minDistance = 0;
            maxDistance = 0;
            update() { }
            dispose() { }
            reset() { }
        }
    };
});

// Mock three-stdlib OrbitControls
vi.mock('three-stdlib', () => {
    const r = require('react');
    return {
        OrbitControls: class {
            target = { set: vi.fn() };
            enableDamping = false;
            dampingFactor = 0;
            maxPolarAngle = 0;
            minDistance = 0;
            maxDistance = 0;
            update = vi.fn();
            dispose = vi.fn();
            reset = vi.fn();
        }
    };
});

// Mock @react-three/fiber
vi.mock('@react-three/fiber', () => {
    return {
        extend: vi.fn(),
        Canvas: ({ children }: any) => <div data-testid="canvas">{children}</div>,
        useFrame: (cb: any) => {
            // Call it immediately on mount within useEffect so refs are assigned
            React.useEffect(() => {
                cb();
            }, [cb]);
        },
        useThree: () => ({
            camera: new THREE.PerspectiveCamera(),
            gl: { domElement: document.createElement('canvas') }
        })
    };
});

// Polyfill missing R3F element methods on HTML elements
Object.defineProperty(HTMLElement.prototype, 'setMatrixAt', { value: vi.fn(), writable: true });
Object.defineProperty(HTMLElement.prototype, 'setColorAt', { value: vi.fn(), writable: true });
Object.defineProperty(HTMLElement.prototype, 'instanceMatrix', { value: { needsUpdate: false }, writable: true });
Object.defineProperty(HTMLElement.prototype, 'instanceColor', { value: { needsUpdate: false }, writable: true });
Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { value: vi.fn().mockResolvedValue(undefined), writable: true });
document.exitFullscreen = vi.fn().mockResolvedValue(undefined);

describe('TacticalViewport', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loader when data is undefined', () => {
        mockContextData = { data: null };
        const { container } = render(<TacticalViewport />);
        expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('renders 3D view initially and handles reset camera', () => {
        mockContextData = {
            data: {
                drones: [[10, 10, 10], [20, 20, 20]],
                targets: [[50, 50, 10]],
                friends: [[30, 30, 30]],
                mode: 'PATROL',
                metrics: { safety: 0 }
            },
            sendMessage: vi.fn()
        };
        render(<TacticalViewport />);

        expect(screen.getByTestId('canvas')).toBeInTheDocument();
        expect(screen.getByText('2 ACTIVE DRONES • 0 VIOLATIONS')).toBeInTheDocument();

        // 3D Scene components have run, we can check basic interactions
        const resetBtn = screen.getByText('reset_camera');
        fireEvent.click(resetBtn); // Doesn't crash, OrbitControls is mocked
    });

    it('switches to 2D view and handles placement click', () => {
        const sendMessageMock = vi.fn();
        mockContextData = {
            data: {
                drones: [[10, 10, 10], [20, 20, 20]],
                targets: undefined, // test missing targets
                friends: undefined, // test missing friends
                mode: 'PATROL',
                metrics: { safety: 0 }
            },
            sendMessage: sendMessageMock
        };
        render(<TacticalViewport />);

        // Toggle to 2D
        const btn2d = screen.getByText('top_down');
        fireEvent.click(btn2d);
        expect(screen.queryByTestId('canvas')).not.toBeInTheDocument();

        // Check placement tool toggle
        const placeEnemy = screen.getByText('PLACE_ENEMY');
        fireEvent.click(placeEnemy);
        expect(screen.getByText('Click in viewport to place enemy...')).toBeInTheDocument();

        // Click SVG to place
        // The SVG is the only svg inside a parent with absolute inset-0?
        // Let's get the svg container by doing a click on the crosshair cursor
        const svgs = document.querySelectorAll('svg');
        const viewportSvg = Array.from(svgs).find(s => s.classList.contains('cursor-crosshair'));

        // Mock getBoundingClientRect
        if (viewportSvg) {
            viewportSvg.getBoundingClientRect = () => ({
                left: 0, top: 0, width: 1000, height: 1000, right: 1000, bottom: 1000, x: 0, y: 0, toJSON: () => { }
            });
            fireEvent.click(viewportSvg, { clientX: 500, clientY: 500 });
        }

        expect(sendMessageMock).toHaveBeenCalledWith(JSON.stringify({
            action: "place_entity",
            entity_type: "enemy",
            position: [50, 50, 50] // default depth is 50
        }));

        // After placement, tool is null
        expect(screen.queryByText('Click in viewport to place enemy...')).not.toBeInTheDocument();

        // Click when placement tool is null
        if (viewportSvg) {
            fireEvent.click(viewportSvg, { clientX: 500, clientY: 500 }); // does nothing
        }

        // Test depth slider
        const depthSlider = screen.getByLabelText('Depth slider');
        fireEvent.change(depthSlider, { target: { value: '75' } });
        expect(screen.getByText('DEPTH: 75.0M')).toBeInTheDocument();
    });

    it('handles missing marker coordinates and fullscreen toggle', () => {
        mockContextData = {
            data: {
                // missing z coord
                drones: [[10, undefined], []],
                targets: [[10, 50], []],
                friends: [[30, 30], []],
                mode: 'PATROL',
                metrics: { safety: 1 } // safety > 0
            },
            sendMessage: vi.fn()
        };
        render(<TacticalViewport />);

        // Switch to 2D to cover rendering invalid markers in 2D
        const btn2d = screen.getByText('top_down');
        fireEvent.click(btn2d);

        // Toggle placement to friend to cover clicking the same tool twice (turns it off)
        const placeFriend = screen.getByText('PLACE_FRIEND');
        fireEvent.click(placeFriend);
        expect(screen.getByText('Click in viewport to place friend...')).toBeInTheDocument();
        fireEvent.click(placeFriend); // turn off
        expect(screen.queryByText('Click in viewport to place friend...')).not.toBeInTheDocument();

        const placeObstacle = screen.getByText('PLACE_OBSTACLE');
        fireEvent.click(placeObstacle);
        expect(screen.getByText('Click in viewport to place obstacle...')).toBeInTheDocument();

        // Switch back to 3D
        const btn3d = screen.getByText('3d_view');
        fireEvent.click(btn3d);
        expect(screen.getByTestId('canvas')).toBeInTheDocument();

        // Toggle fullscreen
        const fullScreenBtn = screen.getByLabelText('Toggle fullscreen');
        fireEvent.click(fullScreenBtn); // Enters fullscreen
        fireEvent.click(fullScreenBtn); // Exits fullscreen
    });
});
