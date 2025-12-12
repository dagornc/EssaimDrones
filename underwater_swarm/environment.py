
"""Defines the simulation environment.

This module manages the physical environment, including boundaries,
currents (fluid dynamics), and obstacles.
"""

import numpy as np
from .config import BOUNDS

class Obstacle:
    """Represents a spherical obstacle in the environment.

    Attributes:
        position (np.ndarray): 3D position of the obstacle center.
        radius (float): Radius of the obstacle.
    """
    def __init__(self, position, radius=10.0):
        self.position = np.array(position)
        self.radius = radius

class Environment:
    """Manages the simulation environment parameters.

    Attributes:
        bounds (np.ndarray): 3D vector defining the size of the environment box.
        global_current (np.ndarray): Base vector for the global water current.
        obstacles (list[Obstacle]): List of obstacles in the environment.
    """
    def __init__(self):
        self.bounds = BOUNDS
        # Simple constant current for now, can be made complex later
        self.global_current = np.array([0.5, 0.0, 0.0]) # 0.5 m/s flow in X
        self.obstacles = [] # List of Obstacle objects

    def add_obstacle(self, position, radius=10.0):
        """Adds a spherical obstacle to the environment.

        Args:
            position (list or np.ndarray): Center position [x, y, z].
            radius (float, optional): Radius of the obstacle. Defaults to 10.0.
        """
        self.obstacles.append(Obstacle(position, radius))

    def get_current(self, position):
        """Calculates the water current velocity at a specific position.

        Combines the global base current with spatially varying turbulence.

        Args:
            position (np.ndarray): Position to sample the current at.

        Returns:
            np.ndarray: 3D current velocity vector.
        """
        # Base flow
        flow = self.global_current.copy()
        
        # Add simple turbulence (sine wave based on position)
        turbulence = np.array([
            0.0,
            0.1 * np.sin(position[0] * 0.1),
            0.1 * np.cos(position[0] * 0.1)
        ])
        
        return flow + turbulence

    def check_bounds(self, position):
        """Checks if a position is within the environment bounds.

        Note:
            Currently a placeholder. Boundary enforcement is handled by
            steering forces in the swarm logic.

        Args:
            position (np.ndarray): Position to check.
        """
        # This will be handled by the drone/swarm logic to apply steering forces
        # to stay inside, rather than hard bounces.
        pass
