/**
 * Generator Tests
 */

import { describe, it, expect } from 'vitest';
import { generateMaze, getLevelConfig } from '../game/generator';

describe('Maze Generator', () => {
  it('should generate same maze with same seed', () => {
    const params1 = { gridSize: 5, complexity: 0.5, seed: 12345 };
    const params2 = { gridSize: 5, complexity: 0.5, seed: 12345 };

    const maze1 = generateMaze(params1);
    const maze2 = generateMaze(params2);

    // Compare grids
    expect(maze1.grid.width).toBe(maze2.grid.width);
    expect(maze1.grid.height).toBe(maze2.grid.height);
    expect(maze1.grid.cells).toEqual(maze2.grid.cells);
    expect(maze1.startPos).toEqual(maze2.startPos);
    expect(maze1.exitPos).toEqual(maze2.exitPos);
  });

  it('should generate different mazes with different seeds', () => {
    const params1 = { gridSize: 5, complexity: 0.5, seed: 12345 };
    const params2 = { gridSize: 5, complexity: 0.5, seed: 67890 };

    const maze1 = generateMaze(params1);
    const maze2 = generateMaze(params2);

    // Grids should be different
    expect(maze1.grid.cells).not.toEqual(maze2.grid.cells);
  });

  it('should always have a valid path from start to exit', () => {
    const params = { gridSize: 6, complexity: 0.5, seed: 42 };
    const maze = generateMaze(params);

    // Solution length > 0 means path exists
    expect(maze.solutionLength).toBeGreaterThan(0);
  });

  it('should increase grid size with level', () => {
    const config1 = getLevelConfig(1);
    const config5 = getLevelConfig(5);

    expect(config5.gridSize).toBeGreaterThan(config1.gridSize);
  });
});
