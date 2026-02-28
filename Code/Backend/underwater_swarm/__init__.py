"""Underwater Drone Swarm Simulation package.

This package provides a complete simulation framework for biomimetic
underwater drone swarms, including:

- **config**: Simulation parameters and swarm mode definitions.
- **drone**: Individual drone agent with physics and force calculations.
- **environment**: Ocean environment with currents and obstacles.
- **metrics**: Performance monitoring (cohesion, alignment, safety).
- **safety**: Geofencing and collision avoidance.
- **simulation**: Main simulation loop orchestration.
- **swarm**: Swarm-level coordination controller.
- **viz**: Real-time 3D visualization tools.
"""

__all__ = [
    "config",
    "drone",
    "environment",
    "metrics",
    "safety",
    "simulation",
    "swarm",
    "viz",
]
