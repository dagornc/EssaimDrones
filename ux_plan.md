# Implementation Plan: Improved Positioning UX

## 1. Goal
Make positioning of Enemy and Friendly units "easier" and more intuitive in the 3D simulation.

## 2. Proposed Features
1.  **Scroll Wheel Depth Control**:
    *   Mouse Scroll Up/Down modifies the Z-coordinate (depth) of the *last placed* or *nearest* unit.
    *   This solves the "3D placement on 2D screen" problem.
2.  **Selection Logic**:
    *   Clicking near an existing unit selects it (highlight).
    *   Subsequent clicks move the *selected* unit.
3.  **Visual Feedback**:
    *   Display the coordinates of the selected/last placed unit on screen.
    *   Draw a vertical line (stem) from the unit to the "sea floor" (Z=0) or surface (Z=100) to help visualize depth.

## 3. Changes
### `viz.py`
*   Add `scroll_event` handler to `LiveVisualizer`.
*   Add `selected_unit_type` ('enemy' or 'friend') and `selected_unit_index`.
*   Update `on_click` to select units if clicked close.
*   Update `update()` to draw "stem" lines for targets.
*   Add text overlay for "Selected Unit Depth: Z=...".

## 4. Verification
*   **Manual Test**:
    1.  Run simulation.
    2.  Click to place enemy.
    3.  Scroll wheel -> Verify enemy moves up/down.
    4.  Switch to 3D view -> Verify depth change is visible.
