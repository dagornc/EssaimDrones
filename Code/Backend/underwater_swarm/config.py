"""Configuration parameters for the Underwater Drone Swarm Simulation.

This module parses the Config/global.yaml file using Pydantic models to ensure
type safety and correct configuration structure at runtime.
"""

import os
from enum import Enum
from typing import Dict, List

import numpy as np
import yaml
from pydantic import BaseModel


class SwarmMode(Enum):
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


class SimulationConfig(BaseModel):
    dt: float
    steps: int


class PhysicsConfig(BaseModel):
    water_density: float
    drag_coeff: float
    drafting_bonus: float


class DroneConfig(BaseModel):
    max_speed: float
    max_force: float
    mass: float
    perception_radius: float
    crowding_radius: float


class BoidsConfig(BaseModel):
    separation: float
    alignment: float
    cohesion: float
    target: float
    current: float


class ModeParamConfig(BaseModel):
    sep: float
    ali: float
    coh: float
    target: float
    speed_mult: float


class PSOConfig(BaseModel):
    inertia: float
    cognitive: float
    social: float


class FlashConfig(BaseModel):
    duration: float
    cooldown: float
    trigger_dist: float


class EnvironmentConfig(BaseModel):
    bounds: List[float]


class AppConfig(BaseModel):
    simulation: SimulationConfig
    physics: PhysicsConfig
    drone: DroneConfig
    boids: BoidsConfig
    mode_params: Dict[str, ModeParamConfig]
    pso: PSOConfig
    flash: FlashConfig
    environment: EnvironmentConfig

    @classmethod
    def load_from_yaml(cls, path: str) -> "AppConfig":
        with open(path, "r") as f:
            data = yaml.safe_load(f)
        return cls(**data)


# Load config
CONFIG_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
    "Config",
    "global.yaml",
)
if not os.path.exists(CONFIG_FILE):
    # Fallback path if run from differently nested location
    CONFIG_FILE = "Config/global.yaml"

global_config = AppConfig.load_from_yaml(CONFIG_FILE)

# Expose constants for backward compatibility during refactoring
DT = global_config.simulation.dt
STEPS = global_config.simulation.steps

WATER_DENSITY = global_config.physics.water_density
DRAG_COEFF = global_config.physics.drag_coeff
DRAFTING_BONUS = global_config.physics.drafting_bonus

MAX_SPEED = global_config.drone.max_speed
MAX_FORCE = global_config.drone.max_force
MASS = global_config.drone.mass
PERCEPTION_RADIUS = global_config.drone.perception_radius
CROWDING_RADIUS = global_config.drone.crowding_radius

W_SEPARATION = global_config.boids.separation
W_ALIGNMENT = global_config.boids.alignment
W_COHESION = global_config.boids.cohesion
W_TARGET = global_config.boids.target
W_CURRENT = global_config.boids.current

# Re-map mode_params to Enum keys
MODE_PARAMS: Dict[SwarmMode, Dict[str, float]] = {}
for mode_name, params in global_config.mode_params.items():
    try:
        enum_mode = SwarmMode(mode_name)
        MODE_PARAMS[enum_mode] = params.model_dump()
    except ValueError:
        pass

PSO_INERTIA = global_config.pso.inertia
PSO_COGNITIVE = global_config.pso.cognitive
PSO_SOCIAL = global_config.pso.social

FLASH_DURATION = global_config.flash.duration
FLASH_COOLDOWN = global_config.flash.cooldown
FLASH_TRIGGER_DIST = global_config.flash.trigger_dist

BOUNDS = np.array(global_config.environment.bounds, dtype=float)
