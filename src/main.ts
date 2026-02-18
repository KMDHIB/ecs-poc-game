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
import { renderSystem } from "@app/systems/render";
import "@app/shaderfun2";

define(
  "my-app",
  class extends StoreElement {
    registry = new Registry();
    canvas: HTMLCanvasElement | null = null;
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
        // Update player rotation to face mouse
        this.#updatePlayerRotation();

        // Run all systems
        inputSystem(this.registry, this.inputState);
        shootingSystem(this.registry, this.inputState, timestamp);
        movementSystem(this.registry, deltaTime);
        collisionSystem(this.registry, this.gameState);
        lifespanSystem(this.registry, deltaTime);
        enemySpawnSystem(
          this.registry,
          this.gameState,
          deltaTime,
          this.canvas.width,
          this.canvas.height,
        );

        // Keep player within canvas bounds
        this.#clampPlayerPosition();
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

    connectedCallback() {
      // Create canvas element
      this.innerHTML = `<div id="app" style="width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; overflow: hidden;"></div>`;

      const appDiv = document.getElementById("app");
      if (!appDiv) return;

      this.canvas = document.createElement("canvas");
      this.canvas.width = 800;
      this.canvas.height = 600;
      this.canvas.style.border = "2px solid #333";
      this.canvas.style.backgroundColor = "#000";
      this.canvas.style.cursor = "crosshair";
      appDiv.appendChild(this.canvas);

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
