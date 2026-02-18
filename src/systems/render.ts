import { Registry } from "@app/esc/registry";
import {
  Position,
  Renderable,
  Ship,
  Health,
  DamageIndicator,
  Explosion,
} from "@app/esc/components";
import { GameState } from "@app/game/types";

export function renderSystem(
  registry: Registry,
  canvas: HTMLCanvasElement,
  gameState: GameState,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw all renderable entities
  const entities = registry.queryWithIds(Position, Renderable);

  for (const [entityId, position, renderable] of entities) {
    ctx.save();

    // Check if this is an explosion (needs opacity)
    const explosions = registry.queryWithIds(Explosion, Renderable);
    let explosionOpacity = 1;
    for (const [expId, explosion, expRenderable] of explosions) {
      if (expId === entityId) {
        explosionOpacity = explosion.getOpacity();
        break;
      }
    }

    ctx.globalAlpha = explosionOpacity;
    ctx.fillStyle = renderable.color;
    ctx.strokeStyle = renderable.color;

    // Check if entity has a Ship component for rotation
    const shipEntities = registry.queryWithIds(Ship, Position);
    let rotation = 0;
    for (const [shipId, ship, shipPos] of shipEntities) {
      if (shipId === entityId) {
        rotation = ship.rotation;
        break;
      }
    }

    if (renderable.shape === "circle") {
      // Draw circle
      ctx.beginPath();
      ctx.arc(position.x, position.y, renderable.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (renderable.shape === "triangle") {
      // Draw triangle (pointing in direction of rotation)
      ctx.translate(position.x, position.y);
      ctx.rotate(rotation);

      ctx.beginPath();
      ctx.moveTo(renderable.radius, 0); // Point
      ctx.lineTo(-renderable.radius / 2, -renderable.radius / 2);
      ctx.lineTo(-renderable.radius / 2, renderable.radius / 2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw damage indicators
  const damageIndicators = registry.queryWithIds(DamageIndicator, Position);
  for (const [entityId, indicator, position] of damageIndicators) {
    ctx.save();
    ctx.globalAlpha = indicator.getOpacity();
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.font = "bold 16px monospace";
    ctx.lineWidth = 3;
    ctx.textAlign = "center";
    ctx.strokeText(`-${indicator.damage}`, position.x, position.y);
    ctx.fillText(`-${indicator.damage}`, position.x, position.y);
    ctx.restore();
  }

  // Draw UI
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px monospace";

  // Score
  ctx.fillText(`Score: ${gameState.score}`, 20, 30);

  // Player health
  const playerEntities = registry.query(Ship, Health);
  for (const [ship, health] of playerEntities) {
    if (ship.type === "player") {
      ctx.fillText(
        `Health: ${Math.max(0, health.current)}/${health.max}`,
        20,
        60,
      );
      break;
    }
  }

  ctx.restore();
}
