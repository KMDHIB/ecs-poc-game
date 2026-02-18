import { Registry } from "@app/esc/registry";
import { Ship, Velocity } from "@app/esc/components";
import { InputState, PLAYER_SPEED } from "@app/game/types";

export function inputSystem(registry: Registry, inputState: InputState) {
  // Query for player ship entities with velocity
  const entities = registry.query(Ship, Velocity);

  for (const [ship, velocity] of entities) {
    if (ship.type !== "player") continue;

    let vx = 0;
    let vy = 0;

    // WASD movement
    if (inputState.keysPressed.has("w") || inputState.keysPressed.has("W")) {
      vy -= 1;
    }
    if (inputState.keysPressed.has("s") || inputState.keysPressed.has("S")) {
      vy += 1;
    }
    if (inputState.keysPressed.has("a") || inputState.keysPressed.has("A")) {
      vx -= 1;
    }
    if (inputState.keysPressed.has("d") || inputState.keysPressed.has("D")) {
      vx += 1;
    }

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      const magnitude = Math.sqrt(vx * vx + vy * vy);
      vx /= magnitude;
      vy /= magnitude;
    }

    // Apply speed
    velocity.dx = vx * PLAYER_SPEED;
    velocity.dy = vy * PLAYER_SPEED;
  }
}
