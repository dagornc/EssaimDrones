"""Configuration parameters for the Underwater Drone Swarm Simulation.

This module contains all the constants and configuration settings used
throughout the simulation, including physics parameters, drone specifications,
swarm behavior weights, and environment bounds.
"""

import numpy as np

# Simulation
DT = 0.1
STEPS = 500

from enum import Enum

class SwarmMode(Enum):
    """Defines the operational modes for the drone swarm.

    Attributes:
        PATROL: Standard patrolling behavior.
        ATTACK: Aggressive behavior towards a target.
        DEFEND: Defensive formation.
        ENCIRCLE: Surrounding a target.
        SHIELD: Protective formation.
        SEARCH: Search pattern behavior.
        FLASH_EXPANSION: Rapid dispersal behavior (biomimetic).
        SCHOOLING: Tight formation, high alignment (Biomimetic).
        PREDATOR_PACK: Coordinated hunting (Biomimetic).
        EXPLORATION: Wide area search (Biomimetic).
    """
    PATROL = "PATROL"
    ATTACK = "ATTACK"
    DEFEND = "DEFEND"
    ENCIRCLE = "ENCIRCLE"
    SHIELD = "SHIELD"
    SEARCH = "SEARCH"
    FLASH_EXPANSION = "FLASH_EXPANSION"
    SCHOOLING = "SCHOOLING"
    PREDATOR_PACK = "PREDATOR_PACK"
    EXPLORATION = "EXPLORATION"

# Physics
WATER_DENSITY = 1025.0  # kg/m^3
DRAG_COEFF = 1.0        # Simplified drag coefficient
DRAFTING_BONUS = 0.3    # 30% drag reduction when drafting

# Drone
MAX_SPEED = 12.5         # m/s
MAX_FORCE = 10.0        # N
MASS = 10.0             # kg
PERCEPTION_RADIUS = 15.0
CROWDING_RADIUS = 5.0

# Base Boids Weights (Default / Fallback)
W_SEPARATION = 2.5
W_ALIGNMENT = 1.0
W_COHESION = 1.0
W_TARGET = 1.5
W_CURRENT = 0.5

# Mode Specific Parameters
MODE_PARAMS = {
    SwarmMode.PATROL: {
        "sep": 4.0, "ali": 0.5, "coh": 0.5, "target": 0.5, "speed_mult": 0.8
    },
    SwarmMode.ATTACK: {
        "sep": 1.5, "ali": 2.0, "coh": 1.0, "target": 3.0, "speed_mult": 1.2
    },
    SwarmMode.DEFEND: {
        "sep": 2.0, "ali": 1.5, "coh": 3.0, "target": 0.2, "speed_mult": 0.6
    },
    SwarmMode.ENCIRCLE: {
        "sep": 2.5, "ali": 1.0, "coh": 1.0, "target": 1.0, "speed_mult": 1.0
    },
    SwarmMode.SHIELD: {
        "sep": 3.0, "ali": 2.0, "coh": 2.0, "target": 2.0, "speed_mult": 1.0
    },
    SwarmMode.SEARCH: {
        "sep": 2.0, "ali": 0.5, "coh": 0.1, "target": 0.0, "speed_mult": 1.0
    },
    SwarmMode.FLASH_EXPANSION: {
        "sep": 10.0, "ali": 0.0, "coh": 0.0, "target": 0.0, "speed_mult": 5.0
    },
    SwarmMode.SCHOOLING: {
        "sep": 1.5, "ali": 3.0, "coh": 2.5, "target": 1.0, "speed_mult": 1.0
    },
    SwarmMode.PREDATOR_PACK: {
        "sep": 3.0, "ali": 1.5, "coh": 1.0, "target": 4.0, "speed_mult": 1.5
    },
    SwarmMode.EXPLORATION: {
        "sep": 8.0, "ali": 0.2, "coh": 0.0, "target": 0.5, "speed_mult": 0.8
    }
}

# PSO Parameters
PSO_INERTIA = 0.7
PSO_COGNITIVE = 1.5
PSO_SOCIAL = 1.5

# Flash Expansion Parameters
FLASH_DURATION = 2.0 # seconds
FLASH_COOLDOWN = 10.0 # seconds
FLASH_TRIGGER_DIST = 10.0 # meters

# Environment
BOUNDS = np.array([100, 100, 100]) # 100x100x100 meter box
