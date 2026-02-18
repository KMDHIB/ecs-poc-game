import { Registry } from "@app/esc/registry";
import { Ship, Position } from "@app/esc/components";
import { BULLET_COOLDOWN } from "@app/game/constants";
import { InputState } from "@app/game/types";
import { createBullet } from "@app/game/entities";

export function shootingSystem(
  registry: Registry,
  inputState: InputState,
  currentTime: number,
) {
  // Check if we can shoot (cooldown and mouse down)
  if (!inputState.mouseDown) return;
  if (currentTime - inputState.lastShotTime < BULLET_COOLDOWN) return;

  // Query for player ship with position
  const entities = registry.query(Ship, Position);

  for (const [ship, position] of entities) {
    if (ship.type !== "player") continue;

    // Calculate angle from player to mouse
    const dx = inputState.mousePos.x - position.x;
    const dy = inputState.mousePos.y - position.y;
    const angle = Math.atan2(dy, dx);

    // Create bullet at player position with calculated angle
    createBullet(registry, position.x, position.y, angle, "player");

    // Update last shot time
    inputState.lastShotTime = currentTime;
  }
}
