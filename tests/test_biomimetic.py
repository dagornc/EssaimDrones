import unittest
import numpy as np
import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from underwater_swarm.drone import Drone
from underwater_swarm.swarm import SwarmController
from underwater_swarm.config import SwarmMode, FLASH_DURATION, FLASH_TRIGGER_DIST
from underwater_swarm.environment import Environment

class TestBiomimeticBehaviors(unittest.TestCase):
    def setUp(self):
        self.swarm = SwarmController()
        self.env = Environment()
        self.drones = [Drone(i, [50, 50, 50]) for i in range(5)]

    def test_flash_expansion_trigger(self):
        # Place enemy close to drone 0
        enemy_pos = np.array([50 + FLASH_TRIGGER_DIST - 1.0, 50, 50])
        targets = [enemy_pos]
        friends = []
        
        # Update swarm
        self.swarm.update(self.drones, self.env, targets, friends, mode=SwarmMode.PATROL)
        
        # Drone 0 should have triggered flash
        self.assertGreater(self.drones[0].flash_timer, 0)
        
        # Check direction: should be away from enemy
        expected_dir = self.drones[0].position - enemy_pos
        expected_dir /= np.linalg.norm(expected_dir)
        
        # Allow for some random noise in direction, but dot product should be positive
        dot_prod = np.dot(self.drones[0].flash_direction, expected_dir)
        self.assertGreater(dot_prod, 0.0)

    def test_pso_update(self):
        # Set mode to SEARCH
        targets = []
        friends = []
        
        # Initial update to set best positions
        self.swarm.update(self.drones, self.env, targets, friends, mode=SwarmMode.SEARCH)
        
        # Move drone 0 closer to target (50, 50, 50) -> wait, they start at 50,50,50
        # Let's move drone 0 away and drone 1 closer
        self.drones[0].position = np.array([10, 10, 10])
        self.drones[1].position = np.array([45, 45, 45]) # Closer to 50,50,50
        
        # Reset best scores manually for test
        self.drones[0].pso_best_score = -1000
        self.drones[1].pso_best_score = -1000
        
        # Update
        self.swarm.update(self.drones, self.env, targets, friends, mode=SwarmMode.SEARCH)
        
        # Drone 1 should have a better score than Drone 0
        self.assertGreater(self.drones[1].pso_best_score, self.drones[0].pso_best_score)
        
        # Drone 0 should be attracted to Drone 1 (Social component)
        # This is hard to test deterministically due to random factors, 
        # but we can check if velocity is non-zero
        self.assertTrue(np.linalg.norm(self.drones[0].velocity) > 0)

if __name__ == '__main__':
    unittest.main()
