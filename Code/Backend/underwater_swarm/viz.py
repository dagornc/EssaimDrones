"""Visualization tools for the swarm simulation.

This module handles the 3D visualization of the simulation using Matplotlib.
It includes a live interactive visualizer (`LiveVisualizer`) and a legacy
static animator (`animate_swarm`).
"""

import matplotlib.pyplot as plt
import matplotlib.animation as animation

import numpy as np
from .config import BOUNDS, SwarmMode


class LiveVisualizer:
    """Interactive 3D visualizer for the simulation.

    Allows real-time interaction with the simulation, including changing modes,
    placing targets/obstacles, and adjusting view settings.

    Attributes:
        sim (Simulation): Reference to the simulation instance.
        fig (plt.Figure): Matplotlib figure object.
        ax (Axes3D): 3D axes object.
        scat (Path3DCollection): Scatter plot for drones.
        obs_scat (Path3DCollection): Scatter plot for obstacles.
        enemy_scat (Path3DCollection): Scatter plot for enemies.
        friend_scat (Path3DCollection): Scatter plot for friendly units.
        stem_lines (list): List of line objects for depth visualization.
        is_2d (bool): Flag for 2D/3D view toggle.
        selected_type (str): Type of currently selected entity ('enemy', 'friend', 'obstacle').
        selected_idx (int): Index of currently selected entity.
    """

    def __init__(self, simulation):
        """Initializes the visualizer.

        Args:
            simulation (Simulation): The simulation instance to visualize.
        """
        self.sim = simulation
        self.fig = plt.figure(figsize=(10, 8))
        self.ax = self.fig.add_subplot(111, projection="3d")
        self.scat = self.ax.scatter([], [], [], c="b", marker="o")

        self.ax.set_xlim(0, BOUNDS[0])
        self.ax.set_ylim(0, BOUNDS[1])
        self.ax.set_zlim(0, BOUNDS[2])
        self.ax.set_xlabel("X")
        self.ax.set_ylabel("Y")
        self.ax.set_zlabel("Z")

        self.title_text = self.ax.set_title(f"Mode: {self.sim.mode.value}")

        # Legend Text
        legend = (
            "Controls:\n"
            "1: PATROL\n"
            "2: ATTACK (Enemy)\n"
            "3: DEFEND (Friend)\n"
            "4: ENCIRCLE (Enemy)\n"
            "6: SHIELD (Friend)\n"
            "7: SEARCH (PSO)\n"
            "8: FLASH EXP\n"
            "9: SCHOOLING\n"
            "0: PREDATOR PACK\n"
            "-: EXPLORATION\n"
            "5: Toggle 2D/3D\n"
            "L-Click: Enemy\n"
            "R-Click: Friend"
        )
        self.fig.text(
            0.02,
            0.5,
            legend,
            transform=self.fig.transFigure,
            fontsize=10,
            verticalalignment="center",
        )

        # View State
        self.is_2d = False

        # Enemy and Friend Markers
        self.enemy_scat = self.ax.scatter(
            [], [], [], c="r", marker="x", s=100, label="Enemy"
        )
        self.friend_scat = self.ax.scatter(
            [], [], [], c="g", marker="^", s=100, label="Friend"
        )

        # Obstacle Markers (Black Spheres)
        self.obs_scat = self.ax.scatter(
            [], [], [], c="k", marker="o", s=200, label="Obstacle"
        )

        # Stems (Vertical lines for depth)
        self.stem_lines = []

        # Selection State
        self.selected_type = None  # 'enemy', 'friend', 'obstacle'
        self.selected_idx = -1

        # Drag State
        self.is_dragging = False
        self.drag_start_pos = None

        # Connect events
        self.fig.canvas.mpl_connect("key_press_event", self.on_key)
        self.fig.canvas.mpl_connect("button_press_event", self.on_press)
        self.fig.canvas.mpl_connect("button_release_event", self.on_release)
        self.fig.canvas.mpl_connect("motion_notify_event", self.on_motion)
        self.fig.canvas.mpl_connect("scroll_event", self.on_scroll)

        print("\n=== CONTROLS ===")
        print("1: PATROL")
        print("2: ATTACK (Enemy)")
        print("3: DEFEND (Friend)")
        print("4: ENCIRCLE (Enemy)")
        print("6: SHIELD (Friend)")
        print("7: SEARCH (PSO)")
        print("8: FLASH EXPANSION")
        print("9: SCHOOLING")
        print("0: PREDATOR PACK")
        print("-: EXPLORATION")
        print("5: Toggle 2D/3D")
        print("L-Click + Drag: Move Enemy")
        print("R-Click + Drag: Move Friend")
        print("M-Click: Place Obstacle")
        print("SCROLL: Adjust Depth (Z) of Selected")
        print("================\n")

    def on_scroll(self, event):
        """Handles mouse scroll events to adjust depth (Z-axis).

        Args:
            event (MouseEvent): Matplotlib mouse event.
        """
        if self.selected_type is None or self.selected_idx == -1:
            return

        # Adjust Z
        step = 5.0 if event.button == "up" else -5.0

        if self.selected_type == "enemy":
            if self.selected_idx < len(self.sim.targets):
                self.sim.targets[self.selected_idx][2] = np.clip(
                    self.sim.targets[self.selected_idx][2] + step, 0, BOUNDS[2]
                )
                print(
                    f"Enemy {self.selected_idx} Depth: {self.sim.targets[self.selected_idx][2]:.1f}"
                )

        elif self.selected_type == "friend":
            if self.selected_idx < len(self.sim.friends):
                self.sim.friends[self.selected_idx][2] = np.clip(
                    self.sim.friends[self.selected_idx][2] + step, 0, BOUNDS[2]
                )
                print(
                    f"Friend {self.selected_idx} Depth: {self.sim.friends[self.selected_idx][2]:.1f}"
                )

        elif self.selected_type == "obstacle":
            if self.selected_idx < len(self.sim.environment.obstacles):
                obs = self.sim.environment.obstacles[self.selected_idx]
                obs.position[2] = np.clip(obs.position[2] + step, 0, BOUNDS[2])
                print(f"Obstacle {self.selected_idx} Depth: {obs.position[2]:.1f}")

    def get_event_coords(self, event):
        """Helper to get 3D coordinates from event."""
        if event.inaxes != self.ax:
            return None

        new_x, new_y, new_z = 0, 0, 50.0
        if self.is_2d:
            new_x = event.xdata
            new_y = event.ydata
        else:
            if event.xdata is not None and event.ydata is not None:
                new_x = event.xdata
                new_y = event.ydata
            else:
                return None

        # Heuristic for MacOSX/Backend issue
        if abs(new_x) <= 1.1 and abs(new_y) <= 1.1 and BOUNDS[0] > 50:
            new_x *= BOUNDS[0]
            new_y *= BOUNDS[1]

        return np.array([new_x, new_y, new_z])

    def on_press(self, event):
        """Handles mouse button press to start dragging or select."""
        coords = self.get_event_coords(event)
        if coords is None:
            return

        self.sim.manual_target = True
        SELECTION_THRESH = 10.0

        # Check Enemies (Left Click)
        if event.button == 1:
            for i, t in enumerate(self.sim.targets):
                if np.linalg.norm(t[:2] - coords[:2]) < SELECTION_THRESH:
                    self.selected_type = "enemy"
                    self.selected_idx = i
                    self.is_dragging = True
                    print(f"Started dragging Enemy {i}")
                    return

            # If no enemy selected, create one?
            # Only create if NOT dragging existing
            self.sim.targets.append(coords)
            self.selected_type = "enemy"
            self.selected_idx = len(self.sim.targets) - 1
            self.is_dragging = True
            print(f"Added & Dragging Enemy {self.selected_idx}")

        # Check Friends (Right Click)
        elif event.button == 3:
            for i, f in enumerate(self.sim.friends):
                if np.linalg.norm(f[:2] - coords[:2]) < SELECTION_THRESH:
                    self.selected_type = "friend"
                    self.selected_idx = i
                    self.is_dragging = True
                    print(f"Started dragging Friend {i}")
                    return

            # Create Friend
            self.sim.friends.append(coords)
            self.selected_type = "friend"
            self.selected_idx = len(self.sim.friends) - 1
            self.is_dragging = True
            print(f"Added & Dragging Friend {self.selected_idx}")

        # Check Obstacles (Middle Click)
        elif event.button == 2:
            for i, obs in enumerate(self.sim.environment.obstacles):
                if np.linalg.norm(obs.position[:2] - coords[:2]) < SELECTION_THRESH:
                    self.selected_type = "obstacle"
                    self.selected_idx = i
                    print(f"Selected Obstacle {i}")
                    return

            # Create Obstacle
            self.sim.environment.add_obstacle(coords, radius=15.0)
            self.selected_type = "obstacle"
            self.selected_idx = len(self.sim.environment.obstacles) - 1
            print(f"Added Obstacle {self.selected_idx}")

    def on_motion(self, event):
        """Handles mouse motion to update dragged item position."""
        if not self.is_dragging or self.selected_idx == -1:
            return

        coords = self.get_event_coords(event)
        if coords is None:
            return

        if self.selected_type == "enemy":
            if self.selected_idx < len(self.sim.targets):
                # Keep Z, update X/Y
                old_z = self.sim.targets[self.selected_idx][2]
                self.sim.targets[self.selected_idx] = np.array(
                    [coords[0], coords[1], old_z]
                )

        elif self.selected_type == "friend":
            if self.selected_idx < len(self.sim.friends):
                old_z = self.sim.friends[self.selected_idx][2]
                self.sim.friends[self.selected_idx] = np.array(
                    [coords[0], coords[1], old_z]
                )

    def on_release(self, event):
        """Handles mouse button release to stop dragging."""
        if self.is_dragging:
            self.is_dragging = False
            print("Stopped dragging")

    def on_key(self, event):
        """Handles keyboard events for mode switching and view toggling.

        Args:
            event (KeyEvent): Matplotlib key event.
        """
        if event.key == "1":
            self.sim.mode = SwarmMode.PATROL
        elif event.key == "2":
            self.sim.mode = SwarmMode.ATTACK
        elif event.key == "3":
            self.sim.mode = SwarmMode.DEFEND
        elif event.key == "4":
            self.sim.mode = SwarmMode.ENCIRCLE
        elif event.key == "6":
            self.sim.mode = SwarmMode.SHIELD
        elif event.key == "7":
            self.sim.mode = SwarmMode.SEARCH
        elif event.key == "8":
            self.sim.mode = SwarmMode.FLASH_EXPANSION
        elif event.key == "9":
            self.sim.mode = SwarmMode.SCHOOLING
        elif event.key == "0":
            self.sim.mode = SwarmMode.PREDATOR_PACK
        elif event.key == "-":
            self.sim.mode = SwarmMode.EXPLORATION
        elif event.key == "5":
            self.toggle_view()

        self.title_text.set_text(f"Mode: {self.sim.mode.value}")
        print(f"Switched to {self.sim.mode.value}")

    def toggle_view(self):
        """Toggles between 3D perspective and Top-down 2D view."""
        self.is_2d = not self.is_2d
        if self.is_2d:
            self.ax.view_init(elev=90, azim=-90)
            self.ax.set_zlabel("")
            self.ax.set_zticks([])
            self.ax.set_title(f"Mode: {self.sim.mode.value} (2D - Scroll: Depth)")
        else:
            self.ax.view_init(elev=30, azim=-60)
            self.ax.set_zlabel("Z")
            self.ax.set_title(f"Mode: {self.sim.mode.value}")

    def update(self, frame):
        # Force GUI update for MacOSX backend
        plt.pause(0.001)

        self.sim.step()

        positions = np.array([d.position for d in self.sim.drones])
        self.scat._offsets3d = (positions[:, 0], positions[:, 1], positions[:, 2])

        # Update Enemy Markers
        if len(self.sim.targets) > 0:
            t_arr = np.array(self.sim.targets)
            self.enemy_scat._offsets3d = (t_arr[:, 0], t_arr[:, 1], t_arr[:, 2])
        else:
            self.enemy_scat._offsets3d = ([], [], [])

        # Update Friend Markers
        if len(self.sim.friends) > 0:
            f_arr = np.array(self.sim.friends)
            self.friend_scat._offsets3d = (f_arr[:, 0], f_arr[:, 1], f_arr[:, 2])
        else:
            self.friend_scat._offsets3d = ([], [], [])

        # Update Obstacle Markers
        if len(self.sim.environment.obstacles) > 0:
            o_arr = np.array([o.position for o in self.sim.environment.obstacles])
            self.obs_scat._offsets3d = (o_arr[:, 0], o_arr[:, 1], o_arr[:, 2])
        else:
            self.obs_scat._offsets3d = ([], [], [])

        # Draw Stems
        for line in self.stem_lines:
            line.remove()
        self.stem_lines = []

        for t in self.sim.targets:
            (line,) = self.ax.plot(
                [t[0], t[0]], [t[1], t[1]], [0, t[2]], "r--", alpha=0.5
            )
            self.stem_lines.append(line)
        for f in self.sim.friends:
            (line,) = self.ax.plot(
                [f[0], f[0]], [f[1], f[1]], [0, f[2]], "g--", alpha=0.5
            )
            self.stem_lines.append(line)
        for o in self.sim.environment.obstacles:
            # Obstacles get a black stem
            (line,) = self.ax.plot(
                [o.position[0], o.position[0]],
                [o.position[1], o.position[1]],
                [0, o.position[2]],
                "k--",
                alpha=0.5,
            )
            self.stem_lines.append(line)

        return (
            self.scat,
            self.enemy_scat,
            self.friend_scat,
            self.obs_scat,
            *self.stem_lines,
        )

    def start(self):
        """Starts the animation loop and shows the plot."""
        # MacOSX backend often needs explicit draw_idle or pause to update
        self.ani = animation.FuncAnimation(
            self.fig, self.update, interval=50, blit=False
        )
        plt.show()


def animate_swarm(history, interval=50):
    """Generates a static animation from a pre-computed history.

    Args:
        history (np.ndarray): Array of positions (steps, num_drones, 3).
        interval (int, optional): Frame interval in ms. Defaults to 50.
    """
    fig = plt.figure(figsize=(10, 8))
    ax = fig.add_subplot(111, projection="3d")
    ax.set_xlim(0, BOUNDS[0])
    ax.set_ylim(0, BOUNDS[1])
    ax.set_zlim(0, BOUNDS[2])

    scat = ax.scatter([], [], [], c="b", marker="o")

    def update(frame):
        positions = history[frame]
        scat._offsets3d = (positions[:, 0], positions[:, 1], positions[:, 2])
        return (scat,)

    _ani = animation.FuncAnimation(  # noqa: F841
        fig, update, frames=len(history), interval=interval, blit=False
    )
    plt.show()
