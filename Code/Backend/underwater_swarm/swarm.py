"""Implements the swarm intelligence logic.

This module contains the ``SwarmController`` which acts as the high-level
coordinator (Swarm Layer). It delegates the behavioral vectorized logic
to `behaviors.py` while managing global states and mode
transitions.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import numpy as np
from scipy.spatial.distance import cdist

from .behaviors import behavior_factory
from .config import SwarmMode

if TYPE_CHECKING:
    from .drone import Drone
    from .environment import Environment


class SwarmController:
    """Manages the swarm behavior by coordinating individual drones."""

    def update(
        self,
        drones: list[Drone],
        environment: Environment,
        targets: list[np.ndarray],
        friends: list[np.ndarray],
        mode: SwarmMode = SwarmMode.PATROL,
    ) -> None:
        """Updates all drones in the swarm.

        Args:
            drones: List of drones to update.
            environment: The simulation environment.
            targets: List of enemy/target positions.
            friends: List of friendly unit positions.
            mode: Current behavior mode.
        """
        if not drones:
            return

        # 1. Gather global state
        positions = np.array([d.position for d in drones])
        velocities = np.array([d.velocity for d in drones])

        # 2. Compute Distance Matrix (Vectorized O(N^2) in compiled C)
        dist_matrix = cdist(positions, positions)
        np.fill_diagonal(dist_matrix, np.inf)

        # 3. Handle Flash Expansion (Global survival trait)
        from .config import DT, FLASH_DURATION, FLASH_TRIGGER_DIST, MAX_FORCE

        if mode != SwarmMode.ATTACK and targets:
            for i, drone in enumerate(drones):
                dists_to_enemies = [np.linalg.norm(t - drone.position) for t in targets]
                if dists_to_enemies and min(dists_to_enemies) < FLASH_TRIGGER_DIST:
                    if drone.flash_timer <= 0:
                        drone.flash_timer = FLASH_DURATION
                        nearest_enemy = targets[np.argmin(dists_to_enemies)]
                        escape_dir = drone.position - nearest_enemy
                        norm = np.linalg.norm(escape_dir)
                        if norm == 0:
                            escape_dir = np.random.uniform(-1, 1, 3)
                            norm = np.linalg.norm(escape_dir)
                        drone.flash_direction = escape_dir / max(norm, 1e-9)

        # 4. Strategy Pattern for Behaviors
        behavior = behavior_factory(mode)
        behavior_forces = behavior.compute_forces(
            drones, positions, velocities, dist_matrix, targets, friends, mode
        )

        # 5. Apply forces back to local Drone objects
        for i, drone in enumerate(drones):
            if drone.flash_timer > 0:
                drone.flash_timer -= DT
                drone.apply_force(drone.flash_direction * MAX_FORCE * 2.0)
                drone.velocity *= 0.95
                continue

            # Evaluate individual safety and boundaries
            f_avoid = drone.safety.check_collisions(drones, environment.obstacles)
            f_bounds = drone.safety.check_geofence()

            # Sum forces and apply
            total_force = behavior_forces[i] + f_avoid + f_bounds
            drone.apply_force(total_force)

            # Hydrodynamic Interactions
            local_flow = environment.get_current(drone.position)
            drone.apply_drag(local_flow)
