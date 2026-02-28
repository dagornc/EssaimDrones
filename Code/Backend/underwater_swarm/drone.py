"""Defines the Drone agent class.

This module contains the ``Drone`` class, which represents an individual agent
in the swarm simulation. It handles physics integration, force application,
and state management for various behaviors.
"""

from __future__ import annotations


import numpy as np

from .config import (
    DRAG_COEFF,
    MASS,
    MAX_FORCE,
    MAX_SPEED,
    WATER_DENSITY,
)
from .safety import SafetyMonitor


def _normalize(vec: np.ndarray) -> np.ndarray:
    """Normalizes *vec* and scales it to ``MAX_FORCE``.

    Returns the zero-vector unchanged.
    """
    magnitude = float(np.linalg.norm(vec))
    if magnitude > 0:
        return vec / magnitude * MAX_FORCE
    return vec


class Drone:
    """Represents a single underwater drone agent.

    Attributes:
        id: Unique identifier for the drone.
        position: 3D position vector ``[x, y, z]``.
        velocity: 3D velocity vector ``[vx, vy, vz]``.
        acceleration: 3D acceleration vector ``[ax, ay, az]``.
        mass: Mass of the drone in kg.
        drag_factor: Multiplier for drag calculation (used for drafting).
        pso_best_position: Best known position for PSO.
        pso_best_score: Best known score for PSO.
        flash_timer: Timer for flash expansion behavior.
        flash_direction: Direction vector for flash expansion.
        safety: Safety module for the drone.
    """

    def __init__(self, id: int, start_pos: list[float] | np.ndarray) -> None:
        self.id = id
        self.position: np.ndarray = np.array(start_pos, dtype=float)
        self.velocity: np.ndarray = np.random.uniform(-1, 1, 3)
        self.acceleration: np.ndarray = np.zeros(3)
        self.mass: float = MASS
        self.drag_factor: float = 1.0

        # PSO State
        self.pso_best_position: np.ndarray = np.copy(self.position)
        self.pso_best_score: float = -np.inf

        # Flash Expansion State
        self.flash_timer: float = 0.0
        self.flash_direction: np.ndarray = np.zeros(3)

        # Safety Module
        self.safety = SafetyMonitor(self)

    def update(self, dt: float) -> None:
        """Updates drone physics using Euler integration.

        Args:
            dt: Time step in seconds.
        """
        # Limit force
        accel_mag = float(np.linalg.norm(self.acceleration))
        if accel_mag > MAX_FORCE:
            self.acceleration = (self.acceleration / accel_mag) * MAX_FORCE

        # F = ma -> a = F/m
        actual_accel = self.acceleration / self.mass
        self.velocity += actual_accel * dt

        # Limit speed
        speed = float(np.linalg.norm(self.velocity))
        if speed > MAX_SPEED:
            self.velocity = (self.velocity / speed) * MAX_SPEED

        self.position += self.velocity * dt

        # Reset accumulator for next step
        self.acceleration = np.zeros(3)
        self.drag_factor = 1.0

    def apply_force(self, force: np.ndarray) -> None:
        """Applies a force vector to the drone.

        Args:
            force: 3D force vector to apply.
        """
        self.acceleration += force

    def apply_drag(self, fluid_velocity: np.ndarray) -> None:
        """Applies hydrodynamic drag based on relative velocity.

        Args:
            fluid_velocity: Velocity vector of the surrounding fluid.
        """
        relative_vel = self.velocity - fluid_velocity
        speed = float(np.linalg.norm(relative_vel))
        if speed > 0:
            drag_mag = (
                0.5
                * WATER_DENSITY
                * (DRAG_COEFF * self.drag_factor)
                * 0.01
                * (speed**2)
            )
            drag_force = -(relative_vel / speed) * drag_mag
            self.apply_force(drag_force)

    # ------------------------------------------------------------------
    # Force calculation
    # ------------------------------------------------------------------

    # ------------------------------------------------------------------
    # Notice: calculate_forces has been removed to comply with SRP (Single Responsibility Principle).
    # Behavior logic is now handled globally in 'behaviors.py' using vectorized numpy ops
    # through the Strategy Pattern invoked by 'SwarmController'.
    # ------------------------------------------------------------------
