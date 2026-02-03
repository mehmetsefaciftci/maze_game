/**
 * Game Reducer
 * Pure functions for game state management
 */

import type { MazeState, GameAction, Direction, Position } from './types';
import { MAX_LEVEL } from './types';
import { generateMaze, getLevelConfig, calculateMoveLimit } from './generator';

/**
 * Create initial game state for a level
 */
export function createLevel(level: number, seed?: number): MazeState {
  const config = getLevelConfig(level);
  if (seed !== undefined) {
    config.seed = seed;
  }

  const { grid, startPos, exitPos, solutionLength, coins, doors } = generateMaze(config);
  const maxMoves = calculateMoveLimit(solutionLength, level);

  return {
    level,
    grid,
    playerPos: startPos,
    exitPos,
    coins,
    doors,
    collectedCoins: new Set(),
    movesLeft: maxMoves,
    maxMoves,
    status: 'playing',
    history: [],
    seed: config.seed,
  };
}

/**
 * Apply move in given direction
 * Player slides until hitting a wall, boundary, or locked door
 * Collects all coins passed during the slide
 */
export function applyMove(state: MazeState, direction: Direction): MazeState {
  if (state.status !== 'playing') {
    return state;
  }

  // Slide until hitting a wall, boundary, or locked door
  // Collect all coins encountered during the slide
  let currentPos = state.playerPos;
  let lastValidPos = currentPos;
  let newCollectedCoins = new Set(state.collectedCoins);
  const coinsCollectedDuringSlide: string[] = [];
  
  while (true) {
    const nextPos = getNewPosition(currentPos, direction);
    
    // Check boundaries
    if (!isValidPosition(nextPos, state.grid)) {
      break;
    }

    // Check wall
    if (state.grid.cells[nextPos.y][nextPos.x] === 'wall') {
      break;
    }

    // Check locked door
    const door = state.doors.find(d => d.position.x === nextPos.x && d.position.y === nextPos.y);
    if (door) {
      const coinKey = getCoinKeyForDoor(state.coins, door.color);
      if (coinKey && !newCollectedCoins.has(coinKey)) {
        // Door is locked, stop here
        break;
      }
    }

    // Valid move, continue sliding
    lastValidPos = nextPos;
    currentPos = nextPos;
    
    // Check if we're collecting a coin at this position
    const coin = state.coins.find(c => c.position.x === currentPos.x && c.position.y === currentPos.y);
    if (coin) {
      const coinKey = `${coin.position.x},${coin.position.y}`;
      if (!newCollectedCoins.has(coinKey)) {
        // Collect coin during slide
        newCollectedCoins.add(coinKey);
        coinsCollectedDuringSlide.push(coinKey);
      }
    }
  }

  // If player didn't move at all, return unchanged state
  if (lastValidPos.x === state.playerPos.x && lastValidPos.y === state.playerPos.y) {
    return state;
  }

  // Save current state to history
  const newHistory = [
    ...state.history,
    {
      playerPos: state.playerPos,
      movesLeft: state.movesLeft,
      collectedCoins: state.collectedCoins,
    },
  ];

  const newMovesLeft = state.movesLeft - 1;
  
  // Check win condition: Must be at exit AND have collected all required coins
  if (lastValidPos.x === state.exitPos.x && lastValidPos.y === state.exitPos.y) {
    // Check if all required coins are collected
    const allCoinsCollected = state.coins.every(coin => {
      const coinKey = `${coin.position.x},${coin.position.y}`;
      return newCollectedCoins.has(coinKey);
    });
    
    if (allCoinsCollected) {
      // All coins collected, player wins!
      return {
        ...state,
        playerPos: lastValidPos,
        collectedCoins: newCollectedCoins,
        movesLeft: newMovesLeft,
        status: 'won',
        history: newHistory,
      };
    }
    // If not all coins collected, player can continue (stays at exit but game continues)
  }

  // Check lose condition
  if (newMovesLeft <= 0) {
    return {
      ...state,
      playerPos: lastValidPos,
      collectedCoins: newCollectedCoins,
      movesLeft: newMovesLeft,
      status: 'lost',
      history: newHistory,
    };
  }

  return {
    ...state,
    playerPos: lastValidPos,
    collectedCoins: newCollectedCoins,
    movesLeft: newMovesLeft,
    history: newHistory,
  };
}

/**
 * Undo last move
 */
export function undo(state: MazeState): MazeState {
  if (state.history.length === 0) {
    return state;
  }

  const newHistory = [...state.history];
  const lastState = newHistory.pop()!;

  return {
    ...state,
    playerPos: lastState.playerPos,
    movesLeft: lastState.movesLeft,
    collectedCoins: lastState.collectedCoins,
    history: newHistory,
    status: 'playing', // Reset status when undoing
  };
}

/**
 * Restart current level
 */
export function restart(state: MazeState): MazeState {
  return createLevel(state.level, state.seed);
}

/**
 * Main game reducer
 */
export function gameReducer(state: MazeState, action: GameAction): MazeState {
  switch (action.type) {
    case 'MOVE':
      return applyMove(state, action.direction);
    
    case 'UNDO':
      return undo(state);
    
    case 'RESTART':
      return restart(state);
    
    case 'NEXT_LEVEL':
      return createLevel(Math.min(state.level + 1, MAX_LEVEL));
    
    case 'LOAD_LEVEL':
      return createLevel(Math.min(action.level, MAX_LEVEL), action.seed);
    
    default:
      return state;
  }
}

// Helper functions

function getNewPosition(pos: Position, direction: Direction): Position {
  switch (direction) {
    case 'up':
      return { x: pos.x, y: pos.y - 1 };
    case 'down':
      return { x: pos.x, y: pos.y + 1 };
    case 'left':
      return { x: pos.x - 1, y: pos.y };
    case 'right':
      return { x: pos.x + 1, y: pos.y };
  }
}

function isValidPosition(pos: Position, grid: { width: number; height: number }): boolean {
  return pos.x >= 0 && pos.x < grid.width && pos.y >= 0 && pos.y < grid.height;
}

function getCoinKeyForDoor(coins: { position: Position; color: string }[], doorColor: string): string | null {
  const coin = coins.find(c => c.color === doorColor);
  return coin ? `${coin.position.x},${coin.position.y}` : null;
}
