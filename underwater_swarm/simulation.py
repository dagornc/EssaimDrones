"""Manages the main simulation loop.

This module orchestrates the simulation, including initialization of drones,
environment, and the swarm controller, as well as the main time-stepping loop.
"""

import numpy as np
from .drone import Drone
from .swarm import SwarmController
from .environment import Environment
from .config import *

class Simulation:
    """Controls the simulation state and execution.

    Attributes:
        drones (list[Drone]): List of drone agents in the simulation.
        controller (SwarmController): Logic controller for swarm behaviors.
        environment (Environment): Physical environment (bounds, obstacles).
        targets (list[np.ndarray]): List of target positions (e.g., enemies).
        friends (list[np.ndarray]): List of friendly unit positions.
        mode (SwarmMode): Current operational mode of the swarm.
        manual_target (bool): Flag indicating if targets are manually controlled.
        history (list): List of drone positions at each step for playback.
    """
    def __init__(self, num_drones=20):
        self.drones = [Drone(i, np.random.rand(3) * 50) for i in range(num_drones)]
    def __init__(self, num_drones=20):
        """Initializes the simulation.

        Args:
            num_drones (int, optional): Number of drones to spawn. Defaults to 20.
        """
        self.drones = [Drone(i, np.random.rand(3) * 50) for i in range(num_drones)]
        self.controller = SwarmController()
        self.environment = Environment()
        
        # Lists for multiple entities
        self.targets = [np.array([80.0, 80.0, 50.0])] # Enemies
        self.friends = [np.array([20.0, 20.0, 50.0])] # Friendly boats
        
        self.mode = None 
        self.manual_target = False 
        
        self.history = [] 

    def step(self):
        """Advances the simulation by one time step.

        Updates target positions (if wandering), applies swarm logic via the
        controller, and integrates physics for all drones.
        """
        # Update targets (wandering) only if not manual and we have at least one
        if not self.manual_target and len(self.targets) > 0:
            # Just move the first one for demo purposes if no manual input
            if np.linalg.norm(self.drones[0].position - self.targets[0]) < 10:
                self.targets[0] = np.random.rand(3) * BOUNDS

        # Use stored mode
        from .config import SwarmMode
        if self.mode is None: self.mode = SwarmMode.PATROL
            
        self.controller.update(self.drones, self.environment, self.targets, self.friends, mode=self.mode)
        
        for drone in self.drones:
            drone.update(DT)
            
    def run(self, steps=STEPS, mode=None):
        """Runs the simulation for a specified number of steps.

        Args:
            steps (int, optional): Number of steps to run. Defaults to STEPS.
            mode (SwarmMode, optional): Initial mode to set. Defaults to None.

        Returns:
            np.ndarray: History of drone positions (steps, num_drones, 3).
        """
        from .config import SwarmMode
        from .metrics import PerformanceMonitor
        
        self.perf_monitor = PerformanceMonitor(self)
        
        if mode is not None: self.mode = mode
        if self.mode is None: self.mode = SwarmMode.PATROL
            
        print(f"Starting simulation for {steps} steps in {self.mode.value} mode...")
        for t in range(steps):
            self.step()
            positions = [d.position.copy() for d in self.drones]
            self.history.append(positions)
            
        print("Simulation complete.")
        
        # Print Metrics
        cohesion = self.perf_monitor.calculate_cohesion()
        alignment = self.perf_monitor.calculate_alignment()
        safety_violations = self.perf_monitor.calculate_safety_violations()
        
        print("\n=== Performance Metrics ===")
        print(f"Cohesion (Avg Dist to Center): {cohesion:.2f} m")
        print(f"Alignment (Order Parameter): {alignment:.2f}")
        print(f"Safety Violations: {safety_violations}")
        print("===========================\n")
        
        return np.array(self.history)
