"""Defines the simulation environment.

This module manages the physical environment, including boundaries,
currents (fluid dynamics), and obstacles.
"""

from __future__ import annotations

import numpy as np

from .config import BOUNDS


class Obstacle:
    """Represents a spherical obstacle in the environment.

    Attributes:
        position: 3D position of the obstacle center.
        radius: Radius of the obstacle.
    """

    def __init__(
        self,
        position: list[float] | np.ndarray,
        radius: float = 10.0,
    ) -> None:
        self.position: np.ndarray = np.array(position, dtype=float)
        self.radius: float = radius


class Environment:
    """Manages the simulation environment parameters.

    Attributes:
        bounds: 3D vector defining the size of the environment box.
        global_current: Base vector for the global water current.
        obstacles: List of obstacles in the environment.
    """

    def __init__(self) -> None:
        self.bounds: np.ndarray = BOUNDS
        self.global_current: np.ndarray = np.array([0.5, 0.0, 0.0])
        self.obstacles: list[Obstacle] = []

    def add_obstacle(
        self,
        position: list[float] | np.ndarray,
        radius: float = 10.0,
    ) -> None:
        """Adds a spherical obstacle to the environment.

        Args:
            position: Center position ``[x, y, z]``.
            radius: Radius of the obstacle.
        """
        self.obstacles.append(Obstacle(position, radius))

    def get_current(self, position: np.ndarray | list[float]) -> np.ndarray:
        """Calculates the water current velocity at a specific position.

        Combines the global base current with spatially varying turbulence.

        Args:
            position: Position to sample the current at.

        Returns:
            3D current velocity vector.
        """
        pos = np.asarray(position, dtype=float)
        flow = self.global_current.copy()

        turbulence = np.array(
            [
                0.0,
                0.1 * np.sin(pos[0] * 0.1),
                0.1 * np.cos(pos[0] * 0.1),
            ]
        )

        return flow + turbulence

