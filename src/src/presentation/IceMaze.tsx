import React from 'react';
import type { CellType, Coin, Door, Position } from '../../game/types';
import { MazeGrid } from './MazeGrid';
import { StageLayout } from './StageLayout';

type Props = {
  grid: CellType[][];
  playerPos: Position;
  exitPos: Position;
  coins: Coin[];
  doors: Door[];
  collectedCoins: Set<string>;
};

export function IceMaze(props: Props) {
  return (
    <StageLayout
      backgroundSrc="/stages/buz.jpg"
      frameSrc="/stages/ice-maze.png"
      hudSrc="/stages/buz-hud.png"
    >
      <div className="ice-stage__board">
        <div className="ice-stage__maze">
          <MazeGrid {...props} theme="buz" />
        </div>
      </div>
    </StageLayout>
  );
}
