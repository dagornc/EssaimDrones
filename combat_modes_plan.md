# Implementation Plan: Combat Swarm Modes

## 1. Goal
Implement distinct behavior modes for the underwater drone swarm, inspired by military tactics and bio-inspired algorithms.

## 2. Selected Modes
We will implement 4 distinct modes that alter the Boids weights and add specific steering behaviors:

1.  **PATROL (Scout)**:
    *   *Goal*: Cover area, detect targets.
    *   *Weights*: High Separation, Low Cohesion, Low Alignment.
    *   *Behavior*: Move faster, wider formation.
    
2.  **ATTACK (Engage)**:
    *   *Goal*: Converge on target rapidly.
    *   *Weights*: High Alignment, High Target Attraction, Low Separation (allow density).
    *   *Behavior*: Max speed, "Arrow" formation effect via high alignment.

3.  **DEFEND (Schooling)**:
    *   *Goal*: Protect self/leader, stay tight.
    *   *Weights*: Max Cohesion, High Alignment, High Separation (short range only to avoid crash).
    *   *Behavior*: Tight ball or rotating torus (if possible). High drafting bonus usage.

4.  **ENCIRCLE (Surround)**:
    *   *Goal*: Orbit a target without touching it.
    *   *Weights*: Medium Cohesion.
    *   *Behavior*: Add a tangential force component relative to the target vector. $\vec{F}_{orbit} = \vec{V}_{target} \times \vec{Up}$.

## 3. Changes
### `config.py`
*   Add `SwarmMode` Enum.
*   Add a dictionary `MODE_PARAMS` defining weights for each mode.

### `swarm.py`
*   Update `SwarmController.update()` to accept `mode`.
*   Apply weights from `MODE_PARAMS`.
*   Implement `_apply_encirclement_force()` logic.

### `main.py` / `simulation.py`
*   Add CLI argument `--mode`.
*   (Optional) Key press to switch modes during viz.

## 4. Verification
*   Run simulation in each mode and observe behavior.
*   `PATROL`: Drones spread out.
*   `ATTACK`: Drones rush target.
*   `DEFEND`: Drones clump.
*   `ENCIRCLE`: Drones spin around target.
