"""Defines the Drone agent class.

This module contains the `Drone` class, which represents an individual agent
in the swarm simulation. It handles physics integration, force application,
and state management for various behaviors.
"""

import numpy as np
from .config import *
from .safety import SafetyMonitor

class Drone:
    """Represents a single underwater drone agent.

    Attributes:
        id (int): Unique identifier for the drone.
        position (np.ndarray): 3D position vector [x, y, z].
        velocity (np.ndarray): 3D velocity vector [vx, vy, vz].
        acceleration (np.ndarray): 3D acceleration vector [ax, ay, az].
        mass (float): Mass of the drone in kg.
        drag_factor (float): Multiplier for drag calculation (used for drafting).
        pso_best_position (np.ndarray): Best known position for PSO.
        pso_best_score (float): Best known score for PSO.
        flash_timer (float): Timer for flash expansion behavior.
        flash_direction (np.ndarray): Direction vector for flash expansion.
        safety (SafetyMonitor): Safety module for the drone.
    """
    def __init__(self, id, start_pos):
        self.id = id
        self.position = np.array(start_pos, dtype=float)
        self.velocity = np.random.uniform(-1, 1, 3)
        self.acceleration = np.zeros(3)
        self.mass = MASS
        self.drag_factor = 1.0 # Multiplier for drag (used for drafting)
        
        # PSO State
        self.pso_best_position = np.copy(self.position)
        self.pso_best_score = -np.inf
        
        # Flash Expansion State
        self.flash_timer = 0.0
        self.flash_direction = np.zeros(3)
        
        # Safety Module
        self.safety = SafetyMonitor(self)

    def update(self, dt):
        """Updates the drone's physics state using Euler integration.

        Calculates the new velocity and position based on accumulated forces
        (acceleration), applies speed limits, and resets the acceleration
        accumulator for the next step.

        Args:
            dt (float): Time step in seconds.
        """
        # Limit force
        if np.linalg.norm(self.acceleration) > MAX_FORCE:
            self.acceleration = (self.acceleration / np.linalg.norm(self.acceleration)) * MAX_FORCE

        # F = ma -> a = F/m
        # We treat self.acceleration as "Force applied" in the flocking step, 
        # so actual acceleration is Force / Mass.
        actual_accel = self.acceleration / self.mass
        
        self.velocity += actual_accel * dt
        
        # Limit speed
        speed = np.linalg.norm(self.velocity)
        if speed > MAX_SPEED:
            self.velocity = (self.velocity / speed) * MAX_SPEED
            
        self.position += self.velocity * dt
        
        # Reset acceleration (force accumulator) for next step
        self.acceleration = np.zeros(3)
        self.drag_factor = 1.0 # Reset drafting status

    def apply_force(self, force):
        """Applies a force vector to the drone.

        Args:
            force (np.ndarray): 3D force vector to apply.
        """
        self.acceleration += force

    def apply_drag(self, fluid_velocity):
        """Applies hydrodynamic drag force based on relative velocity.

        Calculates drag using a simplified quadratic drag equation:
        F_d = -0.5 * rho * Cd * A * v^2 * unit_vector(v)

        Args:
            fluid_velocity (np.ndarray): Velocity vector of the surrounding fluid.
        """
        relative_vel = self.velocity - fluid_velocity
        speed = np.linalg.norm(relative_vel)
        if speed > 0:
            # Quadratic drag simplified
            drag_mag = 0.5 * WATER_DENSITY * (DRAG_COEFF * self.drag_factor) * 0.01 * (speed**2) 
            # 0.01 is arbitrary reference area
            
            drag_force = - (relative_vel / speed) * drag_mag
            self.apply_force(drag_force)

    def calculate_forces(self, neighbors, environment, targets, friends, mode):
        """Calculates the net force based on local perception and current mode.
        
        Args:
            neighbors (list[Drone]): List of nearby drones.
            environment (Environment): The simulation environment.
            targets (list[np.ndarray]): List of enemy/target positions.
            friends (list[np.ndarray]): List of friendly unit positions.
            mode (SwarmMode): Current behavior mode.
        """
        # Get params for current mode
        params = MODE_PARAMS[mode]
        w_sep = params["sep"]
        w_ali = params["ali"]
        w_coh = params["coh"]
        w_target = params["target"]
        
        # 1. Perception (Neighbors processed by caller for efficiency or here?)
        # Caller passes 'neighbors' list which are already filtered by distance ideally, 
        # but here we might receive all and filter. Let's assume caller gives us relevant ones 
        # or we filter here. For distributed sim, we filter here.
        
        # Filter neighbors by range
        nearby_drones = []
        for n in neighbors:
            if n.id == self.id: continue
            dist = np.linalg.norm(n.position - self.position)
            if dist < PERCEPTION_RADIUS:
                nearby_drones.append(n)
        
        # 2. Bio-Inspired Forces
        f_sep = np.zeros(3)
        f_ali = np.zeros(3)
        f_coh = np.zeros(3)
        
        # --- FLASH EXPANSION LOGIC ---
        if self.flash_timer > 0:
            self.flash_timer -= DT # Using global DT
            self.apply_force(self.flash_direction * MAX_FORCE * 2.0)
            self.velocity *= 0.95
            return # Skip other forces
        
        if mode == SwarmMode.FLASH_EXPANSION or (len(targets) > 0 and mode != SwarmMode.ATTACK):
             # Trigger logic (simplified)
             dists_to_enemies = [np.linalg.norm(t - self.position) for t in targets]
             if dists_to_enemies and min(dists_to_enemies) < FLASH_TRIGGER_DIST:
                 self.flash_timer = FLASH_DURATION
                 nearest_enemy = targets[np.argmin(dists_to_enemies)]
                 escape_dir = self.position - nearest_enemy
                 if np.linalg.norm(escape_dir) == 0: escape_dir = np.random.uniform(-1, 1, 3)
                 self.flash_direction = escape_dir / np.linalg.norm(escape_dir)
                 return
        # -----------------------------

        if nearby_drones:
            # Separation
            for n in nearby_drones:
                diff = self.position - n.position
                dist = np.linalg.norm(diff)
                if dist < 0.1: dist = 0.1
                f_sep += (diff / dist) / dist # Weight by inverse distance
            
            # Alignment
            avg_vel = np.mean([n.velocity for n in nearby_drones], axis=0)
            f_ali = avg_vel - self.velocity
            
            # Cohesion
            avg_pos = np.mean([n.position for n in nearby_drones], axis=0)
            f_coh = avg_pos - self.position
            
            # Drafting Logic
            for n in nearby_drones:
                vec_n_to_me = self.position - n.position
                dist_n = np.linalg.norm(vec_n_to_me)
                n_speed = np.linalg.norm(n.velocity)
                if n_speed > 0.1 and dist_n < 5.0:
                    n_dir = n.velocity / n_speed
                    alignment = np.dot(vec_n_to_me / dist_n, n_dir)
                    if alignment > 0.8:
                        self.drag_factor = 1.0 - DRAFTING_BONUS
                        break

        def normalize(v):
            n = np.linalg.norm(v)
            return v / n * MAX_FORCE if n > 0 else v

        f_sep = normalize(f_sep) * w_sep
        f_ali = normalize(f_ali) * w_ali
        f_coh = normalize(f_coh) * w_coh
        
        # 3. Target / Mission Logic
        f_target = np.zeros(3)
        goal_point = None
        is_encircle = (mode == SwarmMode.ENCIRCLE or mode == SwarmMode.PREDATOR_PACK)
        
        if mode == SwarmMode.DEFEND and len(friends) > 0:
            dists = [np.linalg.norm(f - self.position) for f in friends]
            goal_point = friends[np.argmin(dists)]
            
        elif mode == SwarmMode.SHIELD and len(friends) > 0:
             dists = [np.linalg.norm(f - self.position) for f in friends]
             center_point = friends[np.argmin(dists)]
             to_center = self.position - center_point
             dist_center = np.linalg.norm(to_center)
             DESIRED_RADIUS = 15.0
             f_radial = normalize(center_point - self.position) * (dist_center - DESIRED_RADIUS)
             up = np.array([0, 0, 1])
             tangent = np.cross(to_center, up)
             f_tangent = normalize(tangent) * MAX_FORCE
             angle = np.arctan2(to_center[1], to_center[0])
             target_z = center_point[2] + 5.0 * np.sin(angle * 3.0)
             f_vertical = np.array([0, 0, target_z - self.position[2]]) * 5.0
             f_target = (f_radial + f_tangent + f_vertical) * w_target
             
        elif (mode == SwarmMode.ATTACK or is_encircle) and len(targets) > 0:
            dists = [np.linalg.norm(t - self.position) for t in targets]
            goal_point = targets[np.argmin(dists)]
            
        elif (mode == SwarmMode.PATROL or mode == SwarmMode.SCHOOLING) and len(targets) > 0:
             dists = [np.linalg.norm(t - self.position) for t in targets]
             goal_point = targets[np.argmin(dists)]
             
        elif mode == SwarmMode.SEARCH or mode == SwarmMode.EXPLORATION:
            # PSO / Exploration Logic
            search_target = BOUNDS / 2.0
            current_fitness = -np.linalg.norm(self.position - search_target)
            if current_fitness > self.pso_best_score:
                self.pso_best_score = current_fitness
                self.pso_best_position = np.copy(self.position)
            
            best_neighbor_pos = self.pso_best_position
            best_neighbor_score = self.pso_best_score
            for n in nearby_drones:
                if n.pso_best_score > best_neighbor_score:
                    best_neighbor_score = n.pso_best_score
                    best_neighbor_pos = n.pso_best_position
            
            r1 = np.random.rand(3)
            r2 = np.random.rand(3)
            v_inertia = self.velocity * PSO_INERTIA
            v_cognitive = PSO_COGNITIVE * r1 * (self.pso_best_position - self.position)
            v_social = PSO_SOCIAL * r2 * (best_neighbor_pos - self.position)
            new_velocity = v_inertia + v_cognitive + v_social
            f_target = (new_velocity - self.velocity) * w_target

        if goal_point is not None and mode != SwarmMode.SHIELD:
            if is_encircle:
                to_target = goal_point - self.position
                dist_target = np.linalg.norm(to_target)
                if dist_target > 0:
                    DESIRED_RADIUS = 25.0
                    f_radial = normalize(to_target) * (dist_target - DESIRED_RADIUS)
                    up = np.array([0, 0, 1])
                    tangent = np.cross(to_target, up)
                    f_tangent = normalize(tangent) * MAX_FORCE
                    f_target = (f_radial + f_tangent) * w_target
            else:
                f_target = normalize(goal_point - self.position) * w_target

        # 4. Obstacle Avoidance & Safety
        f_avoid = self.safety.check_collisions(nearby_drones, environment.obstacles)
        f_bounds = self.safety.check_geofence()
        
        # 5. Apply Total Force
        total_force = f_sep + f_ali + f_coh + f_target + f_avoid + f_bounds
        self.apply_force(total_force)

