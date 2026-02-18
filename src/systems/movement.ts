import { Registry } from "@app/esc/registry";
import { Position, Velocity } from "@app/esc/components";

export function movementSystem(registry: Registry, deltaTime: number) {
  // Query all entities with position and velocity
  const entities = registry.query(Position, Velocity);

  const deltaSeconds = deltaTime / 1000;

  for (const [position, velocity] of entities) {
    // Apply velocity to position based on delta time
    position.x += velocity.dx * deltaSeconds;
    position.y += velocity.dy * deltaSeconds;
  }
}
