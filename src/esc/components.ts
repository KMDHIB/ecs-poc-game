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

export class Player {
  first_name: string;
  last_name: string;

  constructor(first_name: string, last_name: string) {
    this.first_name = first_name;
    this.last_name = last_name;
  }

  get_full_name(): string {
    return `${this.first_name} ${this.last_name}`;
  }
}

// >>>>--------------------------------------------------------------------------------<<<<<

type TreeSpecies = "Oak" | "Pine" | "Birch";
type TreeSize = "sapling" | "mature" | "ancient";

export class TreeType {
  species: TreeSpecies;
  size: TreeSize;

  constructor(species: TreeSpecies, size: TreeSize) {
    this.species = species;
    this.size = size;
  }

  get_is_sapling(): boolean {
    return this.size === "sapling";
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
