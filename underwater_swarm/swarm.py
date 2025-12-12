"""Implements the swarm intelligence logic.

This module contains the `SwarmController` which now acts as the high-level
coordinator (Swarm Layer). It delegates the local force calculations to
each `Drone` agent (Local Layer) while managing global states and mode transitions.
"""

import numpy as np
from .config import *

class SwarmController:
    """Manages the swarm behavior by coordinating individual drones."""
    def __init__(self):
        pass

    def update(self, drones, environment, targets, friends, mode=SwarmMode.PATROL):
        """Updates all drones in the swarm.

        Iterates through each drone and triggers its local force calculation
        logic.

        Args:
            drones (list[Drone]): List of drones to update.
            environment (Environment): The simulation environment.
            targets (list[np.ndarray]): List of enemy/target positions.
            friends (list[np.ndarray]): List of friendly unit positions.
            mode (SwarmMode, optional): Current behavior mode. Defaults to PATROL.
        """
        # In a real distributed system, this loop would happen in parallel 
        # on each drone's hardware. Here we simulate it sequentially.
        
        # Optimization: We could build a spatial index (KD-Tree) here if N is large
        # For N ~ 30-50, passing the full list is fine.
        
        for drone in drones:
            # 1. Sense & Decide (Local Layer)
            drone.calculate_forces(drones, environment, targets, friends, mode)
            
            # 2. Hydrodynamic Interactions (Environment Layer)
            local_flow = environment.get_current(drone.position)
            drone.apply_drag(local_flow)

