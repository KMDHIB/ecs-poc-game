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
