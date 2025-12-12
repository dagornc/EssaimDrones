"""Safety module for the underwater drone swarm.

This module defines the `SafetyMonitor` class, which is responsible for
monitoring the safety status of each drone, including geofencing and
collision risks.
"""

import numpy as np
from .config import BOUNDS, MAX_FORCE

class SafetyMonitor:
    """Monitors safety constraints for a drone.

    Attributes:
        drone (Drone): The drone being monitored.
        bounds (np.ndarray): The environment boundaries.
        min_safe_dist (float): Minimum safe distance to other objects.
    """
    def __init__(self, drone, bounds=BOUNDS, min_safe_dist=2.0):
        self.drone = drone
        self.bounds = bounds
        self.min_safe_dist = min_safe_dist

    def check_geofence(self):
        """Checks if the drone is within the geofence and returns a correction force.

        Returns:
            np.ndarray: A force vector to push the drone back into bounds.
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

    def check_collisions(self, neighbors, obstacles):
        """Checks for imminent collisions and returns an avoidance force.

        Args:
            neighbors (list[Drone]): List of nearby drones.
            obstacles (list[Obstacle]): List of nearby obstacles.

        Returns:
            np.ndarray: Avoidance force vector.
        """
        force = np.zeros(3)
        
        # Check drone neighbors
        for neighbor in neighbors:
            diff = self.drone.position - neighbor.position
            dist = np.linalg.norm(diff)
            if dist < self.min_safe_dist and dist > 0:
                # Emergency repulsion
                force += (diff / dist) * MAX_FORCE * 2.0
                
        # Check obstacles
        for obs in obstacles:
            diff = self.drone.position - obs.position
            dist = np.linalg.norm(diff)
            if dist < (obs.radius + self.min_safe_dist):
                force += (diff / dist) * MAX_FORCE * 3.0
                
        return force
