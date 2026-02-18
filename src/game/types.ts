export interface GameState {
  score: number;
  gameOver: boolean;
  elapsedTime: number;
}

export interface InputState {
  keysPressed: Set<string>;
  mousePos: { x: number; y: number };
  mouseDown: boolean;
  lastShotTime: number;
}

// Game constants
export const PLAYER_SPEED = 200; // pixels per second
export const BULLET_SPEED = 400; // pixels per second
export const BULLET_LIFESPAN = 2000; // milliseconds
export const BULLET_COOLDOWN = 200; // milliseconds
export const BULLET_DAMAGE = 25;

export const ENEMY_SPEED = 80; // pixels per second
export const ENEMY_HEALTH = 25;
export const ENEMY_SCORE_VALUE = 10;
export const ENEMY_SPAWN_INTERVAL = 2000; // milliseconds (decreases over time)
export const ENEMY_COLLISION_DAMAGE = 20;

export const PLAYER_MAX_HEALTH = 100;
export const PLAYER_RADIUS = 15;
export const BULLET_RADIUS = 3;
export const ENEMY_RADIUS = 12;
