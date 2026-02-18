import { Registry } from "@app/esc/registry";
import { Lifespan } from "@app/esc/components";

export function lifespanSystem(registry: Registry, deltaTime: number) {
  // Query all entities with lifespan
  const entities = registry.queryWithIds(Lifespan);

  for (const [entityId, lifespan] of entities) {
    // Tick the lifespan and check if expired
    const expired = lifespan.tick(deltaTime);

    if (expired) {
      registry.deleteEntity(entityId);
    }
  }
}
