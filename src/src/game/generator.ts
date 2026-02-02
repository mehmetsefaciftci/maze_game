/**
 * Maze Generator
 * Uses Recursive Backtracker (DFS) algorithm
 * Guarantees single solution path from start to exit
 */

import type { MazeGrid, Position, LevelParams, Coin, Door, CoinColor } from './types';
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
    level: 18,
    seed: 1327,
    build: buildLevel18Grid,
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
        // Pick random neighbor
        const next = neighbors[rng.nextInt(0, neighbors.length)];
        
        // Remove wall between current and next
        removeWall(current, next);
        
        next.visited = true;
        stack.push(next);
      } else {
        stack.pop();
      }
    }

    // Convert to CellType grid
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

    // Remove some vertical walls in the middle area for better flow
    // This creates more open passages in the central area
    const midX = Math.floor(gridWidth / 2);
    for (let y = 3; y < gridHeight - 3; y += 2) {
      if (grid[y][midX] === 'wall' && 
          grid[y][midX - 1] === 'path' && 
          grid[y][midX + 1] === 'path') {
        // Only remove if it connects two path cells
        grid[y][midX] = 'path';
      }
    }
  }

  // Set start and exit positions
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

  // Calculate solution length using BFS
  const solutionLength = findShortestPath(grid, startPos, exitPos);

  // Generate coins and doors based on level
  const { coins, doors } = generateCoinsAndDoors(grid, startPos, exitPos, params, rng, pathCacheKey);
  if (!specialBySeed) {
    enforceCoinBeforeDoor(grid, startPos, exitPos, coins, doors);
  }

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
  };
}

function getUnvisitedNeighbors(cell: Cell, cells: Cell[][], gridSize: number): Cell[] {
  const neighbors: Cell[] = [];
  const { x, y } = cell;

  if (y > 0 && !cells[y - 1][x].visited) neighbors.push(cells[y - 1][x]); // top
  if (x < gridSize - 1 && !cells[y][x + 1].visited) neighbors.push(cells[y][x + 1]); // right
  if (y < gridSize - 1 && !cells[y + 1][x].visited) neighbors.push(cells[y + 1][x]); // bottom
  if (x > 0 && !cells[y][x - 1].visited) neighbors.push(cells[y][x - 1]); // left

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
function findShortestPath(
  grid: ('wall' | 'path')[][],
  start: Position,
  end: Position
): number {
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

  return 0; // No path found
}

/**
 * Get level configuration based on level number
 */
export function getLevelConfig(level: number): LevelParams {
  // Increase grid size every 3 levels
  const baseSize = 4;
  const gridSize = baseSize + Math.floor(level / 3);
  
  // Complexity increases with level (but caps at 0.8)
  const complexity = Math.min(0.3 + level * 0.05, 0.8);
  
  // Deterministic seed based on level
  // Level 3 and special levels get custom seeds for better layouts
  let seed: number;
  if (level === 3) {
    seed = 1050; // Special seed for level 3 redesign
  } else {
    const special = getSpecialByLevel(level);
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
  // Base: solution + 30% buffer
  const buffer = Math.ceil(solutionLength * 0.3);
  
  // Decrease buffer as level increases (harder)
  const levelPenalty = Math.floor(level * 0.5);

  let extra = 0;
  if (level === 22) {
    extra = 8;
  }
  
  return Math.max(solutionLength + buffer - levelPenalty + extra, solutionLength + 2);
}

/**
 * Generate coins and doors for the level
 * Strategy: Coins are placed off the main path (can be collected during slide), doors are placed on the main path
 */
function generateCoinsAndDoors(
  grid: ('wall' | 'path')[][],
  startPos: Position,
  exitPos: Position,
  params: LevelParams,
  rng: SeededRandom,
  pathCacheKey: string
): { coins: Coin[]; doors: Door[] } {
  const coins: Coin[] = [];
  const doors: Door[] = [];
  
  // Start adding coins from level 2
  const level = Math.floor((params.seed - 1000) / 7); // Reverse engineer level from seed
  // Special cases for custom seeds
  const actualLevel =
    params.seed === 1050 ? 3 :
    getSpecialBySeed(params.seed)?.level ?? level;
  
  if (actualLevel < 2) return { coins, doors };

  if (actualLevel >= 22) {
    return generateCoinsAndDoorsByShortestPath(grid, startPos, exitPos, actualLevel, rng, pathCacheKey);
  }

  const special = getSpecialBySeed(params.seed);
  if (special) {
    return { coins: special.coins, doors: special.doors };
  }
  
  // Determine number of coin/door pairs based on level
  const basePairs = Math.min(Math.floor((actualLevel - 1) / 3) + 1, 3);
  const numPairs = basePairs;
  
  if (numPairs === 0) return { coins, doors };
  
  const colors: CoinColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  const usedColors = colors.slice(0, numPairs);
  
  // Find main path from start to exit using BFS
  const { path: mainPath, distanceMap } = getPathAndDistanceMap(grid, startPos, exitPos, pathCacheKey);
  const mainPathSet = new Set(mainPath.map(p => `${p.x},${p.y}`));
  
  // Get all valid path positions (excluding start and exit)
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
  
  // Split positions into main path and off-path
  const mainPathPositions = allPathPositions.filter(p => mainPathSet.has(`${p.x},${p.y}`));
  const offPathPositions = allPathPositions.filter(p => !mainPathSet.has(`${p.x},${p.y}`));
  
  // Calculate distances from start for strategic placement
  const distanceMapRef = distanceMap;
  
  // Strategic placement: Coin must be between start and door
  // This ensures player collects coin before reaching the door
  
  // Sort main path by distance from start
  mainPathPositions.sort((a, b) => {
    const distA = distanceMapRef.get(`${a.x},${a.y}`) || 0;
    const distB = distanceMapRef.get(`${b.x},${b.y}`) || 0;
    return distA - distB; // Closer to start first
  });
  
  // Divide main path into segments for strategic placement
  const pathSegmentSize = Math.floor(mainPathPositions.length / (usedColors.length + 1));
  
  for (let i = 0; i < usedColors.length; i++) {
    const color = usedColors[i];
    
    // Calculate segment indices for this pair
    const coinSegmentStart = i * pathSegmentSize;
    const coinSegmentEnd = coinSegmentStart + Math.floor(pathSegmentSize / 2);
    const doorSegmentStart = coinSegmentEnd;
    const doorSegmentEnd = (i + 1) * pathSegmentSize;
    
    // Place coin in the first half of the segment
    const coinCandidates = mainPathPositions.slice(coinSegmentStart, coinSegmentEnd);
    if (coinCandidates.length > 0) {
      // Pick middle position for coin
      const coinPos = coinCandidates[Math.floor(coinCandidates.length / 2)];
      coins.push({ position: coinPos, color });
    }
    
    // Place door in the second half of the segment (after coin)
    const doorCandidates = mainPathPositions.slice(doorSegmentStart, doorSegmentEnd);
    if (doorCandidates.length > 0) {
      // Pick middle position for door
      const doorPos = doorCandidates[Math.floor(doorCandidates.length / 2)];
      doors.push({ position: doorPos, color });
    }
  }
  
  return { coins, doors };
}



/**
 * Find all positions on the shortest path from start to end
 */
function findPathPositions(
  grid: ('wall' | 'path')[][],
  start: Position,
  end: Position
): Position[] {
  const height = grid.length;
  const width = grid[0].length;
  const visited = new Map<string, Position | null>();
  
  const queue: Position[] = [start];
  let queueIndex = 0;
  visited.set(`${start.x},${start.y}`, null);
  
  while (queueIndex < queue.length) {
    const current = queue[queueIndex++];
    
    if (current.x === end.x && current.y === end.y) {
      // Reconstruct path
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

/**
 * Calculate minimum distance to main path
 */
function getMinDistanceToMainPath(pos: Position, mainPath: Position[]): number {
  let minDist = Infinity;
  for (const pathPos of mainPath) {
    const dist = Math.abs(pos.x - pathPos.x) + Math.abs(pos.y - pathPos.y);
    minDist = Math.min(minDist, dist);
  }
  return minDist;
}

function getPathAndDistanceMap(
  grid: Grid,
  start: Position,
  end: Position,
  cacheKey: string
): PathCacheEntry {
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

  const slidePath = findShortestSlidePathPositions(grid, startPos, exitPos);
  if (slidePath.length < 3) {
    return generateCoinsAndDoorsFallback(grid, startPos, exitPos, maxPairs, rng, pathCacheKey);
  }

  const usablePath = slidePath.filter(
    (pos) =>
      !(pos.x === startPos.x && pos.y === startPos.y) &&
      !(pos.x === exitPos.x && pos.y === exitPos.y)
  );
  if (usablePath.length < 2) {
    return generateCoinsAndDoorsFallback(grid, startPos, exitPos, maxPairs, rng, pathCacheKey);
  }

  let pairs = Math.min(maxPairs, Math.floor(usablePath.length / 3));
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
  const usedColors = colors.slice(0, Math.max(1, maxPairs));

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

function enforceCoinBeforeDoor(
  grid: Grid,
  startPos: Position,
  exitPos: Position,
  coins: Coin[],
  doors: Door[]
): void {
  if (doors.length === 0 || coins.length === 0) return;

  const distanceMap = calculateDistanceMap(grid, startPos);
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

function findShortestSlidePathPositions(
  grid: Grid,
  start: Position,
  end: Position
): Position[] {
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

function buildGridFromSegments(
  gridWidth: number,
  gridHeight: number,
  segments: GridSegment[]
): Grid {
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

/**
 * Build a hand-shaped Level 7 grid with more stopping points
 */
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

/**
 * Build a hand-shaped Level 8 grid aligned to slide mechanics
 */
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

/**
 * Build a hand-shaped Level 18 grid aligned to slide mechanics
 */
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

/**
 * Build a hand-shaped Level 19 grid aligned to slide mechanics
 */
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

/**
 * Build a hand-shaped Level 20 grid aligned to slide mechanics
 */
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

/**
 * Build a hand-shaped Level 22 grid aligned to slide mechanics
 */
function buildLevel22Grid(gridWidth: number, gridHeight: number): Grid {
  const segments: GridSegment[] = [
    { x1: 1, y1: 1, x2: 1, y2: 5 },
    { x1: 1, y1: 5, x2: 13, y2: 5 },
    { x1: 13, y1: 5, x2: 13, y2: 1 },
    { x1: 13, y1: 1, x2: 19, y2: 1 },
    { x1: 19, y1: 1, x2: 19, y2: 9 },
    { x1: 19, y1: 9, x2: 9, y2: 9 },
    { x1: 9, y1: 9, x2: 9, y2: 15 },
    { x1: 9, y1: 15, x2: 3, y2: 15 },
    { x1: 3, y1: 15, x2: 3, y2: 11 },
    { x1: 3, y1: 11, x2: 7, y2: 11 },
    { x1: 7, y1: 11, x2: 7, y2: 19 },
    { x1: 7, y1: 19, x2: 19, y2: 19 },
  ];

  const grid = buildGridFromSegments(gridWidth, gridHeight, segments);
  openStartExit(grid, gridWidth, gridHeight);
  return grid;
}

/**
 * Build a hand-shaped Level 23 grid aligned to slide mechanics
 */
function buildLevel23Grid(gridWidth: number, gridHeight: number): Grid {
  const segments: GridSegment[] = [
    { x1: 1, y1: 1, x2: 1, y2: 5 },
    { x1: 1, y1: 5, x2: 11, y2: 5 },
    { x1: 11, y1: 5, x2: 11, y2: 1 },
    { x1: 11, y1: 1, x2: 19, y2: 1 },
    { x1: 19, y1: 1, x2: 19, y2: 9 },
    { x1: 19, y1: 9, x2: 13, y2: 9 },
    { x1: 13, y1: 9, x2: 13, y2: 11 },
    { x1: 13, y1: 11, x2: 7, y2: 11 },
    { x1: 7, y1: 11, x2: 7, y2: 17 },
    { x1: 7, y1: 17, x2: 5, y2: 17 },
    { x1: 5, y1: 17, x2: 5, y2: 19 },
    { x1: 5, y1: 19, x2: 19, y2: 19 },
  ];

  const grid = buildGridFromSegments(gridWidth, gridHeight, segments);
  openStartExit(grid, gridWidth, gridHeight);
  if (grid[12] && grid[12][7]) {
    grid[12][7] = 'wall';
  }
  return grid;
}

/**
 * Build a hand-shaped Level 22 grid aligned to slide mechanics
 */
/**
 * Calculate distance map from start position using BFS
 */
function calculateDistanceMap(
  grid: ('wall' | 'path')[][],
  start: Position
): Map<string, number> {
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
