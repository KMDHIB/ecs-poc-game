import { Registry } from "@app/esc/registry";
import {
  Position,
  Velocity,
  Ship,
  Renderable,
  Health,
  Bullet,
  Enemy,
  Lifespan,
} from "@app/esc/components";
import {
  PLAYER_MAX_HEALTH,
  PLAYER_RADIUS,
  BULLET_SPEED,
  BULLET_LIFESPAN,
  BULLET_DAMAGE,
  BULLET_RADIUS,
  ENEMY_RADIUS,
  ENEMY_HEALTH,
  ENEMY_SCORE_VALUE,
} from "./types";

let entityCounter = 0;

function generateEntityId(): string {
  return `entity_${entityCounter++}`;
}

export function createPlayer(registry: Registry, x: number, y: number): string {
  const id = generateEntityId();
  registry.addComponents(id, [
    new Position(x, y),
    new Velocity(0, 0),
    new Ship("player", 0),
    new Renderable("triangle", "#00ff00", PLAYER_RADIUS),
    new Health(PLAYER_MAX_HEALTH, PLAYER_MAX_HEALTH),
  ]);
  return id;
}

export function createEnemy(registry: Registry, x: number, y: number): string {
  const id = generateEntityId();
  registry.addComponents(id, [
    new Position(x, y),
    new Velocity(0, 0), // Velocity will be set by enemy AI
    new Ship("enemy", 0),
    new Renderable("circle", "#ff0000", ENEMY_RADIUS),
    new Health(ENEMY_HEALTH, ENEMY_HEALTH),
    new Enemy(ENEMY_SCORE_VALUE),
  ]);
  return id;
}

export function createBullet(
  registry: Registry,
  x: number,
  y: number,
  angle: number,
  ownerId: string,
): string {
  const id = generateEntityId();
  const vx = Math.cos(angle) * BULLET_SPEED;
  const vy = Math.sin(angle) * BULLET_SPEED;

  registry.addComponents(id, [
    new Position(x, y),
    new Velocity(vx, vy),
    new Renderable("circle", "#ffff00", BULLET_RADIUS),
    new Bullet(BULLET_DAMAGE, ownerId),
    new Lifespan(BULLET_LIFESPAN),
  ]);
  return id;
}
