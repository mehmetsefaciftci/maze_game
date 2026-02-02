/**
 * Game Core Types
 * Pure TypeScript types for maze game
 */

export type Direction = 'up' | 'down' | 'left' | 'right';

export type CoinColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

export type CellType = 
  | 'wall' 
  | 'path' 
  | 'player' 
  | 'exit'
  | `coin-${CoinColor}`
  | `door-${CoinColor}`;

export type GameStatus = 'playing' | 'won' | 'lost';

export interface Position {
  x: number;
  y: number;
}

export interface Coin {
  position: Position;
  color: CoinColor;
}

export interface Door {
  position: Position;
  color: CoinColor;
}

export interface LevelConfig {
  level: number;
  gridSize: number;
  seed: number;
}

export interface MazeGrid {
  width: number;
  height: number;
  cells: CellType[][];
}

export interface HistoryEntry {
  playerPos: Position;
  movesLeft: number;
  collectedCoins: Set<string>; // "x,y" format
}

export interface MazeState {
  level: number;
  grid: MazeGrid;
  playerPos: Position;
  exitPos: Position;
  coins: Coin[];
  doors: Door[];
  collectedCoins: Set<string>; // "x,y" format
  movesLeft: number;
  maxMoves: number;
  status: GameStatus;
  history: HistoryEntry[];
  seed: number;
}

export interface LevelParams {
  gridSize: number;
  complexity: number; // 0-1, affects dead ends
  seed: number;
}

// Action Types
export type GameAction =
  | { type: 'MOVE'; direction: Direction }
  | { type: 'UNDO' }
  | { type: 'RESTART' }
  | { type: 'NEXT_LEVEL' }
  | { type: 'LOAD_LEVEL'; level: number; seed?: number };
