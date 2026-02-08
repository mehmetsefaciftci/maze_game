/**
 * Game Reducer
 * Pure functions for game state management
 */

import type { MazeState, GameAction, Direction, Position } from './types';
import { MAX_LEVEL } from './types';
import { generateMaze, getLevelConfig, calculateMoveLimit } from './generator';
import { getStageTheme, toStageLocalLevel } from './stage';

function getIceTimeLimit(level: number): number | null {
  if (getStageTheme(level) !== 'buz') return null;
  const localLevel = toStageLocalLevel(level); // 1..50
  const time = Math.round(60 - (localLevel - 1) * 0.4);
  return Math.max(35, time);
}

/**
 * Create initial game state for a level
 */
export function createLevel(level: number, seed?: number): MazeState {
  const config = getLevelConfig(level);
  if (seed !== undefined) {
    config.seed = seed;
  }

  const { grid, startPos, exitPos, solutionLength, coins, doors, icyCells, sandCheckpoint } =
    generateMaze(config);
  const maxMoves = calculateMoveLimit(solutionLength, level);
  const maxTime = getIceTimeLimit(level);

  return {
    level,
    grid,
    playerPos: startPos,
    exitPos,
    coins,
    doors,
    icyCells,
    soilVisits: new Map(),
    sandStormActive: false,
    sandCheckpoint,
    sandRevealSeconds: 0,
    lavaRow: getStageTheme(level) === 'volkan' ? -1 : null,
    lavaMoveCounter: 0,
    collectedCoins: new Set(),
    movesLeft: maxMoves,
    maxMoves,
    timeLeft: maxTime,
    maxTime,
    iceTimerStarted: getStageTheme(level) !== 'buz',
    lastMoveIcy: false,
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

  let currentPos = state.playerPos;
  let lastValidPos = currentPos;
  let touchedIce = false;
  let activeDirection: Direction = direction;
  const stageTheme = getStageTheme(state.level);
  const isToprakStage = stageTheme === 'toprak';
  const isKumStage = stageTheme === 'kum';
  const isVolkanStage = stageTheme === 'volkan';
  const nextSandStormActive = isKumStage ? true : state.sandStormActive;
  let sandRevealSeconds = state.sandRevealSeconds;
  const protectedSoil = isToprakStage
    ? new Set([
        `${state.playerPos.x},${state.playerPos.y}`,
        `${state.exitPos.x},${state.exitPos.y}`,
        ...state.coins.map((c) => `${c.position.x},${c.position.y}`),
        ...state.doors.map((d) => `${d.position.x},${d.position.y}`),
      ])
    : null;
  let soilVisits = state.soilVisits;
  let soilUpdated = false;
  let collapsePositions: Position[] = [];
  let lavaRow = state.lavaRow;
  let lavaMoveCounter = state.lavaMoveCounter;

  // ✅ Copy Set so we never mutate state.collectedCoins reference
  let newCollectedCoins = new Set(state.collectedCoins);

  // (Debug/analytics için dursun; şu an kullanılmıyor)
  const coinsCollectedDuringSlide: string[] = [];

  while (true) {
    const nextPos = getNewPosition(currentPos, activeDirection);

    // Check boundaries
    if (!isValidPosition(nextPos, state.grid)) {
      break;
    }

    // Check wall
    if (state.grid.cells[nextPos.y][nextPos.x] === 'wall') {
      break;
    }

    // ✅ Check locked door (backward-compatible but more correct)
    const door = state.doors.find(d => d.position.x === nextPos.x && d.position.y === nextPos.y);
    if (door) {
      // Old behavior: door opened by a coin of same color
      // Improved behavior: if multiple same-color coins exist, any collected one unlocks
      const isUnlocked = hasCollectedColor(state.coins, newCollectedCoins, door.color);
      if (!isUnlocked) {
        break; // Door is locked, stop before it
      }
    }

    // Valid move, continue sliding
    lastValidPos = nextPos;
    currentPos = nextPos;
    if (state.icyCells.has(`${currentPos.x},${currentPos.y}`)) {
      touchedIce = true;
    }
    if (isKumStage && state.sandCheckpoint) {
      const key = `${currentPos.x},${currentPos.y}`;
      if (key === state.sandCheckpoint) {
        // Full-map reveal while standing on checkpoint
        sandRevealSeconds = 999;
        break; // stop movement on checkpoint; next move decides
      } else if (sandRevealSeconds > 0) {
        sandRevealSeconds = 0;
      }
    }
    if (isToprakStage) {
      const key = `${currentPos.x},${currentPos.y}`;
      if (!protectedSoil?.has(key)) {
        if (!soilUpdated) {
          soilVisits = new Map(state.soilVisits);
          soilUpdated = true;
        }
        const nextCount = (soilVisits.get(key) ?? 0) + 1;
        soilVisits.set(key, nextCount);
        if (nextCount >= 3) {
          collapsePositions.push({ x: currentPos.x, y: currentPos.y });
          break;
        }
      }
    }

    // Collect coin if present at this position (your current rule: pass-through collects)
    const coin = state.coins.find(c => c.position.x === currentPos.x && c.position.y === currentPos.y);
    if (coin) {
      const coinKey = `${coin.position.x},${coin.position.y}`;
      if (!newCollectedCoins.has(coinKey)) {
        newCollectedCoins.add(coinKey);
        coinsCollectedDuringSlide.push(coinKey);
      }
    }
  }

  // If player didn't move at all, return unchanged state (no move spent)
  if (lastValidPos.x === state.playerPos.x && lastValidPos.y === state.playerPos.y) {
    return state;
  }

  // ✅ Save current state to history (MUST clone Set)
  const newHistory = [
    ...state.history,
    {
      playerPos: state.playerPos,
      movesLeft: state.movesLeft,
      collectedCoins: new Set(state.collectedCoins),
      timeLeft: state.timeLeft,
      lastMoveIcy: state.lastMoveIcy,
      soilVisits: new Map(state.soilVisits),
      sandRevealSeconds: state.sandRevealSeconds,
      lavaRow: state.lavaRow,
      lavaMoveCounter: state.lavaMoveCounter,
    },
  ];

  const newMovesLeft = state.movesLeft - 1;
  const nextTimeLeft = state.timeLeft;
  let nextGrid = state.grid;
  if (collapsePositions.length > 0) {
    const nextCells = state.grid.cells.map((row) => row.slice());
    for (const pos of collapsePositions) {
      nextCells[pos.y][pos.x] = 'wall';
    }
    nextGrid = { ...state.grid, cells: nextCells };
  }

  if (isVolkanStage && lavaRow !== null) {
    lavaMoveCounter += 1;
    if (lavaMoveCounter >= 3) {
      lavaMoveCounter = 0;
      const nextLavaRow = lavaRow + 1;
      if (nextLavaRow < nextGrid.height) {
        const nextCells = nextGrid.cells.map((row) => row.slice());
        for (let x = 0; x < nextCells[0].length; x++) {
          nextCells[nextLavaRow][x] = 'wall';
        }
        nextGrid = { ...nextGrid, cells: nextCells };
        lavaRow = nextLavaRow;
      }
    }
  }

  // Win condition: at exit AND all coins collected (your current rule stays)
  if (lastValidPos.x === state.exitPos.x && lastValidPos.y === state.exitPos.y) {
    const allCoinsCollected = state.coins.every(coin => {
      const coinKey = `${coin.position.x},${coin.position.y}`;
      return newCollectedCoins.has(coinKey);
    });

    if (allCoinsCollected) {
      const hitLava = lavaRow !== null && lastValidPos.y === lavaRow;
      if (hitLava) {
        return {
          ...state,
          grid: nextGrid,
          playerPos: lastValidPos,
          collectedCoins: newCollectedCoins,
          movesLeft: newMovesLeft,
          timeLeft: nextTimeLeft,
          lastMoveIcy: touchedIce,
          soilVisits,
          sandStormActive: nextSandStormActive,
          sandRevealSeconds,
          lavaRow,
          lavaMoveCounter,
          status: 'lost',
          history: newHistory,
        };
      }
      if (nextTimeLeft !== null && nextTimeLeft <= 0) {
        return {
          ...state,
          grid: nextGrid,
          playerPos: lastValidPos,
          collectedCoins: newCollectedCoins,
          movesLeft: newMovesLeft,
          timeLeft: nextTimeLeft,
          lastMoveIcy: touchedIce,
          soilVisits,
          sandStormActive: nextSandStormActive,
          sandRevealSeconds,
          lavaRow,
          lavaMoveCounter,
          status: 'lost',
          history: newHistory,
        };
      }
      return {
        ...state,
        grid: nextGrid,
        playerPos: lastValidPos,
        collectedCoins: newCollectedCoins,
        movesLeft: newMovesLeft,
        timeLeft: nextTimeLeft,
        lastMoveIcy: touchedIce,
        soilVisits,
        sandStormActive: nextSandStormActive,
        sandRevealSeconds,
        lavaRow,
        lavaMoveCounter,
        status: 'won',
        history: newHistory,
      };
    }
    // If not all coins collected, game continues (your current behavior stays)
  }

  // Lose condition (your current behavior stays)
  const hitLava = lavaRow !== null && lastValidPos.y <= lavaRow;
  if (newMovesLeft <= 0 || (nextTimeLeft !== null && nextTimeLeft <= 0) || hitLava) {
    return {
      ...state,
      grid: nextGrid,
      playerPos: lastValidPos,
      collectedCoins: newCollectedCoins,
      movesLeft: newMovesLeft,
      timeLeft: nextTimeLeft,
      lastMoveIcy: touchedIce,
      soilVisits,
      sandStormActive: nextSandStormActive,
      sandRevealSeconds,
      lavaRow,
      lavaMoveCounter,
      status: 'lost',
      history: newHistory,
    };
  }

  return {
    ...state,
    grid: nextGrid,
    playerPos: lastValidPos,
    collectedCoins: newCollectedCoins,
    movesLeft: newMovesLeft,
    timeLeft: nextTimeLeft,
    lastMoveIcy: touchedIce,
    soilVisits,
    sandStormActive: nextSandStormActive,
    sandRevealSeconds,
    lavaRow,
    lavaMoveCounter,
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
    // ✅ Ensure Set is not shared by reference
    collectedCoins: new Set(lastState.collectedCoins),
    timeLeft: lastState.timeLeft ?? state.timeLeft,
    lastMoveIcy: lastState.lastMoveIcy ?? false,
    soilVisits: lastState.soilVisits ?? new Map(state.soilVisits),
    sandRevealSeconds: lastState.sandRevealSeconds ?? state.sandRevealSeconds,
    lavaRow: lastState.lavaRow ?? state.lavaRow,
    lavaMoveCounter: lastState.lavaMoveCounter ?? state.lavaMoveCounter,
    history: newHistory,
    status: 'playing',
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

    case 'START_ICE_TIMER':
      if (state.iceTimerStarted) return state;
      return { ...state, iceTimerStarted: true };

    case 'SAND_REVEAL_TICK': {
      if (state.sandRevealSeconds <= 0) return state;
      const next = Math.max(0, state.sandRevealSeconds - action.seconds);
      return { ...state, sandRevealSeconds: next };
    }

    case 'TICK': {
      if (state.status !== 'playing') return state;
      if (state.timeLeft === null) return state;
      if (!state.iceTimerStarted) return state;
      const nextTime = Math.max(0, state.timeLeft - action.seconds);
      if (nextTime <= 0) {
        return { ...state, timeLeft: nextTime, status: 'lost' };
      }
      return { ...state, timeLeft: nextTime };
    }

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

/**
 * ✅ Door unlock rule (backward-compatible):
 * - If there is only 1 coin of that color -> same as old behavior
 * - If there are multiple coins of that color -> any collected one unlocks
 */
function hasCollectedColor(
  coins: { position: Position; color: string }[],
  collected: Set<string>,
  doorColor: string
): boolean {
  return coins.some(c => c.color === doorColor && collected.has(`${c.position.x},${c.position.y}`));
}
