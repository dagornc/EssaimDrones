import os
import pytest
import numpy as np
from unittest.mock import patch, MagicMock

from underwater_swarm.simulation import Simulation
from underwater_swarm.config import SwarmMode
from underwater_swarm.metrics import PerformanceMonitor

def test_simulation_run_without_orchestrator():
    sim = Simulation(num_drones=5)
    
    with patch.dict(os.environ, clear=True):
        if "OPENROUTER_API_KEY" in os.environ:
            del os.environ["OPENROUTER_API_KEY"]
            
        history = sim.run(steps=3, mode=SwarmMode.PATROL)
        
        assert history.shape == (3, 5, 3)
        assert sim.mode == SwarmMode.PATROL
        assert hasattr(sim, "perf_monitor")

def test_simulation_run_with_orchestrator():
    sim = Simulation(num_drones=3)
    
    with patch.dict(os.environ, {"OPENROUTER_API_KEY": "fake-key"}):
        with patch("agent.orchestrator.SwarmOrchestrator") as MockOrchestrator:
            mock_orch = MockOrchestrator.return_value
            mock_orch.analyze_metrics.return_value = "Mocked decision"
            
            history = sim.run(steps=55, mode=SwarmMode.PATROL)
            
            assert history.shape == (55, 3, 3)
            assert sim.mode == SwarmMode.PATROL
            assert getattr(sim, "orchestrator", None) is not None
            mock_orch.analyze_metrics.assert_called_once()
            
def test_simulation_run_orchestrator_init_failure():
    sim = Simulation(num_drones=3)
    
    with patch.dict(os.environ, {"OPENROUTER_API_KEY": "fake-key"}):
        with patch("agent.orchestrator.SwarmOrchestrator", side_effect=Exception("Failed Init")):
            history = sim.run(steps=2)
            assert len(history) == 2

def test_metrics_calculation():
    sim = Simulation(num_drones=2)
    # Force positions to calculate predictable metrics
    sim.drones[0].position = np.array([0.0, 0.0, 0.0])
    sim.drones[0].velocity = np.array([1.0, 0.0, 0.0])
    sim.drones[1].position = np.array([0.0, 2.0, 0.0]) # distance = 2.0
    sim.drones[1].velocity = np.array([0.0, 1.0, 0.0])
    
    monitor = PerformanceMonitor(sim)
    cohesion = monitor.calculate_cohesion()
    
    # Center is [0, 1, 0]. Dist from drones to center is 1.0, avg is 1.0.
    assert cohesion == 1.0
    
    alignment = monitor.calculate_alignment()
    assert 0 <= alignment <= 1.0
    
    violations = monitor.calculate_safety_violations()
    assert violations >= 0
