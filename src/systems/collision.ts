import { Registry } from "@app/esc/registry";
import {
  Position,
  Bullet,
  Enemy,
  Health,
  Ship,
  Renderable,
} from "@app/esc/components";
import { createDamageIndicator, createExplosion } from "@app/game/entities";
import { ENEMY_COLLISION_DAMAGE } from "@app/game/constants";
import { GameState } from "@app/game/types";

function checkCircleCollision(
  pos1: Position,
  radius1: number,
  pos2: Position,
  radius2: number,
): boolean {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < radius1 + radius2;
}

export function collisionSystem(registry: Registry, gameState: GameState) {
  // Get all bullets with entity IDs
  const bullets = registry.queryWithIds(Bullet, Position, Renderable);
  // Get all enemies with entity IDs
  const enemies = registry.queryWithIds(Enemy, Position, Health, Renderable);
  // Get player with entity ID
  const players = registry.queryWithIds(Ship, Position, Health, Renderable);

  const entitiesToDelete = new Set<string>();

  // Check bullet-enemy collisions
  for (const [bulletId, bullet, bulletPos, bulletRenderable] of bullets) {
    if (bullet.ownerId !== "player") continue; // Only player bullets for now

    for (const [
      enemyId,
      enemy,
      enemyPos,
      enemyHealth,
      enemyRenderable,
    ] of enemies) {
      if (entitiesToDelete.has(enemyId)) continue;

      // Check collision
      if (
        checkCircleCollision(
          bulletPos,
          bulletRenderable.radius,
          enemyPos,
          enemyRenderable.radius,
        )
      ) {
        // Damage enemy
        enemyHealth.damage(bullet.damage);

        // Create damage indicator
        createDamageIndicator(
          registry,
          enemyPos.x,
          enemyPos.y - enemyRenderable.radius,
          bullet.damage,
        );

        // Mark bullet for deletion
        entitiesToDelete.add(bulletId);

        // If enemy is dead, create explosion and mark for deletion
        if (!enemyHealth.isAlive()) {
          createExplosion(
            registry,
            enemyPos.x,
            enemyPos.y,
            enemyRenderable.radius,
            enemyRenderable.color,
          );
          entitiesToDelete.add(enemyId);
          gameState.score += enemy.scoreValue;
        }
      }
    }
  }

  // Check enemy-player collisions
  for (const [
    playerId,
    player,
    playerPos,
    playerHealth,
    playerRenderable,
  ] of players) {
    if (player.type !== "player") continue;

    for (const [
      enemyId,
      enemy,
      enemyPos,
      enemyHealth,
      enemyRenderable,
    ] of enemies) {
      if (entitiesToDelete.has(enemyId)) continue;

      // Check collision
      if (
        checkCircleCollision(
          playerPos,
          playerRenderable.radius,
          enemyPos,
          enemyRenderable.radius,
        )
      ) {
        // Damage player
        playerHealth.damage(ENEMY_COLLISION_DAMAGE);

        // Create explosion and kill enemy on collision
        createExplosion(
          registry,
          enemyPos.x,
          enemyPos.y,
          enemyRenderable.radius,
          enemyRenderable.color,
        );
        entitiesToDelete.add(enemyId);

        // Check if player died
        if (!playerHealth.isAlive()) {
          gameState.gameOver = true;
        }
      }
    }
  }

  // Delete all marked entities
  for (const entityId of entitiesToDelete) {
    registry.deleteEntity(entityId);
  }
}
