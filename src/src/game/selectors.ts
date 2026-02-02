/**
 * State Selectors
 * Memoizable selectors for performance
 */

import type { MazeState, CellType } from './types';

/**
 * Get cell type at position
 */
export function getCellType(state: MazeState, x: number, y: number): CellType {
  if (x === state.playerPos.x && y === state.playerPos.y) {
    return 'player';
  }
  
  if (x === state.exitPos.x && y === state.exitPos.y) {
    return 'exit';
  }
  
  return state.grid.cells[y][x];
}

/**
 * Check if undo is available
 */
export function canUndo(state: MazeState): boolean {
  return state.history.length > 0 && state.status === 'playing';
}

/**
 * Get progress percentage
 */
export function getProgress(state: MazeState): number {
  return ((state.maxMoves - state.movesLeft) / state.maxMoves) * 100;
}

/**
 * Get grid for rendering (without player and exit, they are rendered separately)
 */
export function getGridForRender(state: MazeState): CellType[][] {
  return state.grid.cells;
}
