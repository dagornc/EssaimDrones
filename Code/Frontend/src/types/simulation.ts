/**
 * Shared types for simulation data exchanged between the backend
 * (via WebSocket) and all frontend pages.
 */

/** Position tuple: [x, y] or [x, y, z]. */
export type DronePosition = [number, number, number?];

/** Swarm-level metrics computed by the backend PerformanceMonitor. */
export interface Metrics {
    cohesion: number;
    alignment: number;
    safety: number;
}

/** A single snapshot of the simulation state sent over WebSocket. */
export interface SimulationData {
    mode: string;
    drones: DronePosition[];
    targets: DronePosition[];
    friends: DronePosition[];
    obstacles?: DronePosition[];
    metrics: Metrics;
}

/** Single point in the metrics history ring buffer. */
export interface MetricsSnapshot {
    timestamp: number;
    cohesion: number;
    alignment: number;
    safety: number;
}

/** Shape of the Outlet context shared via React Router. */
export interface OutletContextType {
    data: SimulationData | null;
    isConnected: boolean;
    metricsHistory: MetricsSnapshot[];
    sendMessage: (msg: string) => void;
    simulationMode: boolean;
}
