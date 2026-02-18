import { Registry } from "@app/esc/registry";
import { createEnemy } from "@app/game/entities";
import { ENEMY_SPAWN_INTERVAL } from "@app/game/constants";
import { GameState } from "@app/game/types";

let lastSpawnTime = 0;

export function enemySpawnSystem(
  registry: Registry,
  gameState: GameState,
  deltaTime: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  if (gameState.gameOver) return;

  lastSpawnTime += deltaTime;

  // Calculate spawn interval (decreases with time to increase difficulty)
  const difficultyMultiplier = Math.max(0.3, 1 - gameState.elapsedTime / 60000); // Gets faster over 60 seconds
  const currentSpawnInterval = ENEMY_SPAWN_INTERVAL * difficultyMultiplier;

  if (lastSpawnTime >= currentSpawnInterval) {
    lastSpawnTime = 0;

    // Random edge spawn position
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x: number, y: number;

    switch (edge) {
      case 0: // Top
        x = Math.random() * canvasWidth;
        y = -20;
        break;
      case 1: // Right
        x = canvasWidth + 20;
        y = Math.random() * canvasHeight;
        break;
      case 2: // Bottom
        x = Math.random() * canvasWidth;
        y = canvasHeight + 20;
        break;
      case 3: // Left
        x = -20;
        y = Math.random() * canvasHeight;
        break;
      default:
        x = 0;
        y = 0;
    }

    // Create enemy at edge
    // Velocity will be set by enemyAISystem to track the player
    createEnemy(registry, x, y);
  }
}
