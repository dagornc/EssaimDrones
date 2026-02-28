"""Manages the main simulation loop.

This module orchestrates the simulation, including initialization of drones,
environment, and the swarm controller, as well as the main time-stepping loop.
"""

from __future__ import annotations

import numpy as np

from .config import BOUNDS, DT, STEPS, SwarmMode
from .drone import Drone
from .environment import Environment
from .metrics import PerformanceMonitor
from .swarm import SwarmController


class Simulation:
    """Controls the simulation state and execution.

    Attributes:
        drones: List of drone agents in the simulation.
        controller: Logic controller for swarm behaviors.
        environment: Physical environment (bounds, obstacles).
        targets: List of target positions (e.g., enemies).
        friends: List of friendly unit positions.
        mode: Current operational mode of the swarm.
        manual_target: Flag indicating if targets are manually controlled.
        history: List of drone positions at each step for playback.
    """

    def __init__(self, num_drones: int = 20) -> None:
        """Initializes the simulation.

        Args:
            num_drones: Number of drones to spawn.
        """
        self.drones: list[Drone] = [
            Drone(i, np.random.rand(3) * 50) for i in range(num_drones)
        ]
        self.controller = SwarmController()
        self.environment = Environment()

        # Lists for multiple entities
        self.targets: list[np.ndarray] = [np.array([80.0, 80.0, 50.0])]
        self.friends: list[np.ndarray] = [np.array([20.0, 20.0, 50.0])]

        self.mode: SwarmMode | None = None
        self.manual_target: bool = False

        self.history: list[list[np.ndarray]] = []
        self.perf_monitor: PerformanceMonitor | None = None

    def step(self) -> None:
        """Advances the simulation by one time step."""
        # Update targets (wandering) only if not manual
        if not self.manual_target and len(self.targets) > 0:
            if (
                float(
                    np.linalg.norm(
                        self.drones[0].position - self.targets[0],
                    )
                )
                < 10
            ):
                self.targets[0] = np.random.rand(3) * BOUNDS

        if self.mode is None:
            self.mode = SwarmMode.PATROL

        self.controller.update(
            self.drones,
            self.environment,
            self.targets,
            self.friends,
            mode=self.mode,
        )

        for drone in self.drones:
            drone.update(DT)

    def run(
        self,
        steps: int = STEPS,
        mode: SwarmMode | None = None,
    ) -> np.ndarray:
        """Runs the simulation for a specified number of steps.

        Args:
            steps: Number of steps to run.
            mode: Initial mode to set.

        Returns:
            History of drone positions ``(steps, num_drones, 3)``.
        """
        self.perf_monitor = PerformanceMonitor(self)

        # Initialize Orchestrator if OpenRouter key is present
        self.orchestrator = None
        import os

        if os.getenv("OPENROUTER_API_KEY"):
            try:
                # Local import to prevent circular dependencies if any
                from agent.orchestrator import SwarmOrchestrator

                self.orchestrator = SwarmOrchestrator(self)
            except Exception as e:
                print(f"Orchestrator init failed: {e}")

        if mode is not None:
            self.mode = mode
        if self.mode is None:
            self.mode = SwarmMode.PATROL

        print(f"Starting simulation for {steps} steps in {self.mode.value} mode...")
        for i in range(steps):
            self.step()
            positions = [d.position.copy() for d in self.drones]
            self.history.append(positions)

            # Agentic Tactical Analysis (every 50 steps)
            if self.orchestrator and i > 0 and i % 50 == 0:
                print(f"--- [LLM TACTICAL ANALYSIS STEP {i}] ---")
                metrics = {
                    "cohesion": self.perf_monitor.calculate_cohesion(),
                    "alignment": self.perf_monitor.calculate_alignment(),
                    "safety": self.perf_monitor.calculate_safety_violations(),
                }
                tactical_decision = self.orchestrator.analyze_metrics(metrics)
                print(
                    f">> Agent Response: {tactical_decision}\n>> Current Mode: {self.mode.name}\n"
                )

        print("Simulation complete.")

        # Print Metrics
        cohesion = self.perf_monitor.calculate_cohesion()
        alignment = self.perf_monitor.calculate_alignment()
        safety_violations = self.perf_monitor.calculate_safety_violations()

        print("\n=== Performance Metrics ===")
        print(f"Cohesion (Avg Dist to Center): {cohesion:.2f} m")
        print(f"Alignment (Order Parameter): {alignment:.2f}")
        print(f"Safety Violations: {safety_violations}")
        print("===========================\n")

        return np.array(self.history)
