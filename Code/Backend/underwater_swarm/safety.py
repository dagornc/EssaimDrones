"""Safety module for the underwater drone swarm.

This module defines the ``SafetyMonitor`` class, which is responsible for
monitoring the safety status of each drone, including geofencing and
collision risks.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import numpy as np

from .config import BOUNDS, MAX_FORCE

if TYPE_CHECKING:
    from .drone import Drone
    from .environment import Obstacle


class SafetyMonitor:
    """Monitors safety constraints for a drone.

    Attributes:
        drone: The drone being monitored.
        bounds: The environment boundaries.
        min_safe_dist: Minimum safe distance to other objects.
    """

    def __init__(
        self,
        drone: Drone,
        bounds: np.ndarray = BOUNDS,
        min_safe_dist: float = 2.0,
    ) -> None:
        self.drone = drone
        self.bounds = bounds
        self.min_safe_dist = min_safe_dist

    def check_geofence(self) -> np.ndarray:
        """Returns a correction force to push the drone back into bounds.

        Returns:
            A force vector pushing the drone towards the interior.
        """
        force = np.zeros(3)
        margin = 10.0

        # X
        if self.drone.position[0] < margin:
            force[0] += MAX_FORCE
        elif self.drone.position[0] > self.bounds[0] - margin:
            force[0] -= MAX_FORCE

        # Y
        if self.drone.position[1] < margin:
            force[1] += MAX_FORCE
        elif self.drone.position[1] > self.bounds[1] - margin:
            force[1] -= MAX_FORCE

        # Z
        if self.drone.position[2] < margin:
            force[2] += MAX_FORCE
        elif self.drone.position[2] > self.bounds[2] - margin:
            force[2] -= MAX_FORCE

        return force

    def check_collisions(
        self,
        neighbors: list[Drone],
        obstacles: list[Obstacle],
    ) -> np.ndarray:
        """Returns an avoidance force for imminent collisions.

        Args:
            neighbors: List of nearby drones.
            obstacles: List of nearby obstacles.

        Returns:
            Avoidance force vector.
        """
        force = np.zeros(3)

        # Check drone neighbors
        for neighbor in neighbors:
            diff = self.drone.position - neighbor.position
            dist: float = float(np.linalg.norm(diff))
            if 0 < dist < self.min_safe_dist:
                # Emergency repulsion
                force += (diff / dist) * MAX_FORCE * 2.0

        # Check obstacles
        for obs in obstacles:
            diff = self.drone.position - obs.position
            dist = float(np.linalg.norm(diff))
            if dist < (obs.radius + self.min_safe_dist) and dist > 0:
                force += (diff / dist) * MAX_FORCE * 3.0

        return force
