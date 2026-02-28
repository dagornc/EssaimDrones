import numpy as np
from underwater_swarm.drone import Drone
from underwater_swarm.environment import Environment
from underwater_swarm.config import MAX_SPEED


def test_drone_update():
    d = Drone(1, [0, 0, 0])
    d.velocity = np.array([1.0, 0.0, 0.0])
    d.update(1.0)  # dt = 1.0

    # Position should be [1, 0, 0]
    assert np.allclose(d.position, [1.0, 0.0, 0.0])


def test_max_speed():
    d = Drone(1, [0, 0, 0])
    d.velocity = np.array([100.0, 0.0, 0.0])  # Way over max speed
    d.update(0.1)

    speed = np.linalg.norm(d.velocity)
    assert np.isclose(speed, MAX_SPEED)


def test_environment_current():
    env = Environment()
    curr = env.get_current([0, 0, 0])
    assert curr.shape == (3,)
    # Should have some X component
    assert curr[0] > 0
