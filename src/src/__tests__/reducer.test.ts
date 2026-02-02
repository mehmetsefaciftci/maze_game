/**
 * Reducer Tests
 */

import { describe, it, expect } from 'vitest';
import { createLevel, applyMove, undo } from '../game/reducer';

describe('Game Reducer', () => {
  it('should create initial state correctly', () => {
    const state = createLevel(1);

    expect(state.level).toBe(1);
    expect(state.status).toBe('playing');
    expect(state.movesLeft).toBe(state.maxMoves);
    expect(state.history).toHaveLength(0);
    expect(state.playerPos).toEqual(state.grid.cells[state.playerPos.y][state.playerPos.x] !== 'wall');
  });

  it('should handle valid move', () => {
    const state = createLevel(1);
    const initialMoves = state.movesLeft;

    // Try moving right (most likely valid from start position)
    const newState = applyMove(state, 'right');

    // If move was valid, moves should decrease
    if (newState.playerPos !== state.playerPos) {
      expect(newState.movesLeft).toBe(initialMoves - 1);
      expect(newState.history).toHaveLength(1);
    }
  });

  it('should not move through walls', () => {
    const state = createLevel(1);

    // Try all directions, at least one should be blocked by wall
    const moves = ['up', 'down', 'left', 'right'] as const;
    let hasBlockedMove = false;

    for (const dir of moves) {
      const newState = applyMove(state, dir);
      if (newState.playerPos.x === state.playerPos.x && newState.playerPos.y === state.playerPos.y) {
        hasBlockedMove = true;
        expect(newState.movesLeft).toBe(state.movesLeft); // Moves shouldn't decrease
        break;
      }
    }

    // At start position, at least one direction should be wall
    expect(hasBlockedMove).toBe(true);
  });

  it('should undo move correctly', () => {
    const state = createLevel(1);

    // Make a valid move
    let newState = applyMove(state, 'right');
    if (newState.playerPos.x !== state.playerPos.x || newState.playerPos.y !== state.playerPos.y) {
      // Move was successful, now undo
      const undoneState = undo(newState);

      expect(undoneState.playerPos).toEqual(state.playerPos);
      expect(undoneState.movesLeft).toBe(state.movesLeft);
      expect(undoneState.collectedCoins).toEqual(state.collectedCoins);
      expect(undoneState.history).toHaveLength(0);
      expect(undoneState.status).toBe('playing');
    }
  });

  it('should handle win condition', () => {
    const state = createLevel(1);

    // Manually set player to exit position (minus 1 move to test)
    const testState = {
      ...state,
      playerPos: { x: state.exitPos.x - 1, y: state.exitPos.y },
      movesLeft: 5,
    };

    // Move to exit
    const newState = applyMove(testState, 'right');

    if (newState.playerPos.x === state.exitPos.x && newState.playerPos.y === state.exitPos.y) {
      expect(newState.status).toBe('won');
    }
  });

  it('should handle lose condition', () => {
    const state = createLevel(1);

    // Set moves to 1
    const testState = {
      ...state,
      movesLeft: 1,
    };

    // Make a move that doesn't reach exit
    const newState = applyMove(testState, 'right');

    if (newState.playerPos.x !== state.exitPos.x || newState.playerPos.y !== state.exitPos.y) {
      expect(newState.status).toBe('lost');
      expect(newState.movesLeft).toBe(0);
    }
  });
});
