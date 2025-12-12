import pytest
import numpy as np
from underwater_swarm.simulation import Simulation

def test_simulation_init_entities():
    """Test that the simulation initializes with 1 enemy and 1 ally."""
    sim = Simulation(num_drones=5)
    
    # Check enemies (targets)
    assert len(sim.targets) == 1
    assert np.allclose(sim.targets[0], [80.0, 80.0, 50.0])
    
    # Check friends (allies)
    assert len(sim.friends) == 1
    assert np.allclose(sim.friends[0], [20.0, 20.0, 50.0])
