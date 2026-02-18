export class Velocity {
  dx: number;
  dy: number;

  constructor(dx: number, dy: number) {
    this.dx = dx;
    this.dy = dy;
  }
}

// >>>>--------------------------------------------------------------------------------<<<<<

export class Position {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  move(velocity: Velocity) {
    this.x += velocity.dx;
    this.y += velocity.dy;
  }

  get_is_colliding(other: Position): boolean {
    return this.x === other.x && this.y === other.y;
  }
}

// >>>>--------------------------------------------------------------------------------<<<<<
// Game Components for Top-Down Shooter
// >>>>--------------------------------------------------------------------------------<<<<<

export class Ship {
  type: "player" | "enemy";
  rotation: number;

  constructor(type: "player" | "enemy", rotation: number = 0) {
    this.type = type;
    this.rotation = rotation;
  }
}

// >>>>--------------------------------------------------------------------------------<<<<<

// Todo: replace with sprites.
export class Renderable {
  shape: "circle" | "triangle";
  color: string;
  radius: number;

  constructor(shape: "circle" | "triangle", color: string, radius: number) {
    this.shape = shape;
    this.color = color;
    this.radius = radius;
  }
}

// >>>>--------------------------------------------------------------------------------<<<<<

export class Health {
  current: number;
  max: number;

  constructor(current: number, max: number) {
    this.current = current;
    this.max = max;
  }

  heal(amount: number) {
    this.current = Math.min(this.max, this.current + amount);
  }

  damage(amount: number) {
    this.current = Math.max(0, this.current - amount);
  }

  isAlive(): boolean {
    return this.current > 0;
  }
}

// >>>>--------------------------------------------------------------------------------<<<<<

export class Bullet {
  damage: number;
  ownerId: string;

  constructor(damage: number, ownerId: string) {
    this.damage = damage;
    this.ownerId = ownerId;
  }
}

// >>>>--------------------------------------------------------------------------------<<<<<

export class Enemy {
  scoreValue: number;

  constructor(scoreValue: number = 10) {
    this.scoreValue = scoreValue;
  }
}

// >>>>--------------------------------------------------------------------------------<<<<<

export class Lifespan {
  remainingMs: number;

  constructor(remainingMs: number) {
    this.remainingMs = remainingMs;
  }

  tick(deltaMs: number): boolean {
    this.remainingMs -= deltaMs;
    return this.remainingMs <= 0;
  }
}

// >>>>--------------------------------------------------------------------------------<<<<<

export class DamageIndicator {
  damage: number;
  lifespan: number;
  maxLifespan: number;

  constructor(damage: number, lifespan: number = 1000) {
    this.damage = damage;
    this.lifespan = lifespan;
    this.maxLifespan = lifespan;
  }

  tick(deltaMs: number): boolean {
    this.lifespan -= deltaMs;
    return this.lifespan <= 0;
  }

  getOpacity(): number {
    return this.lifespan / this.maxLifespan;
  }
}

// >>>>--------------------------------------------------------------------------------<<<<<

export class Explosion {
  startRadius: number;
  lifespan: number;
  maxLifespan: number;

  constructor(startRadius: number, lifespan: number = 500) {
    this.startRadius = startRadius;
    this.lifespan = lifespan;
    this.maxLifespan = lifespan;
  }

  tick(deltaMs: number): boolean {
    this.lifespan -= deltaMs;
    return this.lifespan <= 0;
  }

  getRadius(): number {
    const progress = 1 - this.lifespan / this.maxLifespan;
    return this.startRadius * (1 + progress * 2); // Grows to 3x size
  }

  getOpacity(): number {
    return this.lifespan / this.maxLifespan;
  }
}
