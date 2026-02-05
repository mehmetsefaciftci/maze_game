import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CellType, Coin, Door, Position } from '../game/types.ts';
import { MazeGrid } from './MazeGrid.tsx';
import { StageLayout } from './StageLayout.tsx';

type Props = {
  grid: CellType[][];
  playerPos: Position;
  exitPos: Position;
  coins: Coin[];
  doors: Door[];
  collectedCoins: Set<string>;
  level: number;
  movesLeft: number;
  onMenu: () => void;
};

const ICE_FRAME = {
  width: 1472,
  height: 704,
};

const ICE_MAZE_BOUNDS = {
  left: 625,
  top: 295,
  width: 223,
  height: 223,
};

const ICE_CELL_PX = 24;
const ICE_GAP_PX = 2;
const ICE_PADDING_PX = 12;

export function IceMaze(props: Props) {
  const mazeSlotRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const mazeSize = useMemo(() => {
    const gridWidth = props.grid[0]?.length ?? 0;
    const gridHeight = props.grid.length;
    if (!gridWidth || !gridHeight) return null;

    const totalWidth = ICE_PADDING_PX * 2 + gridWidth * ICE_CELL_PX + (gridWidth - 1) * ICE_GAP_PX;
    const totalHeight = ICE_PADDING_PX * 2 + gridHeight * ICE_CELL_PX + (gridHeight - 1) * ICE_GAP_PX;
    return { totalWidth, totalHeight };
  }, [props.grid]);

  useEffect(() => {
    if (!mazeSlotRef.current || !mazeSize) return;

    const updateScale = () => {
      if (!mazeSlotRef.current) return;
      const rect = mazeSlotRef.current.getBoundingClientRect();
      const nextScale = Math.min(rect.width / mazeSize.totalWidth, rect.height / mazeSize.totalHeight);
      setScale(Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 1);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(mazeSlotRef.current);

    return () => observer.disconnect();
  }, [mazeSize]);

  return (
    <StageLayout
      backgroundSrc="/stages/buz.jpg"
      frameSrc="/stages/ice-maze.png"
      hudSrc="/stages/buz-hud.png"
      hudOverlay={
        <div className="ice-stage__hud-content">
          <div className="ice-stage__hud-pill ice-stage__hud-level">
            <div className="ice-stage__hud-label">SEVİYE</div>
            <div className="ice-stage__hud-value">{props.level}</div>
          </div>
          <div className="ice-stage__hud-pill ice-stage__hud-moves">
            <div className="ice-stage__hud-label">KALAN HAMLE</div>
            <div className="ice-stage__hud-value">{props.movesLeft}</div>
          </div>
          <button type="button" className="ice-stage__hud-menu" onClick={props.onMenu}>
            Menü
          </button>
        </div>
      }
      frameWidth={ICE_FRAME.width}
      frameHeight={ICE_FRAME.height}
      mazeBounds={ICE_MAZE_BOUNDS}
    >
      <div ref={mazeSlotRef} className="ice-stage__maze">
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
          <MazeGrid {...props} theme="ice" />
        </div>
      </div>
    </StageLayout>
  );
}
