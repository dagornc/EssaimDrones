"""Behavior strategies for the drone swarm.

This module implements the Strategy pattern for different swarm behaviors,
using vectorized numpy operations for high performance.
"""

from typing import Any, List, Protocol

import numpy as np

from .config import (BOUNDS, DRAFTING_BONUS, MAX_FORCE, MODE_PARAMS,
                     PERCEPTION_RADIUS, PSO_COGNITIVE, PSO_INERTIA, PSO_SOCIAL,
                     SwarmMode)


def _normalize_vec(vecs: np.ndarray) -> np.ndarray:
    """Normalizes an array of vectors (N x 3) and scales to MAX_FORCE."""
    mags = np.linalg.norm(vecs, axis=1, keepdims=True)
    mags[mags == 0] = 1.0
    return (vecs / mags) * MAX_FORCE


class BehaviorStrategy(Protocol):
    def compute_forces(
        self,
        drones: List[Any],
        positions: np.ndarray,
        velocities: np.ndarray,
        dist_matrix: np.ndarray,
        targets: List[np.ndarray],
        friends: List[np.ndarray],
        mode: SwarmMode,
    ) -> np.ndarray:
        """Computes the net behavior force for all N drones.

        Returns:
            np.ndarray: N x 3 array of forces.
        """
        ...


class BoidsBehavior:
    """Standard Boids principles: Separation, Alignment, Cohesion."""

    def compute_forces(
        self, drones, positions, velocities, dist_matrix, targets, friends, mode
    ) -> np.ndarray:
        N = len(positions)
        forces = np.zeros((N, 3))

        if N <= 1:
            return forces

        params = MODE_PARAMS.get(mode, MODE_PARAMS[SwarmMode.PATROL])
        w_sep = params["sep"]
        w_ali = params["ali"]
        w_coh = params["coh"]
        w_tar = params["target"]

        # Neighbors mask
        mask = dist_matrix < PERCEPTION_RADIUS
        np.fill_diagonal(mask, False)

        f_sep = np.zeros((N, 3))
        f_ali = np.zeros((N, 3))
        f_coh = np.zeros((N, 3))

        for i in range(N):
            neighbors = mask[i]
            if not np.any(neighbors):
                continue

            n_pos = positions[neighbors]
            n_vel = velocities[neighbors]

            # Separation
            diffs = positions[i] - n_pos
            dists = np.maximum(np.linalg.norm(diffs, axis=1, keepdims=True), 0.1)
            f_sep[i] = np.sum((diffs / dists) / dists, axis=0)

            # Alignment
            f_ali[i] = np.mean(n_vel, axis=0) - velocities[i]

            # Cohesion
            f_coh[i] = np.mean(n_pos, axis=0) - positions[i]

            # Drafting Logic
            for j in np.where(neighbors)[0]:
                vec_to_me = positions[i] - positions[j]
                dist_j = dist_matrix[i, j]
                speed_j = np.linalg.norm(velocities[j])
                if speed_j > 0.1 and 0.1 < dist_j < 5.0:
                    n_dir = velocities[j] / speed_j
                    alignment = np.dot(vec_to_me / dist_j, n_dir)
                    if alignment > 0.8:
                        drones[i].drag_factor = 1.0 - DRAFTING_BONUS
                        break

        f_sep = _normalize_vec(f_sep) * w_sep
        f_ali = _normalize_vec(f_ali) * w_ali
        f_coh = _normalize_vec(f_coh) * w_coh

        # Target seeking
        f_tar = np.zeros((N, 3))
        if targets:
            # Simple target: go to nearest target
            for i in range(N):
                dists = [np.linalg.norm(t - positions[i]) for t in targets]
                best_t = targets[np.argmin(dists)]
                f_tar[i] = best_t - positions[i]

            f_tar = _normalize_vec(f_tar) * w_tar

        return f_sep + f_ali + f_coh + f_tar


class PSOBehavior:
    """Particle Swarm Optimization behavior for searching."""

    def compute_forces(
        self, drones, positions, velocities, dist_matrix, targets, friends, mode
    ) -> np.ndarray:
        N = len(positions)
        forces = np.zeros((N, 3))

        search_target = BOUNDS / 2.0
        w_tar = MODE_PARAMS.get(mode, MODE_PARAMS[SwarmMode.PATROL])["target"]

        # Neighbors mask
        mask = dist_matrix < PERCEPTION_RADIUS
        np.fill_diagonal(mask, False)

        for i in range(N):
            current_fitness = -float(np.linalg.norm(positions[i] - search_target))
            if current_fitness > drones[i].pso_best_score:
                drones[i].pso_best_score = current_fitness
                drones[i].pso_best_position = np.copy(positions[i])

            best_neighbor_pos = drones[i].pso_best_position
            best_neighbor_score = drones[i].pso_best_score

            neighbors = np.where(mask[i])[0]
            for j in neighbors:
                if drones[j].pso_best_score > best_neighbor_score:
                    best_neighbor_score = drones[j].pso_best_score
                    best_neighbor_pos = drones[j].pso_best_position

            r1 = np.random.rand(3)
            r2 = np.random.rand(3)

            v_inertia = velocities[i] * PSO_INERTIA
            v_cognitive = (
                PSO_COGNITIVE * r1 * (drones[i].pso_best_position - positions[i])
            )
            v_social = PSO_SOCIAL * r2 * (best_neighbor_pos - positions[i])

            new_velocity = v_inertia + v_cognitive + v_social
            forces[i] = (new_velocity - velocities[i]) * w_tar

        return forces


class SpecializedBehavior:
    """Handles Defend, Encircle, Shield, Flash Expansion patterns."""

    def compute_forces(
        self, drones, positions, velocities, dist_matrix, targets, friends, mode
    ) -> np.ndarray:
        N = len(positions)
        forces = np.zeros((N, 3))

        params = MODE_PARAMS.get(mode, MODE_PARAMS[SwarmMode.PATROL])
        w_tar = params["target"]

        # Base Boids for collision avoidance within Specialized behavior
        mask = dist_matrix < PERCEPTION_RADIUS
        np.fill_diagonal(mask, False)

        # We compute specialized forces per drone
        for i in range(N):
            if mode == SwarmMode.DEFEND and len(friends) > 0:
                dists = [np.linalg.norm(f - positions[i]) for f in friends]
                forces[i] = (
                    _normalize_vec(
                        np.array([friends[np.argmin(dists)] - positions[i]])
                    )[0]
                    * w_tar
                )

            elif mode == SwarmMode.SHIELD and len(friends) > 0:
                dists = [np.linalg.norm(f - positions[i]) for f in friends]
                center_point = friends[np.argmin(dists)]
                to_center = positions[i] - center_point
                dist_center = np.linalg.norm(to_center)
                desired_radius = 15.0

                f_radial = (to_center / max(dist_center, 0.1)) * (
                    dist_center - desired_radius
                )
                up = np.array([0.0, 0.0, 1.0])
                tangent = np.cross(to_center, up)
                norm_tangent = np.linalg.norm(tangent)
                f_tangent = (
                    (tangent / norm_tangent * MAX_FORCE)
                    if norm_tangent > 0
                    else np.zeros(3)
                )

                angle = np.arctan2(to_center[1], to_center[0])
                target_z = center_point[2] + 5.0 * np.sin(angle * 3.0)
                f_vertical = np.array([0.0, 0.0, target_z - positions[i][2]]) * 5.0

                forces[i] = (f_radial + f_tangent + f_vertical) * w_tar

            elif (
                mode in (SwarmMode.ENCIRCLE, SwarmMode.PREDATOR_PACK)
                and len(targets) > 0
            ):
                dists = [np.linalg.norm(t - positions[i]) for t in targets]
                goal_point = targets[np.argmin(dists)]
                to_target = goal_point - positions[i]
                dist_target = np.linalg.norm(to_target)
                if dist_target > 0:
                    desired_radius = 25.0
                    f_radial = (to_target / dist_target) * (
                        dist_target - desired_radius
                    )
                    up = np.array([0.0, 0.0, 1.0])
                    tangent = np.cross(to_target, up)
                    norm_tangent = np.linalg.norm(tangent)
                    f_tangent = (
                        (tangent / norm_tangent * MAX_FORCE)
                        if norm_tangent > 0
                        else np.zeros(3)
                    )
                    forces[i] = (f_radial + f_tangent) * w_tar

        # Add base Boids on top if we're not purely fleeing
        boids = BoidsBehavior()
        f_boids = boids.compute_forces(
            drones, positions, velocities, dist_matrix, targets, friends, mode
        )

        # Only add boids where flash_timer is 0
        active_mask = np.array([d.flash_timer <= 0 for d in drones])
        forces[active_mask] += f_boids[active_mask]

        return forces


def behavior_factory(mode: SwarmMode) -> BehaviorStrategy:
    """Returns the appropriate behavior strategy for the given mode."""
    if mode in (SwarmMode.SEARCH, SwarmMode.EXPLORATION):
        return PSOBehavior()
    elif mode in (
        SwarmMode.DEFEND,
        SwarmMode.SHIELD,
        SwarmMode.ENCIRCLE,
        SwarmMode.PREDATOR_PACK,
        SwarmMode.FLASH_EXPANSION,
    ):
        return SpecializedBehavior()
    else:
        return BoidsBehavior()
