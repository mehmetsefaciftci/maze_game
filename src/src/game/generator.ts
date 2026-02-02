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
  const gridWidth = gridSize * 2 + 1;
  const gridHeight = gridSize * 2 + 1;
  let grid: ('wall' | 'path')[][] = Array(gridHeight)
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

  // Set start and exit positions
  const startPos: Position = { x: 1, y: 1 };
  const exitPos: Position = { x: gridWidth - 2, y: gridHeight - 2 };

  // Level 7: use a custom, hand-shaped layout with more natural stopping points
  if (params.seed === 1213) {
    const customGrid = buildLevel7Grid(gridWidth, gridHeight);
    if (findShortestPath(customGrid, startPos, exitPos) > 0) {
      grid = customGrid;
    }
  }
  // Level 8: use a custom, hand-shaped layout aligned to slide rules
  if (params.seed === 1221) {
    const customGrid = buildLevel8Grid(gridWidth, gridHeight);
    if (findShortestPath(customGrid, startPos, exitPos) > 0) {
      grid = customGrid;
    }
  }
  // Level 18: custom layout aligned to slide rules
  if (params.seed === 1327) {
    const customGrid = buildLevel18Grid(gridWidth, gridHeight);
    if (findShortestPath(customGrid, startPos, exitPos) > 0) {
      grid = customGrid;
    }
  }

  // Calculate solution length using BFS
  const solutionLength = findShortestPath(grid, startPos, exitPos);

  // Generate coins and doors based on level
  const { coins, doors } = generateCoinsAndDoors(grid, startPos, exitPos, params, rng);

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
  visited[start.y][start.x] = true;

  while (queue.length > 0) {
    const { pos, dist } = queue.shift()!;

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
  // Level 3, 7, 8, and 18 get special seeds for better layouts
  let seed: number;
  if (level === 3) {
    seed = 1050; // Special seed for level 3 redesign
  } else if (level === 7) {
    seed = 1213; // Special seed for level 7 redesign (easier)
  } else if (level === 8) {
    seed = 1221; // Special seed for level 8 redesign
  } else if (level === 18) {
    seed = 1327; // Special seed for level 18 redesign
  } else {
    seed = 1000 + level * 7;
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
  
  return Math.max(solutionLength + buffer - levelPenalty, solutionLength + 2);
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
  rng: SeededRandom
): { coins: Coin[]; doors: Door[] } {
  const coins: Coin[] = [];
  const doors: Door[] = [];
  
  // Start adding coins from level 2
  const level = Math.floor((params.seed - 1000) / 7); // Reverse engineer level from seed
  // Special cases for custom seeds
  const actualLevel =
    params.seed === 1050 ? 3 :
    params.seed === 1213 ? 7 :
    params.seed === 1221 ? 8 :
    params.seed === 1327 ? 18 :
    level;
  
  if (actualLevel < 2) return { coins, doors };

  if (actualLevel === 7) {
    const fixedCoins: Coin[] = [
      { position: { x: 1, y: 5 }, color: 'red' },
      { position: { x: 11, y: 9 }, color: 'blue' },
    ];
    const fixedDoors: Door[] = [
      { position: { x: 9, y: 1 }, color: 'red' },
      { position: { x: 3, y: 11 }, color: 'blue' },
    ];

    return { coins: fixedCoins, doors: fixedDoors };
  }
  if (actualLevel === 8) {
    const fixedCoins: Coin[] = [
      { position: { x: 3, y: 3 }, color: 'red' },
      { position: { x: 11, y: 7 }, color: 'blue' },
      { position: { x: 5, y: 11 }, color: 'green' },
    ];
    const fixedDoors: Door[] = [
      { position: { x: 7, y: 1 }, color: 'red' },
      { position: { x: 9, y: 7 }, color: 'blue' },
      { position: { x: 5, y: 9 }, color: 'green' },
    ];

    return { coins: fixedCoins, doors: fixedDoors };
  }
  if (actualLevel === 18) {
    const fixedCoins: Coin[] = [
      { position: { x: 1, y: 5 }, color: 'red' },
      { position: { x: 19, y: 7 }, color: 'blue' },
      { position: { x: 17, y: 11 }, color: 'green' },
    ];
    const fixedDoors: Door[] = [
      { position: { x: 9, y: 1 }, color: 'red' },
      { position: { x: 5, y: 7 }, color: 'blue' },
      { position: { x: 3, y: 15 }, color: 'green' },
    ];

    return { coins: fixedCoins, doors: fixedDoors };
  }
  
  // Determine number of coin/door pairs based on level
  const basePairs = Math.min(Math.floor((actualLevel - 1) / 3) + 1, 3);
  const numPairs = basePairs;
  
  if (numPairs === 0) return { coins, doors };
  
  const colors: CoinColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  const usedColors = colors.slice(0, numPairs);
  
  // Find main path from start to exit using BFS
  const mainPath = findPathPositions(grid, startPos, exitPos);
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
  const distanceMap = calculateDistanceMap(grid, startPos);
  
  // Strategic placement: Coin must be between start and door
  // This ensures player collects coin before reaching the door
  
  // Sort main path by distance from start
  mainPathPositions.sort((a, b) => {
    const distA = distanceMap.get(`${a.x},${a.y}`) || 0;
    const distB = distanceMap.get(`${b.x},${b.y}`) || 0;
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
  visited.set(`${start.x},${start.y}`, null);
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
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

/**
 * Build a hand-shaped Level 7 grid with more stopping points
 */
function buildLevel7Grid(gridWidth: number, gridHeight: number): ('wall' | 'path')[][] {
  const grid: ('wall' | 'path')[][] = Array(gridHeight)
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

  // Main route (snake) aligned to slide mechanics
  carveLine(1, 1, 1, 5);
  carveLine(1, 5, 9, 5);
  carveLine(9, 5, 9, 1);
  carveLine(9, 1, 11, 1);
  carveLine(11, 1, 11, 9);
  carveLine(11, 9, 3, 9);
  carveLine(3, 9, 3, 11);
  carveLine(3, 11, 11, 11);

  // Ensure start/exit neighborhoods are open
  grid[1][1] = 'path';
  grid[1][2] = 'path';
  grid[2][1] = 'path';
  grid[gridHeight - 2][gridWidth - 2] = 'path';
  grid[gridHeight - 2][gridWidth - 3] = 'path';
  grid[gridHeight - 3][gridWidth - 2] = 'path';

  return grid;
}

/**
 * Build a hand-shaped Level 8 grid aligned to slide mechanics
 */
function buildLevel8Grid(gridWidth: number, gridHeight: number): ('wall' | 'path')[][] {
  const grid: ('wall' | 'path')[][] = Array(gridHeight)
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

  // Main route (snake) aligned to slide mechanics
  carveLine(1, 1, 1, 3);
  carveLine(1, 3, 7, 3);
  carveLine(7, 3, 7, 1);
  carveLine(7, 1, 11, 1);
  carveLine(11, 1, 11, 7);
  carveLine(11, 7, 9, 7);
  carveLine(9, 7, 9, 11);
  carveLine(9, 11, 5, 11);
  carveLine(5, 11, 5, 9);
  carveLine(5, 9, 3, 9);
  carveLine(3, 9, 3, 11);
  carveLine(3, 11, 11, 11);

  // Ensure start/exit neighborhoods are open
  grid[1][1] = 'path';
  grid[1][2] = 'path';
  grid[2][1] = 'path';
  grid[gridHeight - 2][gridWidth - 2] = 'path';
  grid[gridHeight - 2][gridWidth - 3] = 'path';
  grid[gridHeight - 3][gridWidth - 2] = 'path';

  return grid;
}

/**
 * Build a hand-shaped Level 18 grid aligned to slide mechanics
 */
function buildLevel18Grid(gridWidth: number, gridHeight: number): ('wall' | 'path')[][] {
  const grid: ('wall' | 'path')[][] = Array(gridHeight)
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

  // Main route (snake) aligned to slide mechanics for 21x21 grid
  carveLine(1, 1, 1, 5);
  carveLine(1, 5, 9, 5);
  carveLine(9, 5, 9, 1);
  carveLine(9, 1, 19, 1);
  carveLine(19, 1, 19, 7);
  carveLine(19, 7, 5, 7);
  carveLine(5, 7, 5, 11);
  carveLine(5, 11, 17, 11);
  carveLine(17, 11, 17, 15);
  carveLine(17, 15, 3, 15);
  carveLine(3, 15, 3, 19);
  carveLine(3, 19, 19, 19);

  // Ensure start/exit neighborhoods are open
  grid[1][1] = 'path';
  grid[1][2] = 'path';
  grid[2][1] = 'path';
  grid[gridHeight - 2][gridWidth - 2] = 'path';
  grid[gridHeight - 2][gridWidth - 3] = 'path';
  grid[gridHeight - 3][gridWidth - 2] = 'path';

  return grid;
}

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
  distanceMap.set(`${start.x},${start.y}`, 0);
  
  while (queue.length > 0) {
    const { pos, dist } = queue.shift()!;
    
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
