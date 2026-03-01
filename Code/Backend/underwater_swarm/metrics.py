"""Performance metrics for the underwater drone swarm.

This module defines the ``PerformanceMonitor`` class, which calculates
metrics such as formation stability, cohesion, and area coverage.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import numpy as np

from .config import BOUNDS

if TYPE_CHECKING:
    from .simulation import Simulation


class PerformanceMonitor:
    """Calculates performance metrics for the swarm.

    Attributes:
        sim: The simulation instance to monitor.
    """

    def __init__(self, simulation: Simulation) -> None:
        self.sim = simulation

    def calculate_cohesion(self) -> float:
        """Calculates the average distance of drones from the swarm center.

        Returns:
            Average distance to centroid.
        """
        positions = np.array([d.position for d in self.sim.drones])
        centroid = np.mean(positions, axis=0)
        dists = np.linalg.norm(positions - centroid, axis=1)
        return float(np.mean(dists))

    def calculate_alignment(self) -> float:
        """Calculates the alignment of the swarm (order parameter).

        Returns:
            Magnitude of the average normalized velocity (0 to 1).
        """
        velocities = np.array([d.velocity for d in self.sim.drones])
        speeds = np.linalg.norm(velocities, axis=1)
        # Avoid division by zero
        speeds[speeds == 0] = 1.0
        normalized_vels = velocities / speeds[:, None]
        avg_vel = np.mean(normalized_vels, axis=0)
        return float(np.linalg.norm(avg_vel))

    def calculate_safety_violations(self) -> int:
        """Counts the number of safety violations (collisions, OOB).

        Returns:
            Total number of active violations.
        """
        violations = 0
        # Check OOB
        for d in self.sim.drones:
            if not (
                0 <= d.position[0] <= BOUNDS[0]
                and 0 <= d.position[1] <= BOUNDS[1]
                and 0 <= d.position[2] <= BOUNDS[2]
            ):
                violations += 1

        # Check Collisions (simplified O(N^2) check for metrics)
        positions = np.array([d.position for d in self.sim.drones])
        for i in range(len(positions)):
            for j in range(i + 1, len(positions)):
                dist = float(np.linalg.norm(positions[i] - positions[j]))
                if dist < 2.0:
                    violations += 1
        return violations
