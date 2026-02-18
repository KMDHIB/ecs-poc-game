import { Registry } from "@app/esc/registry";
import { Position, Renderable, Ship, Health } from "@app/esc/components";
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

  // Game over
  if (gameState.gameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ff0000";
    ctx.font = "48px monospace";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = "#ffffff";
    ctx.font = "24px monospace";
    ctx.fillText(
      `Final Score: ${gameState.score}`,
      canvas.width / 2,
      canvas.height / 2 + 20,
    );

    ctx.font = "16px monospace";
    ctx.fillText(
      "Refresh to play again",
      canvas.width / 2,
      canvas.height / 2 + 60,
    );
  }

  ctx.restore();
}
