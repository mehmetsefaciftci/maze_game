/**
 * Maze Generator
 * Uses Recursive Backtracker (DFS) algorithm
 * Guarantees single solution path from start to exit
 */

import type { MazeGrid, Position, LevelParams, Coin, Door, CoinColor } from './types';
import { getStageTheme } from './stage';
import { SeededRandom } from './utils/seed';

interface Cell {
  x: number;
  y: number;
  visited: boolean;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
}

type Grid = ('wall' | 'path')[][];

type GridSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type SpecialLevelConfig = {
  level: number;
  seed: number;
  build: (gridWidth: number, gridHeight: number) => Grid;
  coins: Coin[];
  doors: Door[];
  gridSize?: number;
  overrideCoinsDoors?: boolean;
};

type PathCacheEntry = {
  path: Position[];
  distanceMap: Map<string, number>;
};

const pathCache = new Map<string, PathCacheEntry>();

const SPECIAL_LEVELS: SpecialLevelConfig[] = [
  {
    level: 7,
    seed: 1213,
    build: buildLevel7Grid,
    gridSize: 6,
    coins: [
      { position: { x: 1, y: 5 }, color: 'red' },
      { position: { x: 11, y: 9 }, color: 'blue' },
    ],
    doors: [
      { position: { x: 9, y: 1 }, color: 'red' },
      { position: { x: 3, y: 11 }, color: 'blue' },
    ],
  },
  {
    level: 8,
    seed: 1221,
    build: buildLevel8Grid,
    gridSize: 6,
    coins: [
      { position: { x: 3, y: 3 }, color: 'red' },
      { position: { x: 11, y: 7 }, color: 'blue' },
      { position: { x: 5, y: 11 }, color: 'green' },
    ],
    doors: [
      { position: { x: 7, y: 1 }, color: 'red' },
      { position: { x: 9, y: 7 }, color: 'blue' },
      { position: { x: 5, y: 9 }, color: 'green' },
    ],
  },
  {
    level: 12,
    seed: 1084,
    build: buildLevel12Grid,
    gridSize: 6,
    coins: [],
    doors: [],
  },
  {
    level: 15,
    seed: 1105,
    build: buildLevel15Grid,
    gridSize: 6,
    coins: [],
    doors: [],
  },
  {
    level: 17,
    seed: 1320,
    build: buildLevel17Grid,
    gridSize: 6,
    coins: [],
    doors: [],
  },
  {
    level: 18,
    seed: 1327,
    build: buildLevel18Grid,
    gridSize: 10,
    coins: [
      { position: { x: 1, y: 5 }, color: 'red' },
      { position: { x: 19, y: 7 }, color: 'blue' },
      { position: { x: 17, y: 11 }, color: 'green' },
    ],
    doors: [
      { position: { x: 9, y: 1 }, color: 'red' },
      { position: { x: 5, y: 7 }, color: 'blue' },
      { position: { x: 3, y: 15 }, color: 'green' },
    ],
  },
  {
    level: 19,
    seed: 1334,
    build: buildLevel19Grid,
    gridSize: 10,
    coins: [
      { position: { x: 1, y: 7 }, color: 'red' },
      { position: { x: 15, y: 9 }, color: 'blue' },
      { position: { x: 3, y: 17 }, color: 'green' },
    ],
    doors: [
      { position: { x: 11, y: 1 }, color: 'red' },
      { position: { x: 7, y: 9 }, color: 'blue' },
      { position: { x: 5, y: 19 }, color: 'green' },
    ],
  },
  {
    level: 20,
    seed: 1341,
    build: buildLevel20Grid,
    gridSize: 10,
    coins: [
      { position: { x: 1, y: 7 }, color: 'red' },
      { position: { x: 19, y: 9 }, color: 'blue' },
      { position: { x: 17, y: 15 }, color: 'green' },
    ],
    doors: [
      { position: { x: 13, y: 1 }, color: 'red' },
      { position: { x: 9, y: 9 }, color: 'blue' },
      { position: { x: 3, y: 19 }, color: 'green' },
    ],
  },
  {
    level: 50,
    seed: 1350,
    build: buildLevel50Grid,
    gridSize: 6,
    coins: [],
    doors: [],
  },
  {
    level: 51,
    seed: 1357,
    build: buildLevel51Grid,
    gridSize: 6,
    coins: [],
    doors: [],
  },
  {
    level: 69,
    seed: 1483,
    build: buildLevel69Grid,
    gridSize: 6,
    coins: [],
    doors: [],
    overrideCoinsDoors: true,
  },
  {
    level: 106,
    seed: 2069,
    build: buildLevel106Grid,
    gridSize: 6,
    coins: [],
    doors: [],
  },
  {
    level: 109,
    seed: 2075,
    build: buildLevel109Grid,
    gridSize: 6,
    coins: [],
    doors: [],
  },
  {
    level: 126,
    seed: 2194,
    build: buildLevel126Grid,
    gridSize: 8,
    coins: [],
    doors: [],
  },
  {
    level: 162,
    seed: 2134,
    build: buildLevel162Grid,
    gridSize: 6,
    coins: [],
    doors: [],
    overrideCoinsDoors: true,
  },
  {
    level: 170,
    seed: 2190,
    build: buildLevel170Grid,
    gridSize: 6,
    coins: [],
    doors: [],
    overrideCoinsDoors: true,
  },
  {
    level: 174,
    seed: 2218,
    build: buildLevel174Grid,
    gridSize: 6,
    coins: [],
    doors: [],
    overrideCoinsDoors: true,
  },
  {
    level: 187,
    seed: 2309,
    build: buildLevel187Grid,
    gridSize: 6,
    coins: [],
    doors: [],
    overrideCoinsDoors: true,
  },
  {
    level: 190,
    seed: 2330,
    build: buildLevel190Grid,
    gridSize: 6,
    coins: [],
    doors: [],
    overrideCoinsDoors: true,
  },
];

function getSpecialByLevel(level: number): SpecialLevelConfig | undefined {
  return SPECIAL_LEVELS.find((config) => config.level === level);
}

function getSpecialBySeed(seed: number): SpecialLevelConfig | undefined {
  return SPECIAL_LEVELS.find((config) => config.seed === seed);
}

function inferLevelFromSeed(seed: number): number {
  if (seed === 1050) return 3;
  const special = getSpecialBySeed(seed);
  if (special) return special.level;
  return Math.floor((seed - 1000) / 7);
}

/**
 * Generate maze using Recursive Backtracker
 * Returns grid with walls and paths
 */
export function generateMaze(params: LevelParams): {
  grid: MazeGrid;
  startPos: Position;
  exitPos: Position;
  solutionLength: number;
  coins: Coin[];
  doors: Door[];
  icyCells: Set<string>;
  sandCheckpoint: string | null;
} {
  const { gridSize, seed } = params;
  const rng = new SeededRandom(seed);
  const specialBySeed = getSpecialBySeed(params.seed);

  const gridWidth = gridSize * 2 + 1;
  const gridHeight = gridSize * 2 + 1;
  let grid: Grid;

  if (specialBySeed) {
    grid = specialBySeed.build(gridWidth, gridHeight);
  } else {
    // Create grid of cells
    const cells: Cell[][] = [];
    for (let y = 0; y < gridSize; y++) {
      cells[y] = [];
      for (let x = 0; x < gridSize; x++) {
        cells[y][x] = {
          x,
          y,
          visited: false,
          walls: { top: true, right: true, bottom: true, left: true },
        };
      }
    }

    // DFS maze generation
    const stack: Cell[] = [];
    const startCell = cells[0][0];
    startCell.visited = true;
    stack.push(startCell);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = getUnvisitedNeighbors(current, cells, gridSize);

      if (neighbors.length > 0) {
        const next = neighbors[rng.nextInt(0, neighbors.length)];
        removeWall(current, next);
        next.visited = true;
        stack.push(next);
      } else {
        stack.pop();
      }
    }

    // Convert to grid
    grid = Array(gridHeight)
      .fill(null)
      .map(() => Array(gridWidth).fill('wall'));

    // Fill paths
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = cells[y][x];
        const gx = x * 2 + 1;
        const gy = y * 2 + 1;

        grid[gy][gx] = 'path';

        if (!cell.walls.right && x < gridSize - 1) {
          grid[gy][gx + 1] = 'path';
        }
        if (!cell.walls.bottom && y < gridSize - 1) {
          grid[gy + 1][gx] = 'path';
        }
      }
    }

    // Central flow tweak
    const midX = Math.floor(gridWidth / 2);
    for (let y = 3; y < gridHeight - 3; y += 2) {
      if (
        grid[y][midX] === 'wall' &&
        grid[y][midX - 1] === 'path' &&
        grid[y][midX + 1] === 'path'
      ) {
        grid[y][midX] = 'path';
      }
    }
  }

  const startPos: Position = { x: 1, y: 1 };
  const exitPos: Position = { x: gridWidth - 2, y: gridHeight - 2 };

  const pathCacheKey = `${seed}|${gridWidth}x${gridHeight}|${startPos.x},${startPos.y}|${exitPos.x},${exitPos.y}`;

  const inferredLevel = inferLevelFromSeed(seed);
  if (!specialBySeed && inferredLevel >= 22) {
    const slidePath = findShortestSlidePathPositions(grid, startPos, exitPos);
    if (slidePath.length === 0) {
      grid = buildSlideSnakeGrid(gridWidth, gridHeight);
    }
  }

  // BFS solution length (same as your current behavior)
  const solutionLength = findShortestPath(grid, startPos, exitPos);

  // Coins/doors
  const { coins, doors } = generateCoinsAndDoors(grid, startPos, exitPos, params, rng, pathCacheKey);

  // Swap green coin/door positions for level 197 (requested tweak)
  if (inferredLevel === 197) {
    const greenCoin = coins.find((c) => c.color === 'green');
    const greenDoor = doors.find((d) => d.color === 'green');
    if (greenCoin && greenDoor) {
      const tmp = greenCoin.position;
      greenCoin.position = greenDoor.position;
      greenDoor.position = tmp;
    }
  }

  const usesSpecialCoins = Boolean(
    specialBySeed && (specialBySeed.coins.length > 0 || specialBySeed.doors.length > 0)
  );
  if (!usesSpecialCoins) {
    enforceCoinBeforeDoor(grid, startPos, exitPos, coins, doors);
  }

  const icyCells = generateIcyCells(
    grid,
    startPos,
    exitPos,
    coins,
    doors,
    rng,
    inferredLevel
  );
  return {
    grid: {
      width: gridWidth,
      height: gridHeight,
      cells: grid,
    },
    startPos,
    exitPos,
    solutionLength,
    coins,
    doors,
    icyCells,
    sandCheckpoint: generateSandCheckpoint(
      grid,
      startPos,
      exitPos,
      coins,
      doors,
      rng,
      inferredLevel
    ),
  };
}

function getUnvisitedNeighbors(cell: Cell, cells: Cell[][], gridSize: number): Cell[] {
  const neighbors: Cell[] = [];
  const { x, y } = cell;

  if (y > 0 && !cells[y - 1][x].visited) neighbors.push(cells[y - 1][x]);
  if (x < gridSize - 1 && !cells[y][x + 1].visited) neighbors.push(cells[y][x + 1]);
  if (y < gridSize - 1 && !cells[y + 1][x].visited) neighbors.push(cells[y + 1][x]);
  if (x > 0 && !cells[y][x - 1].visited) neighbors.push(cells[y][x - 1]);

  return neighbors;
}

function removeWall(current: Cell, next: Cell): void {
  const dx = next.x - current.x;
  const dy = next.y - current.y;

  if (dx === 1) {
    current.walls.right = false;
    next.walls.left = false;
  } else if (dx === -1) {
    current.walls.left = false;
    next.walls.right = false;
  } else if (dy === 1) {
    current.walls.bottom = false;
    next.walls.top = false;
  } else if (dy === -1) {
    current.walls.top = false;
    next.walls.bottom = false;
  }
}

/**
 * BFS to find shortest path length
 */
function findShortestPath(grid: Grid, start: Position, end: Position): number {
  const height = grid.length;
  const width = grid[0].length;
  const visited = Array(height)
    .fill(null)
    .map(() => Array(width).fill(false));

  const queue: { pos: Position; dist: number }[] = [{ pos: start, dist: 0 }];
  let queueIndex = 0;
  visited[start.y][start.x] = true;

  while (queueIndex < queue.length) {
    const { pos, dist } = queue[queueIndex++];

    if (pos.x === end.x && pos.y === end.y) {
      return dist;
    }

    const directions = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];

    for (const dir of directions) {
      const newX = pos.x + dir.x;
      const newY = pos.y + dir.y;

      if (
        newX >= 0 &&
        newX < width &&
        newY >= 0 &&
        newY < height &&
        !visited[newY][newX] &&
        grid[newY][newX] === 'path'
      ) {
        visited[newY][newX] = true;
        queue.push({ pos: { x: newX, y: newY }, dist: dist + 1 });
      }
    }
  }

  return 0;
}

/**
 * Get level configuration based on level number
 */
export function getLevelConfig(level: number): LevelParams {
  const baseSize = 4;
  const maxGridSize = 11;
  const growthSize = Math.min(baseSize + Math.floor(level / 3), maxGridSize);
  const special = getSpecialByLevel(level);

  const cappedSize = level <= 7 ? growthSize : Math.min(growthSize, 6);
  const stage = getStageTheme(level);
  const gridSize = stage === 'buz' ? 6 : (special?.gridSize ?? cappedSize);

  const complexity = Math.min(0.35 + level * 0.06, 0.9);

  let seed: number;
  if (level === 3) {
    seed = 1050;
  } else {
    seed = special ? special.seed : 1000 + level * 7;
  }

  return {
    gridSize,
    complexity,
    seed,
  };
}

/**
 * Calculate move limit based on solution length and level
 */
export function calculateMoveLimit(solutionLength: number, level: number): number {
  const buffer = Math.ceil(solutionLength * 0.3);
  const levelPenalty = Math.floor(level * 0.5);

  let extra = 0;
  if (level === 22) extra = 8;
  if (level === 51) extra = 18;
  if (level === 197) return 35;

  const advancedPenalty = level >= 22 && level <= 50 ? 6 : 0;

  return Math.max(solutionLength + buffer - levelPenalty - advancedPenalty + extra, solutionLength + 2);
}

/**
 * Generate coins and doors for the level
 */
function generateCoinsAndDoors(
  grid: Grid,
  startPos: Position,
  exitPos: Position,
  params: LevelParams,
  rng: SeededRandom,
  pathCacheKey: string
): { coins: Coin[]; doors: Door[] } {
  const coins: Coin[] = [];
  const doors: Door[] = [];
  const specialOverride = getSpecialBySeed(params.seed);
  if (specialOverride?.overrideCoinsDoors) {
    return { coins: specialOverride.coins, doors: specialOverride.doors };
  }

  const level = Math.floor((params.seed - 1000) / 7);
  const actualLevel =
    params.seed === 1050 ? 3 :
    getSpecialBySeed(params.seed)?.level ?? level;

  if (actualLevel < 2) return { coins, doors };

  if (actualLevel >= 22) {
    const advanced = generateCoinsAndDoorsByShortestPath(grid, startPos, exitPos, actualLevel, rng, pathCacheKey);
    if (advanced.coins.length >= 3 && advanced.doors.length >= 3) {
      return advanced;
    }
    return ensureMinimumCoinDoorPair(grid, startPos, exitPos, rng, pathCacheKey, 3);
  }

  const special = getSpecialBySeed(params.seed);
  if (special && (special.coins.length > 0 || special.doors.length > 0)) {
    return { coins: special.coins, doors: special.doors };
  }

  const basePairs = Math.min(Math.floor((actualLevel - 1) / 3) + 1, 3);
  const numPairs = basePairs;

  if (numPairs === 0) return { coins, doors };

  const colors: CoinColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  const usedColors = colors.slice(0, numPairs);

  const { path: mainPath, distanceMap } = getPathAndDistanceMap(grid, startPos, exitPos, pathCacheKey);
  const mainPathSet = new Set(mainPath.map(p => `${p.x},${p.y}`));

  const allPathPositions: Position[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (
        grid[y][x] === 'path' &&
        !(x === startPos.x && y === startPos.y) &&
        !(x === exitPos.x && y === exitPos.y)
      ) {
        allPathPositions.push({ x, y });
      }
    }
  }

  const mainPathPositions = allPathPositions.filter(p => mainPathSet.has(`${p.x},${p.y}`));
  const offPathPositions = allPathPositions.filter(p => !mainPathSet.has(`${p.x},${p.y}`));

  const distanceMapRef = distanceMap;

  mainPathPositions.sort((a, b) => {
    const distA = distanceMapRef.get(`${a.x},${a.y}`) || 0;
    const distB = distanceMapRef.get(`${b.x},${b.y}`) || 0;
    return distA - distB;
  });

  const pathSegmentSize = Math.floor(mainPathPositions.length / (usedColors.length + 1));

  for (let i = 0; i < usedColors.length; i++) {
    const color = usedColors[i];

    const coinSegmentStart = i * pathSegmentSize;
    const coinSegmentEnd = coinSegmentStart + Math.floor(pathSegmentSize / 2);
    const doorSegmentStart = coinSegmentEnd;
    const doorSegmentEnd = (i + 1) * pathSegmentSize;

    const coinCandidates = mainPathPositions.slice(coinSegmentStart, coinSegmentEnd);
    if (coinCandidates.length > 0) {
      const coinPos = coinCandidates[Math.floor(coinCandidates.length / 2)];
      coins.push({ position: coinPos, color });
    }

    const doorCandidates = mainPathPositions.slice(doorSegmentStart, doorSegmentEnd);
    if (doorCandidates.length > 0) {
      const doorPos = doorCandidates[Math.floor(doorCandidates.length / 2)];
      doors.push({ position: doorPos, color });
    }
  }

  return { coins, doors };
}

function ensureMinimumCoinDoorPair(
  grid: Grid,
  startPos: Position,
  exitPos: Position,
  rng: SeededRandom,
  pathCacheKey: string,
  minPairs: number
): { coins: Coin[]; doors: Door[] } {
  const coins: Coin[] = [];
  const doors: Door[] = [];
  const colors: CoinColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

  const { path: mainPath } = getPathAndDistanceMap(grid, startPos, exitPos, pathCacheKey);
  const usablePath = mainPath.filter(
    (pos) =>
      !(pos.x === startPos.x && pos.y === startPos.y) &&
      !(pos.x === exitPos.x && pos.y === exitPos.y)
  );

  if (usablePath.length < 4) {
    return { coins, doors };
  }

  const pairs = Math.min(Math.max(1, minPairs), colors.length, Math.floor(usablePath.length / 3));
  const segmentSize = Math.floor(usablePath.length / (pairs + 1));
  for (let i = 0; i < pairs; i++) {
    const color = colors[i];
    const segStart = i * segmentSize;
    const segEnd = Math.min((i + 1) * segmentSize, usablePath.length - 1);
    if (segEnd - segStart < 2) continue;

    const coinIndex = rng.nextInt(segStart, Math.max(segStart, segEnd - 1));
    const doorIndex = rng.nextInt(coinIndex + 1, segEnd);
    const coinPos = usablePath[coinIndex];
    const doorPos = usablePath[doorIndex];

    coins.push({ position: { x: coinPos.x, y: coinPos.y }, color });
    doors.push({ position: { x: doorPos.x, y: doorPos.y }, color });
  }

  return { coins, doors };
}

/**
 * Find all positions on the shortest path from start to end
 */
function findPathPositions(grid: Grid, start: Position, end: Position): Position[] {
  const height = grid.length;
  const width = grid[0].length;
  const visited = new Map<string, Position | null>();

  const queue: Position[] = [start];
  let queueIndex = 0;
  visited.set(`${start.x},${start.y}`, null);

  while (queueIndex < queue.length) {
    const current = queue[queueIndex++];

    if (current.x === end.x && current.y === end.y) {
      const path: Position[] = [];
      let pos: Position | null = current;
      while (pos) {
        path.unshift(pos);
        const key: string = `${pos.x},${pos.y}`;
        pos = visited.get(key) || null;
      }
      return path;
    }

    const directions = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];

    for (const dir of directions) {
      const next = { x: current.x + dir.x, y: current.y + dir.y };
      const key: string = `${next.x},${next.y}`;

      if (
        next.x >= 0 &&
        next.x < width &&
        next.y >= 0 &&
        next.y < height &&
        !visited.has(key) &&
        grid[next.y][next.x] === 'path'
      ) {
        visited.set(key, current);
        queue.push(next);
      }
    }
  }

  return [];
}

function getPathAndDistanceMap(grid: Grid, start: Position, end: Position, cacheKey: string): PathCacheEntry {
  const cached = pathCache.get(cacheKey);
  if (cached) return cached;

  const height = grid.length;
  const width = grid[0].length;
  const visited = new Map<string, Position | null>();
  const distanceMap = new Map<string, number>();
  const queue: Position[] = [start];
  let queueIndex = 0;

  visited.set(`${start.x},${start.y}`, null);
  distanceMap.set(`${start.x},${start.y}`, 0);

  while (queueIndex < queue.length) {
    const current = queue[queueIndex++];
    const currentKey = `${current.x},${current.y}`;
    const currentDist = distanceMap.get(currentKey) ?? 0;

    const directions = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];

    for (const dir of directions) {
      const next = { x: current.x + dir.x, y: current.y + dir.y };
      const key = `${next.x},${next.y}`;

      if (
        next.x >= 0 &&
        next.x < width &&
        next.y >= 0 &&
        next.y < height &&
        !visited.has(key) &&
        grid[next.y][next.x] === 'path'
      ) {
        visited.set(key, current);
        distanceMap.set(key, currentDist + 1);
        queue.push(next);
      }
    }
  }

  const path: Position[] = [];
  let pos: Position | null = end;
  if (visited.has(`${end.x},${end.y}`)) {
    while (pos) {
      path.unshift(pos);
      const key = `${pos.x},${pos.y}`;
      pos = visited.get(key) || null;
    }
  }

  const entry = { path, distanceMap };
  pathCache.set(cacheKey, entry);
  return entry;
}

function generateCoinsAndDoorsByShortestPath(
  grid: Grid,
  startPos: Position,
  exitPos: Position,
  level: number,
  rng: SeededRandom,
  pathCacheKey: string
): { coins: Coin[]; doors: Door[] } {
  const coins: Coin[] = [];
  const doors: Door[] = [];

  const colors: CoinColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  const maxPairs = Math.min(Math.floor((level - 1) / 3) + 1, colors.length);
  const desiredPairs =
    level >= 22 && level <= 50 ? Math.min(colors.length, Math.max(3, Math.floor(level / 5))) : maxPairs;

  const slidePath = findShortestSlidePathPositions(grid, startPos, exitPos);
  if (slidePath.length < 3) {
    return generateCoinsAndDoorsFallback(grid, startPos, exitPos, desiredPairs, rng, pathCacheKey);
  }

  const usablePath = slidePath.filter(
    (pos) =>
      !(pos.x === startPos.x && pos.y === startPos.y) &&
      !(pos.x === exitPos.x && pos.y === exitPos.y)
  );
  if (usablePath.length < 2) {
    return generateCoinsAndDoorsFallback(grid, startPos, exitPos, maxPairs, rng, pathCacheKey);
  }

  let pairs = Math.min(desiredPairs, Math.floor(usablePath.length / 3));
  if (pairs === 0) pairs = 1;
  if (pairs <= 0) return { coins, doors };

  const segmentSize = Math.floor(usablePath.length / (pairs + 1));
  for (let i = 0; i < pairs; i++) {
    const color = colors[i];
    const segStart = i * segmentSize;
    const segEnd = Math.min((i + 1) * segmentSize, usablePath.length - 1);
    const segLen = segEnd - segStart;
    if (segLen < 3) continue;

    const coinStart = segStart;
    const coinEnd = segStart + Math.max(1, Math.floor(segLen / 2) - 1);
    const doorStart = Math.min(coinEnd + 1, segEnd);

    const coinIndex = rng.nextInt(coinStart, coinEnd + 1);
    const doorIndex = rng.nextInt(doorStart, segEnd + 1);

    const coinPos = usablePath[coinIndex];
    const doorPos = usablePath[doorIndex];

    coins.push({ position: { x: coinPos.x, y: coinPos.y }, color });
    doors.push({ position: { x: doorPos.x, y: doorPos.y }, color });
  }

  return { coins, doors };
}

function generateCoinsAndDoorsFallback(
  grid: Grid,
  startPos: Position,
  exitPos: Position,
  maxPairs: number,
  rng: SeededRandom,
  pathCacheKey: string
): { coins: Coin[]; doors: Door[] } {
  const coins: Coin[] = [];
  const doors: Door[] = [];

  const colors: CoinColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  const usedColors = colors.slice(0, Math.max(1, Math.min(colors.length, maxPairs)));

  const { path: mainPath } = getPathAndDistanceMap(grid, startPos, exitPos, pathCacheKey);
  const usablePath = mainPath.filter(
    (pos) =>
      !(pos.x === startPos.x && pos.y === startPos.y) &&
      !(pos.x === exitPos.x && pos.y === exitPos.y)
  );
  if (usablePath.length < 2) return { coins, doors };

  const segmentSize = Math.floor(usablePath.length / (usedColors.length + 1));
  for (let i = 0; i < usedColors.length; i++) {
    const color = usedColors[i];
    const segStart = i * segmentSize;
    const segEnd = Math.min((i + 1) * segmentSize, usablePath.length - 1);
    const segLen = segEnd - segStart;
    if (segLen < 2) continue;

    const coinIndex = rng.nextInt(segStart, Math.max(segStart, segEnd - 1) + 1);
    const doorIndex = rng.nextInt(Math.min(segEnd, coinIndex + 1), segEnd + 1);

    const coinPos = usablePath[coinIndex];
    const doorPos = usablePath[doorIndex];

    coins.push({ position: { x: coinPos.x, y: coinPos.y }, color });
    doors.push({ position: { x: doorPos.x, y: doorPos.y }, color });
  }

  return { coins, doors };
}

function enforceCoinBeforeDoor(grid: Grid, startPos: Position, exitPos: Position, coins: Coin[], doors: Door[]): void {
  if (doors.length === 0 || coins.length === 0) return;

  // ✅ NEW: slide-aware distance map if it can reach exit, else fallback BFS distance map
  const slideDist = calculateSlideDistanceMap(grid, startPos);
  const hasSlideReach = slideDist.has(`${exitPos.x},${exitPos.y}`);
  const distanceMap = hasSlideReach ? slideDist : calculateDistanceMap(grid, startPos);

  const mainPath = findPathPositions(grid, startPos, exitPos);
  const mainPathSorted = [...mainPath].sort((a, b) => {
    const distA = distanceMap.get(`${a.x},${a.y}`) ?? Infinity;
    const distB = distanceMap.get(`${b.x},${b.y}`) ?? Infinity;
    return distA - distB;
  });

  for (const door of doors) {
    const coin = coins.find((c) => c.color === door.color);
    if (!coin) continue;

    const coinKey = `${coin.position.x},${coin.position.y}`;
    const doorKey = `${door.position.x},${door.position.y}`;
    const coinDist = distanceMap.get(coinKey) ?? Infinity;
    const doorDist = distanceMap.get(doorKey) ?? Infinity;

    if (doorDist > coinDist) continue;

    const target = mainPathSorted.find((pos) => {
      const key = `${pos.x},${pos.y}`;
      const dist = distanceMap.get(key) ?? Infinity;
      const isStart = pos.x === startPos.x && pos.y === startPos.y;
      const isExit = pos.x === exitPos.x && pos.y === exitPos.y;
      const hasCoin = coins.some((c) => c.position.x === pos.x && c.position.y === pos.y);
      return dist > coinDist && !isStart && !isExit && !hasCoin;
    });

    if (target) {
      door.position = { x: target.x, y: target.y };
    }
  }
}

function findShortestSlidePathPositions(grid: Grid, start: Position, end: Position): Position[] {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const visited = new Map<string, Position | null>();
  const queue: Position[] = [start];
  let queueIndex = 0;
  visited.set(`${start.x},${start.y}`, null);

  const directions = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ];

  const isInBounds = (x: number, y: number) => x >= 0 && x < width && y >= 0 && y < height;

  const slide = (pos: Position, dir: { x: number; y: number }) => {
    let x = pos.x;
    let y = pos.y;
    while (true) {
      const nx = x + dir.x;
      const ny = y + dir.y;
      if (!isInBounds(nx, ny)) break;
      if (grid[ny][nx] === 'wall') break;
      x = nx;
      y = ny;
    }
    return { x, y };
  };

  while (queueIndex < queue.length) {
    const current = queue[queueIndex++];
    if (current.x === end.x && current.y === end.y) {
      const path: Position[] = [];
      let pos: Position | null = current;
      while (pos) {
        path.unshift(pos);
        const key: string = `${pos.x},${pos.y}`;
        pos = visited.get(key) || null;
      }
      return path;
    }

    for (const dir of directions) {
      const next = slide(current, dir);
      if (next.x === current.x && next.y === current.y) continue;
      const key: string = `${next.x},${next.y}`;
      if (visited.has(key)) continue;
      visited.set(key, current);
      queue.push(next);
    }
  }

  return [];
}

function buildGridFromSegments(gridWidth: number, gridHeight: number, segments: GridSegment[]): Grid {
  const grid: Grid = Array(gridHeight)
    .fill(null)
    .map(() => Array(gridWidth).fill('wall'));

  const carveLine = (x1: number, y1: number, x2: number, y2: number) => {
    if (x1 === x2) {
      const [start, end] = y1 < y2 ? [y1, y2] : [y2, y1];
      for (let y = start; y <= end; y++) grid[y][x1] = 'path';
      return;
    }
    if (y1 === y2) {
      const [start, end] = x1 < x2 ? [x1, x2] : [x2, x1];
      for (let x = start; x <= end; x++) grid[y1][x] = 'path';
    }
  };

  segments.forEach((segment) => {
    carveLine(segment.x1, segment.y1, segment.x2, segment.y2);
  });

  return grid;
}

function openStartExit(grid: Grid, gridWidth: number, gridHeight: number): void {
  grid[1][1] = 'path';
  grid[1][2] = 'path';
  grid[2][1] = 'path';
  grid[gridHeight - 2][gridWidth - 2] = 'path';
  grid[gridHeight - 2][gridWidth - 3] = 'path';
  grid[gridHeight - 3][gridWidth - 2] = 'path';
}

function buildSlideSnakeGrid(gridWidth: number, gridHeight: number): Grid {
  const segments: GridSegment[] = [];
  const maxX = gridWidth - 2;
  const maxY = gridHeight - 2;
  let x = 1;
  let down = true;

  while (x <= maxX) {
    segments.push({ x1: x, y1: down ? 1 : maxY, x2: x, y2: down ? maxY : 1 });
    if (x + 2 <= maxX) {
      segments.push({ x1: x, y1: down ? maxY : 1, x2: x + 2, y2: down ? maxY : 1 });
    }
    x += 2;
    down = !down;
  }

  const grid = buildGridFromSegments(gridWidth, gridHeight, segments);
  openStartExit(grid, gridWidth, gridHeight);
  return grid;
}

function buildLevel12Grid(gridWidth: number, gridHeight: number): Grid {
  return buildSlideSnakeGrid(gridWidth, gridHeight);
}

function buildLevel15Grid(gridWidth: number, gridHeight: number): Grid {
  const segments: GridSegment[] = [
    { x1: 1, y1: 1, x2: 11, y2: 1 },
    { x1: 11, y1: 1, x2: 11, y2: 5 },
    { x1: 11, y1: 5, x2: 3, y2: 5 },
    { x1: 3, y1: 5, x2: 3, y2: 9 },
    { x1: 3, y1: 9, x2: 11, y2: 9 },
    { x1: 11, y1: 9, x2: 11, y2: 11 },
    { x1: 11, y1: 11, x2: 1, y2: 11 },
    { x1: 1, y1: 11, x2: 1, y2: 3 },
    { x1: 1, y1: 3, x2: 7, y2: 3 },
    { x1: 7, y1: 3, x2: 7, y2: 7 },
    { x1: 7, y1: 7, x2: 5, y2: 7 },
    { x1: 5, y1: 7, x2: 5, y2: 3 },
  ];

  const grid = buildGridFromSegments(gridWidth, gridHeight, segments);
  openStartExit(grid, gridWidth, gridHeight);
  return grid;
}

function buildLevel17Grid(gridWidth: number, gridHeight: number): Grid {
  return buildSlideSnakeGrid(gridWidth, gridHeight);
}

function buildLevel50Grid(gridWidth: number, gridHeight: number): Grid {
  const segments: GridSegment[] = [
    { x1: 1, y1: 1, x2: gridWidth - 2, y2: 1 },
    { x1: gridWidth - 2, y1: 1, x2: gridWidth - 2, y2: gridHeight - 2 },
    { x1: gridWidth - 2, y1: gridHeight - 2, x2: 1, y2: gridHeight - 2 },
    { x1: 1, y1: gridHeight - 2, x2: 1, y2: 3 },

    { x1: 3, y1: 3, x2: gridWidth - 4, y2: 3 },
    { x1: gridWidth - 4, y1: 3, x2: gridWidth - 4, y2: gridHeight - 4 },
    { x1: gridWidth - 4, y1: gridHeight - 4, x2: 3, y2: gridHeight - 4 },
    { x1: 3, y1: gridHeight - 4, x2: 3, y2: 5 },

    { x1: 5, y1: 5, x2: gridWidth - 6, y2: 5 },
    { x1: gridWidth - 6, y1: 5, x2: gridWidth - 6, y2: gridHeight - 6 },
    { x1: gridWidth - 6, y1: gridHeight - 6, x2: 5, y2: gridHeight - 6 },
    { x1: 5, y1: gridHeight - 6, x2: 5, y2: 7 },

    { x1: 7, y1: 7, x2: gridWidth - 8, y2: 7 },
    { x1: gridWidth - 8, y1: 7, x2: gridWidth - 8, y2: gridHeight - 8 },
    { x1: gridWidth - 8, y1: gridHeight - 8, x2: 7, y2: gridHeight - 8 },
    { x1: 7, y1: gridHeight - 8, x2: 7, y2: 9 },

    { x1: 9, y1: 9, x2: gridWidth - 10, y2: 9 },
    { x1: gridWidth - 10, y1: 9, x2: gridWidth - 10, y2: gridHeight - 10 },
    { x1: gridWidth - 10, y1: gridHeight - 10, x2: 9, y2: gridHeight - 10 },
  ];

  const grid = buildGridFromSegments(gridWidth, gridHeight, segments);
  openStartExit(grid, gridWidth, gridHeight);
  return grid;
}

function buildLevel7Grid(gridWidth: number, gridHeight: number): Grid {
  const segments: GridSegment[] = [
    { x1: 1, y1: 1, x2: 1, y2: 5 },
    { x1: 1, y1: 5, x2: 9, y2: 5 },
    { x1: 9, y1: 5, x2: 9, y2: 1 },
    { x1: 9, y1: 1, x2: 11, y2: 1 },
    { x1: 11, y1: 1, x2: 11, y2: 9 },
    { x1: 11, y1: 9, x2: 3, y2: 9 },
    { x1: 3, y1: 9, x2: 3, y2: 11 },
    { x1: 3, y1: 11, x2: 11, y2: 11 },
  ];

  const grid = buildGridFromSegments(gridWidth, gridHeight, segments);
  openStartExit(grid, gridWidth, gridHeight);
  return grid;
}

function buildLevel8Grid(gridWidth: number, gridHeight: number): Grid {
  const segments: GridSegment[] = [
    { x1: 1, y1: 1, x2: 1, y2: 3 },
    { x1: 1, y1: 3, x2: 7, y2: 3 },
    { x1: 7, y1: 3, x2: 7, y2: 1 },
    { x1: 7, y1: 1, x2: 11, y2: 1 },
    { x1: 11, y1: 1, x2: 11, y2: 7 },
    { x1: 11, y1: 7, x2: 9, y2: 7 },
    { x1: 9, y1: 7, x2: 9, y2: 11 },
    { x1: 9, y1: 11, x2: 5, y2: 11 },
    { x1: 5, y1: 11, x2: 5, y2: 9 },
    { x1: 5, y1: 9, x2: 3, y2: 9 },
    { x1: 3, y1: 9, x2: 3, y2: 11 },
    { x1: 3, y1: 11, x2: 11, y2: 11 },
  ];

  const grid = buildGridFromSegments(gridWidth, gridHeight, segments);
  openStartExit(grid, gridWidth, gridHeight);
  return grid;
}

function buildLevel18Grid(gridWidth: number, gridHeight: number): Grid {
  const segments: GridSegment[] = [
    { x1: 1, y1: 1, x2: 1, y2: 5 },
    { x1: 1, y1: 5, x2: 9, y2: 5 },
    { x1: 9, y1: 5, x2: 9, y2: 1 },
    { x1: 9, y1: 1, x2: 19, y2: 1 },
    { x1: 19, y1: 1, x2: 19, y2: 7 },
    { x1: 19, y1: 7, x2: 5, y2: 7 },
    { x1: 5, y1: 7, x2: 5, y2: 11 },
    { x1: 5, y1: 11, x2: 17, y2: 11 },
    { x1: 17, y1: 11, x2: 17, y2: 15 },
    { x1: 17, y1: 15, x2: 3, y2: 15 },
    { x1: 3, y1: 15, x2: 3, y2: 19 },
    { x1: 3, y1: 19, x2: 19, y2: 19 },
  ];

  const grid = buildGridFromSegments(gridWidth, gridHeight, segments);
  openStartExit(grid, gridWidth, gridHeight);
  return grid;
}

function buildLevel19Grid(gridWidth: number, gridHeight: number): Grid {
  const segments: GridSegment[] = [
    { x1: 1, y1: 1, x2: 1, y2: 7 },
    { x1: 1, y1: 7, x2: 11, y2: 7 },
    { x1: 11, y1: 7, x2: 11, y2: 1 },
    { x1: 11, y1: 1, x2: 19, y2: 1 },
    { x1: 19, y1: 1, x2: 19, y2: 9 },
    { x1: 19, y1: 9, x2: 7, y2: 9 },
    { x1: 7, y1: 9, x2: 7, y2: 13 },
    { x1: 7, y1: 13, x2: 15, y2: 13 },
    { x1: 15, y1: 13, x2: 15, y2: 17 },
    { x1: 15, y1: 17, x2: 3, y2: 17 },
    { x1: 3, y1: 17, x2: 3, y2: 19 },
    { x1: 3, y1: 19, x2: 19, y2: 19 },
  ];

  const grid = buildGridFromSegments(gridWidth, gridHeight, segments);
  openStartExit(grid, gridWidth, gridHeight);
  return grid;
}

function buildLevel20Grid(gridWidth: number, gridHeight: number): Grid {
  const segments: GridSegment[] = [
    { x1: 1, y1: 1, x2: 1, y2: 7 },
    { x1: 1, y1: 7, x2: 13, y2: 7 },
    { x1: 13, y1: 7, x2: 13, y2: 1 },
    { x1: 13, y1: 1, x2: 19, y2: 1 },
    { x1: 19, y1: 1, x2: 19, y2: 9 },
    { x1: 19, y1: 9, x2: 9, y2: 9 },
    { x1: 9, y1: 9, x2: 9, y2: 15 },
    { x1: 9, y1: 15, x2: 17, y2: 15 },
    { x1: 17, y1: 15, x2: 17, y2: 19 },
    { x1: 17, y1: 19, x2: 3, y2: 19 },
    { x1: 3, y1: 19, x2: 3, y2: 11 },
    { x1: 3, y1: 11, x2: 7, y2: 11 },
    { x1: 7, y1: 11, x2: 7, y2: 13 },
    { x1: 7, y1: 13, x2: 15, y2: 13 },
    { x1: 15, y1: 13, x2: 15, y2: 17 },
    { x1: 15, y1: 17, x2: 5, y2: 17 },
    { x1: 5, y1: 17, x2: 5, y2: 19 },
    { x1: 5, y1: 19, x2: 19, y2: 19 },
  ];

  const grid = buildGridFromSegments(gridWidth, gridHeight, segments);
  openStartExit(grid, gridWidth, gridHeight);
  return grid;
}

function buildLevel51Grid(gridWidth: number, gridHeight: number): Grid {
  return buildSlideSnakeGrid(gridWidth, gridHeight);
}

function generateIcyCells(
  grid: Grid,
  startPos: Position,
  exitPos: Position,
  coins: Coin[],
  doors: Door[],
  rng: SeededRandom,
  level: number
): Set<string> {
  if (getStageTheme(level) !== 'buz') return new Set();

  const blocked = new Set<string>();
  blocked.add(`${startPos.x},${startPos.y}`);
  blocked.add(`${exitPos.x},${exitPos.y}`);
  for (const coin of coins) blocked.add(`${coin.position.x},${coin.position.y}`);
  for (const door of doors) blocked.add(`${door.position.x},${door.position.y}`);

  const candidates: Position[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[y][x] !== 'path') continue;
      const key = `${x},${y}`;
      if (blocked.has(key)) continue;
      candidates.push({ x, y });
    }
  }

  const maxCount = Math.min(24, Math.max(6, Math.floor(candidates.length * 0.12)));
  const selected = new Set<string>();
  const pool = [...candidates];
  let count = 0;
  while (pool.length > 0 && count < maxCount) {
    const idx = rng.nextInt(0, pool.length);
    const pos = pool.splice(idx, 1)[0];
    selected.add(`${pos.x},${pos.y}`);
    count += 1;
  }

  return selected;
}

function generateSandCheckpoint(
  grid: Grid,
  startPos: Position,
  exitPos: Position,
  coins: Coin[],
  doors: Door[],
  rng: SeededRandom,
  level: number
): string | null {
  if (getStageTheme(level) !== 'kum') return null;

  const blocked = new Set<string>();
  blocked.add(`${startPos.x},${startPos.y}`);
  blocked.add(`${exitPos.x},${exitPos.y}`);
  for (const coin of coins) blocked.add(`${coin.position.x},${coin.position.y}`);
  for (const door of doors) blocked.add(`${door.position.x},${door.position.y}`);

  const candidates: Position[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (grid[y][x] !== 'path') continue;
      const key = `${x},${y}`;
      if (blocked.has(key)) continue;
      candidates.push({ x, y });
    }
  }

  if (candidates.length === 0) return null;
  const pick = candidates[rng.nextInt(0, candidates.length)];
  return `${pick.x},${pick.y}`;
}


function buildLevel69Grid(gridWidth: number, gridHeight: number): Grid {
  return buildSlideSnakeGrid(gridWidth, gridHeight);
}

function buildLevel106Grid(gridWidth: number, gridHeight: number): Grid {
  return buildSlideSnakeGrid(gridWidth, gridHeight);
}

function buildLevel109Grid(gridWidth: number, gridHeight: number): Grid {
  return buildSlideSnakeGrid(gridWidth, gridHeight);
}

function buildLevel126Grid(gridWidth: number, gridHeight: number): Grid {
  return buildSlideSnakeGrid(gridWidth, gridHeight);
}

function buildLevel162Grid(gridWidth: number, gridHeight: number): Grid {
  // Easier, deterministic slide-friendly layout for the sand stage.
  return buildSlideSnakeGrid(gridWidth, gridHeight);
}

function buildLevel170Grid(gridWidth: number, gridHeight: number): Grid {
  // Keep same difficulty profile as 162: guaranteed solvable without coin/door locks.
  return buildSlideSnakeGrid(gridWidth, gridHeight);
}

function buildLevel174Grid(gridWidth: number, gridHeight: number): Grid {
  // Same safe layout for a troublesome sand stage.
  return buildSlideSnakeGrid(gridWidth, gridHeight);
}

function buildLevel187Grid(gridWidth: number, gridHeight: number): Grid {
  // Same safe layout for a troublesome sand stage.
  return buildSlideSnakeGrid(gridWidth, gridHeight);
}

function buildLevel190Grid(gridWidth: number, gridHeight: number): Grid {
  // Same safe layout for a troublesome sand stage.
  return buildSlideSnakeGrid(gridWidth, gridHeight);
}

/**
 * Calculate distance map from start position using BFS
 */
function calculateDistanceMap(grid: Grid, start: Position): Map<string, number> {
  const height = grid.length;
  const width = grid[0].length;
  const distanceMap = new Map<string, number>();

  const queue: { pos: Position; dist: number }[] = [{ pos: start, dist: 0 }];
  let queueIndex = 0;
  distanceMap.set(`${start.x},${start.y}`, 0);

  while (queueIndex < queue.length) {
    const { pos, dist } = queue[queueIndex++];

    const directions = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ];

    for (const dir of directions) {
      const next = { x: pos.x + dir.x, y: pos.y + dir.y };
      const key = `${next.x},${next.y}`;

      if (
        next.x >= 0 &&
        next.x < width &&
        next.y >= 0 &&
        next.y < height &&
        !distanceMap.has(key) &&
        grid[next.y][next.x] === 'path'
      ) {
        distanceMap.set(key, dist + 1);
        queue.push({ pos: next, dist: dist + 1 });
      }
    }
  }

  return distanceMap;
}

/**
 * ✅ NEW: slide neighbors + slide distance map
 * These do NOT change your gameplay; they only help enforcement place doors correctly for sliding.
 */
function slideNeighbors(grid: Grid, pos: Position): Position[] {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  const dirs = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ];

  const inBounds = (x: number, y: number) => x >= 0 && x < width && y >= 0 && y < height;

  const slide = (p: Position, d: { x: number; y: number }) => {
    let x = p.x, y = p.y;
    while (true) {
      const nx = x + d.x;
      const ny = y + d.y;
      if (!inBounds(nx, ny)) break;
      if (grid[ny][nx] === 'wall') break;
      x = nx; y = ny;
    }
    return { x, y };
  };

  const out: Position[] = [];
  for (const d of dirs) {
    const next = slide(pos, d);
    if (next.x === pos.x && next.y === pos.y) continue;
    out.push(next);
  }
  return out;
}

function calculateSlideDistanceMap(grid: Grid, start: Position): Map<string, number> {
  const dist = new Map<string, number>();
  const q: Position[] = [start];
  let qi = 0;
  dist.set(`${start.x},${start.y}`, 0);

  while (qi < q.length) {
    const cur = q[qi++];
    const curKey = `${cur.x},${cur.y}`;
    const curDist = dist.get(curKey) ?? 0;

    for (const nxt of slideNeighbors(grid, cur)) {
      const key = `${nxt.x},${nxt.y}`;
      if (dist.has(key)) continue;
      dist.set(key, curDist + 1);
      q.push(nxt);
    }
  }

  return dist;
}
