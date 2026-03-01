"""Shared pytest fixtures for the underwater_swarm test suite."""

from __future__ import annotations

import pytest

from underwater_swarm.drone import Drone
from underwater_swarm.environment import Environment
from underwater_swarm.simulation import Simulation
from underwater_swarm.swarm import SwarmController


@pytest.fixture()
def env() -> Environment:
    """Returns a default Environment instance."""
    return Environment()


@pytest.fixture()
def drones_5() -> list[Drone]:
    """Returns a list of 5 drones positioned at (50, 50, 50)."""
    return [Drone(i, [50.0, 50.0, 50.0]) for i in range(5)]


@pytest.fixture()
def simulation_5() -> Simulation:
    """Returns a Simulation with 5 drones."""
    return Simulation(num_drones=5)


@pytest.fixture()
def swarm_controller() -> SwarmController:
    """Returns a SwarmController instance."""
    return SwarmController()
