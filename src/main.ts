import { define, StoreElement } from "@flemminghansen/wc-store";
import { Registry } from "@app/esc/registry";
import { Ship, Position, Health } from "@app/esc/components";
import { GameState, InputState } from "@app/game/types";
import { createPlayer } from "@app/game/entities";
import { inputSystem } from "@app/systems/input";
import { shootingSystem } from "@app/systems/shooting";
import { movementSystem } from "@app/systems/movement";
import { collisionSystem } from "@app/systems/collision";
import { lifespanSystem } from "@app/systems/lifespan";
import { enemySpawnSystem } from "@app/systems/enemySpawner";
import { enemyAISystem } from "@app/systems/enemyAI";
import { damageIndicatorSystem } from "@app/systems/damageIndicator";
import { explosionSystem } from "@app/systems/explosion";
import { renderSystem } from "@app/systems/render";
import "@app/shaderfun2";

function getGameOverTitle(): HTMLHeadingElement {
  const gameOverTitle = document.createElement("h1");
  gameOverTitle.textContent = "GAME OVER";
  gameOverTitle.style.cssText = `
    margin: 0;
    font-family: monospace;
    font-size: 48px;
    font-weight: bold;
    color: #ff0000;
    text-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
  `;
  return gameOverTitle;
}

function getFinalScoreElement(score: number): HTMLParagraphElement {
  const finalScore = document.createElement("p");
  finalScore.id = "final-score";
  finalScore.textContent = `Final Score: ${score}`;
  finalScore.style.cssText = `
    margin: 0;
    font-family: monospace;
    font-size: 24px;
    color: #ffffff;
  `;
  return finalScore;
}

function getRestartButton(onRestart: () => void): HTMLButtonElement {
  const restartButton = document.createElement("button");
  restartButton.textContent = "Restart Game";
  restartButton.style.cssText = `
    padding: 15px 40px;
    font-size: 20px;
    font-family: monospace;
    font-weight: bold;
    background-color: #00ff00;
    color: #000;
    border: 3px solid #fff;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 255, 0, 0.5);
    transition: all 0.2s;
  `;
  restartButton.addEventListener("mouseenter", () => {
    restartButton.style.backgroundColor = "#00cc00";
    restartButton.style.transform = "scale(1.05)";
  });
  restartButton.addEventListener("mouseleave", () => {
    restartButton.style.backgroundColor = "#00ff00";
    restartButton.style.transform = "scale(1)";
  });
  restartButton.addEventListener("click", onRestart);
  return restartButton;
}

function getGameOverOverlay(score: number, onRestart: () => void): HTMLDivElement {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: absolute;
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 30px;
    background-color: rgba(0, 0, 0, 0.85);
    padding: 50px;
    border-radius: 15px;
    border: 3px solid #ff0000;
    box-shadow: 0 0 30px rgba(255, 0, 0, 0.5);
    z-index: 1000;
  `;

  overlay.appendChild(getGameOverTitle());
  overlay.appendChild(getFinalScoreElement(score));
  overlay.appendChild(getRestartButton(onRestart));

  return overlay;
}

define(
  "my-app",
  class extends StoreElement {
    registry = new Registry();
    canvas: HTMLCanvasElement | null = null;
    gameOverOverlay: HTMLDivElement | null = null;
    gameState: GameState = {
      score: 0,
      gameOver: false,
      elapsedTime: 0,
    };
    inputState: InputState = {
      keysPressed: new Set<string>(),
      mousePos: { x: 0, y: 0 },
      mouseDown: false,
      lastShotTime: 0,
    };
    lastFrameTime = 0;
    animationFrameId = 0;
    playerId: string | null = null;

    #gameLoop = (timestamp: number) => {
      if (!this.canvas) return;

      // Calculate delta time
      const deltaTime =
        this.lastFrameTime === 0 ? 0 : timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;
      this.gameState.elapsedTime += deltaTime;

      if (!this.gameState.gameOver) {
        // Hide game over overlay if visible
        if (this.gameOverOverlay) {
          this.gameOverOverlay.style.display = "none";
        }

        // Update player rotation to face mouse
        this.#updatePlayerRotation();

        // Run all systems
        inputSystem(this.registry, this.inputState);
        shootingSystem(this.registry, this.inputState, timestamp);
        enemyAISystem(this.registry);
        movementSystem(this.registry, deltaTime);
        collisionSystem(this.registry, this.gameState);
        lifespanSystem(this.registry, deltaTime);
        damageIndicatorSystem(this.registry, deltaTime);
        explosionSystem(this.registry, deltaTime);
        enemySpawnSystem(
          this.registry,
          this.gameState,
          deltaTime,
          this.canvas.width,
          this.canvas.height,
        );

        // Keep player within canvas bounds
        this.#clampPlayerPosition();
      } else {
        // Show game over overlay and update score
        if (this.gameOverOverlay) {
          this.gameOverOverlay.style.display = "flex";
          const scoreElement = this.gameOverOverlay.querySelector("#final-score");
          if (scoreElement) {
            scoreElement.textContent = `Final Score: ${this.gameState.score}`;
          }
        }
      }

      // Render
      renderSystem(this.registry, this.canvas, this.gameState);

      // Continue loop
      this.animationFrameId = requestAnimationFrame(this.#gameLoop);
    };

    #updatePlayerRotation() {
      const players = this.registry.queryWithIds(Ship, Position);
      for (const [id, ship, position] of players) {
        if (ship.type === "player") {
          const dx = this.inputState.mousePos.x - position.x;
          const dy = this.inputState.mousePos.y - position.y;
          ship.rotation = Math.atan2(dy, dx);
          break;
        }
      }
    }

    #clampPlayerPosition() {
      if (!this.canvas) return;

      const players = this.registry.queryWithIds(Ship, Position);
      for (const [id, ship, position] of players) {
        if (ship.type === "player") {
          position.x = Math.max(
            15,
            Math.min(this.canvas.width - 15, position.x),
          );
          position.y = Math.max(
            15,
            Math.min(this.canvas.height - 15, position.y),
          );
          break;
        }
      }
    }

    #setupEventListeners() {
      // Keyboard events
      window.addEventListener("keydown", (e) => {
        this.inputState.keysPressed.add(e.key);
      });

      window.addEventListener("keyup", (e) => {
        this.inputState.keysPressed.delete(e.key);
      });

      // Mouse events on canvas
      if (this.canvas) {
        this.canvas.addEventListener("mousemove", (e) => {
          const rect = this.canvas!.getBoundingClientRect();
          this.inputState.mousePos.x = e.clientX - rect.left;
          this.inputState.mousePos.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener("mousedown", () => {
          this.inputState.mouseDown = true;
        });

        this.canvas.addEventListener("mouseup", () => {
          this.inputState.mouseDown = false;
        });

        this.canvas.addEventListener("mouseleave", () => {
          this.inputState.mouseDown = false;
        });
      }
    }

    #restartGame = () => {
      // Clear all entities
      const allEntities = this.registry.getAllEntities();
      for (const entityId of allEntities) {
        this.registry.deleteEntity(entityId);
      }

      // Reset game state
      this.gameState.score = 0;
      this.gameState.gameOver = false;
      this.gameState.elapsedTime = 0;

      // Reset input state
      this.inputState.keysPressed.clear();
      this.inputState.mouseDown = false;
      this.inputState.lastShotTime = 0;

      // Reset frame time
      this.lastFrameTime = 0;

      // Create player at center
      if (this.canvas) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        this.playerId = createPlayer(this.registry, centerX, centerY);
      }
    };

    connectedCallback() {
      // Create canvas element
      this.innerHTML = `<div id="app" style="width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; overflow: hidden;"></div>`;

      const appDiv = document.getElementById("app");
      if (!appDiv) return;

      this.canvas = document.createElement("canvas");
      this.canvas.width = window.innerWidth * 0.8;
      this.canvas.height = window.innerHeight * 0.8;
      this.canvas.style.border = "2px solid #333";
      this.canvas.style.backgroundColor = "#000";
      this.canvas.style.cursor = "crosshair";
      appDiv.appendChild(this.canvas);

      // Create game over overlay
      this.gameOverOverlay = getGameOverOverlay(
        this.gameState.score,
        this.#restartGame,
      );
      appDiv.appendChild(this.gameOverOverlay);

      // Setup event listeners
      this.#setupEventListeners();

      // Create player at center
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      this.playerId = createPlayer(this.registry, centerX, centerY);

      // Start game loop
      this.animationFrameId = requestAnimationFrame(this.#gameLoop);
    }

    disconnectedCallback() {
      // Clean up
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    }
  },
);
