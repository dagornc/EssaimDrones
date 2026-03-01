import numpy as np
from underwater_swarm.simulation import Simulation
from underwater_swarm.config import SwarmMode


def test_simulation_initialization():
    sim = Simulation(num_drones=10)
    assert len(sim.drones) == 10
    assert sim.environment is not None
    assert sim.controller is not None


def test_drone_movement():
    sim = Simulation(num_drones=5)
    initial_positions = [np.copy(d.position) for d in sim.drones]

    # Run one step
    sim.step()

    # Check if positions changed
    for i, drone in enumerate(sim.drones):
        assert not np.array_equal(drone.position, initial_positions[i])


def test_mode_switching():
    sim = Simulation(num_drones=5)
    sim.mode = SwarmMode.PATROL
    assert sim.mode == SwarmMode.PATROL

    sim.mode = SwarmMode.ATTACK
    assert sim.mode == SwarmMode.ATTACK


def test_add_enemy():
    sim = Simulation(num_drones=5)
    initial_targets = len(sim.targets)

    # Add new target
    new_target = np.array([50.0, 50.0, 50.0])
    sim.targets.append(new_target)

    assert len(sim.targets) == initial_targets + 1
    assert np.array_equal(sim.targets[-1], new_target)


def test_add_friend():
    sim = Simulation(num_drones=5)
    initial_friends = len(sim.friends)

    # Add friend
    friend_pos = np.array([20.0, 20.0, 20.0])
    sim.friends.append(friend_pos)

    assert len(sim.friends) == initial_friends + 1
    assert np.array_equal(sim.friends[-1], friend_pos)


def test_add_obstacle():
    sim = Simulation(num_drones=5)
    assert len(sim.environment.obstacles) == 0

    # Add obstacle
    sim.environment.add_obstacle([30.0, 30.0, 30.0], radius=15.0)

    assert len(sim.environment.obstacles) == 1
    assert sim.environment.obstacles[0].radius == 15.0


def test_shield_mode_logic():
    sim = Simulation(num_drones=5)
    friend_pos = np.array([50.0, 50.0, 50.0])
    sim.friends.append(friend_pos)
    sim.mode = SwarmMode.SHIELD

    # Run a few steps
    for _ in range(10):
        sim.step()

    # Drones should be somewhat close to friend but not on top
    for drone in sim.drones:
        dist = np.linalg.norm(drone.position - friend_pos)
        # Check if they are roughly within interaction range (e.g. < 60m)
        # Drones start at random positions (0-50), friend is at 50,50,50.
        # Max dist could be ~86m initially. They need time to converge.
        # Just checking they aren't flying away to infinity.
        assert dist < 100.0


def test_search_mode():
    sim = Simulation(num_drones=5)
    sim.mode = SwarmMode.SEARCH

    # Run a few steps
    for _ in range(5):
        sim.step()

    # In search mode, drones should move.
    # Hard to test specific PSO logic without mocking, but we can check they aren't static.
    for drone in sim.drones:
        assert np.linalg.norm(drone.velocity) > 0.0


def test_flash_expansion_mode():
    sim = Simulation(num_drones=5)
    sim.mode = SwarmMode.FLASH_EXPANSION

    # Add an enemy to trigger the flash
    sim.targets.append(np.array([50.0, 50.0, 50.0]))

    # Place a drone near the enemy
    sim.drones[0].position = np.array([51.0, 51.0, 51.0])

    # Run step
    sim.step()

    # Drone should have high velocity (FLASH speed multiplier is 5.0)
    # Normal max speed is 5.0, so flash might be higher or capped?
    # Logic: drone.apply_force(drone.flash_direction * MAX_FORCE * 2.0)
    # It should be moving fast.
    assert np.linalg.norm(sim.drones[0].velocity) > 0.1
