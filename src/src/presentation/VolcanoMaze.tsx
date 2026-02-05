import React from 'react';
import type { CellType, Coin, Door, Position } from '../../game/types';
import { MazeGrid } from '../MazeGrid';

type Props = {
  grid: CellType[][];
  playerPos: Position;
  exitPos: Position;
  coins: Coin[];
  doors: Door[];
  collectedCoins: Set<string>;
};

export function VolcanoMaze(props: Props) {
  return <MazeGrid {...props} theme="volkan" />;
}
