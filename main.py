"""Main entry point for the Underwater Drone Swarm Simulation.

This module initializes the simulation, handles command-line arguments,
and starts either the headless simulation or the live visualization.
"""

import argparse
import importlib.util
from underwater_swarm.simulation import Simulation
from underwater_swarm.config import SwarmMode


def main():
    """Parses arguments and starts the simulation.

    This function sets up the simulation parameters based on command-line
    arguments, initializes the `Simulation` object, and chooses between
    headless execution and live visualization.
    """
    parser = argparse.ArgumentParser(description="Underwater Drone Swarm Simulation")
    parser.add_argument("--drones", type=int, default=30, help="Number of drones")
    parser.add_argument("--steps", type=int, default=300, help="Simulation steps (only for non-interactive)")
    parser.add_argument("--no-viz", action="store_true", help="Disable visualization")
    parser.add_argument(
        "--mode",
        type=str,
        default="PATROL",
        choices=[
            "PATROL",
            "ATTACK",
            "DEFEND",
            "ENCIRCLE",
            "SHIELD",
            "SEARCH",
            "FLASH_EXPANSION",
            "SCHOOLING",
            "PREDATOR_PACK",
            "EXPLORATION"],
        help="Initial Swarm combat mode")

    args = parser.parse_args()

    mode_enum = SwarmMode[args.mode]

    print(f"Initializing Swarm in {mode_enum.value} mode.")
    sim = Simulation(num_drones=args.drones)
    sim.mode = mode_enum

    if args.no_viz:
        # Run headless
        sim.run(steps=args.steps)
    else:
        # Run interactive
        # Robust Backend Selection
        import matplotlib
        if importlib.util.find_spec("PyQt5"):
            try:
                matplotlib.use('Qt5Agg')
                print("DEBUG: Configured Qt5Agg backend.")
            except BaseException:
                pass
        else:
            print("DEBUG: PyQt5 not found, falling back to default (likely MacOSX).")
            try:
                matplotlib.use('macosx')
            except BaseException:
                pass

        print(f"DEBUG: Active Matplotlib Backend: {matplotlib.get_backend()}")

        from underwater_swarm.viz import LiveVisualizer

        print("Starting Live Visualization...")
        viz = LiveVisualizer(sim)
        viz.start()


if __name__ == "__main__":
    main()
