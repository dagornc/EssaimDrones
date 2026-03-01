"""Edge-case tests for the SafetyMonitor module."""

from __future__ import annotations

import numpy as np

from underwater_swarm.drone import Drone
from underwater_swarm.environment import Obstacle
from underwater_swarm.config import BOUNDS, MAX_FORCE


class TestGeofence:
    """Tests for boundary correction forces."""

    def test_force_pushes_inward_near_lower_bound(self) -> None:
        """A drone near position 0 should receive a positive force."""
        drone = Drone(0, [2.0, 2.0, 2.0])
        force = drone.safety.check_geofence()
        # All axes should push inward (positive)
        assert force[0] > 0
        assert force[1] > 0
        assert force[2] > 0

    def test_force_pushes_inward_near_upper_bound(self) -> None:
        """A drone near the upper bound should receive a negative force."""
        drone = Drone(0, [BOUNDS[0] - 2, BOUNDS[1] - 2, BOUNDS[2] - 2])
        force = drone.safety.check_geofence()
        assert force[0] < 0
        assert force[1] < 0
        assert force[2] < 0

    def test_no_force_in_safe_zone(self) -> None:
        """A drone well inside bounds should receive zero force."""
        drone = Drone(0, [50.0, 50.0, 50.0])
        force = drone.safety.check_geofence()
        np.testing.assert_array_equal(force, np.zeros(3))


class TestObstacleCollision:
    """Tests for obstacle collision avoidance."""

    def test_obstacle_at_zero_distance(self) -> None:
        """Drone exactly at obstacle center should NOT crash (div-by-zero fix)."""
        drone = Drone(0, [30.0, 30.0, 30.0])
        obstacle = Obstacle([30.0, 30.0, 30.0], radius=10.0)

        # Must not raise ZeroDivisionError
        force = drone.safety.check_collisions([], [obstacle])

        # Force should be zero (dist == 0 guard)
        np.testing.assert_array_equal(force, np.zeros(3))

    def test_obstacle_within_danger_zone(self) -> None:
        """Drone within obstacle+safety radius should get repulsion force."""
        drone = Drone(0, [35.0, 30.0, 30.0])
        obstacle = Obstacle([30.0, 30.0, 30.0], radius=10.0)
        force = drone.safety.check_collisions([], [obstacle])

        # Force should push drone away (+X direction)
        assert force[0] > 0
        assert np.linalg.norm(force) > 0

    def test_obstacle_outside_danger_zone(self) -> None:
        """Drone far from obstacle should get zero force."""
        drone = Drone(0, [80.0, 80.0, 80.0])
        obstacle = Obstacle([30.0, 30.0, 30.0], radius=5.0)
        force = drone.safety.check_collisions([], [obstacle])
        np.testing.assert_array_equal(force, np.zeros(3))


class TestNeighborCollision:
    """Tests for neighbor collision avoidance."""

    def test_emergency_repulsion(self) -> None:
        """Drones too close should receive emergency repulsion."""
        d1 = Drone(0, [50.0, 50.0, 50.0])
        d2 = Drone(1, [50.5, 50.0, 50.0])
        force = d1.safety.check_collisions([d2], [])

        # Force should push d1 away from d2 (negative X)
        assert force[0] < 0
        assert np.linalg.norm(force) > MAX_FORCE

    def test_no_repulsion_when_far(self) -> None:
        """Drones far apart should receive zero collision force."""
        d1 = Drone(0, [10.0, 10.0, 10.0])
        d2 = Drone(1, [50.0, 50.0, 50.0])
        force = d1.safety.check_collisions([d2], [])
        np.testing.assert_array_equal(force, np.zeros(3))

    def test_no_self_collision(self) -> None:
        """Same drone object should not produce collision force (dist==0 guard)."""
        d = Drone(0, [50.0, 50.0, 50.0])
        force = d.safety.check_collisions([d], [])
        # dist == 0 -> skipped by guard
        np.testing.assert_array_equal(force, np.zeros(3))
