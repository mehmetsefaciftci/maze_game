/**
 * Maze Grid Component
 * Renders the maze grid with optimized performance and smooth player animations
 */

import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import type { CellType, Coin, Door, CoinColor } from '../game/types';
import type { Position } from '../game/types';
import { User, Flag, Lock } from 'lucide-react';

type StageTheme = 'gezegen' | 'buz' | 'toprak' | 'kum' | 'volkan' | 'ice' | 'default';

interface MazeGridProps {
  grid: CellType[][];
  playerPos: Position;
  exitPos: Position;
  coins: Coin[];
  doors: Door[];
  collectedCoins: Set<string>; // stores "x,y" of collected coins
  theme?: StageTheme;
}

export const MazeGrid = memo(function MazeGrid({
  grid,
  playerPos,
  exitPos,
  coins,
  doors,
  collectedCoins,
  theme = 'gezegen',
}: MazeGridProps) {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  // Cell size + gap
  const cellPx = theme === 'buz' ? 16 : 24;
  const gapPx = 2;
  const paddingPx = theme === 'buz' ? 10 : 12;

  const cellStep = cellPx + gapPx;
  const cellSizeClass = theme === 'buz' ? 'w-4 h-4' : 'w-6 h-6';
  const gapClass = theme === 'buz' ? 'gap-[2px]' : 'gap-0.5';

  const themeTokens = {
    gezegen: {
      grid: 'rounded-2xl bg-gradient-to-br from-indigo-900/80 to-purple-900/80 border-purple-500/30',
      wall: 'bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 border border-purple-400/50',
      wallShadow: 'inset 0 -2px 4px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)',
      path: 'bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border border-purple-800/30',
    },
    ice: {
      grid: 'rounded-2xl bg-gradient-to-br from-indigo-900/80 to-purple-900/80 border-purple-500/30',
      wall: 'bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 border border-purple-400/50',
      wallShadow: 'inset 0 -2px 4px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)',
      path: 'bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border border-purple-800/30',
    },
    default: {
      grid: 'rounded-2xl bg-gradient-to-br from-indigo-900/80 to-purple-900/80 border-purple-500/30',
      wall: 'bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 border border-purple-400/50',
      wallShadow: 'inset 0 -2px 4px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)',
      path: 'bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border border-purple-800/30',
    },
    buz: {
      grid: 'rounded-3xl bg-gradient-to-b from-sky-100/30 via-cyan-200/25 to-sky-300/30 border-cyan-200/60 shadow-cyan-500/30',
      wall: 'bg-gradient-to-br from-cyan-200/90 via-sky-300/85 to-blue-500/90 border border-white/50',
      wallShadow: 'inset 0 2px 8px rgba(255,255,255,0.6), inset 0 -3px 8px rgba(0,0,0,0.3)',
      path: 'bg-sky-900/15 border border-white/10 backdrop-blur-[1px]',
    },
    toprak: {
      grid: 'rounded-2xl bg-gradient-to-br from-emerald-900/80 to-green-900/80 border-emerald-500/30',
      wall: 'bg-gradient-to-br from-emerald-400 via-green-600 to-lime-700 border border-emerald-200/50',
      wallShadow: 'inset 0 -2px 4px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.2)',
      path: 'bg-green-950/40 border border-emerald-800/30',
    },
    kum: {
      grid: 'rounded-2xl bg-gradient-to-br from-amber-900/70 to-orange-900/80 border-amber-500/30',
      wall: 'bg-gradient-to-br from-amber-300 via-orange-500 to-yellow-600 border border-amber-200/50',
      wallShadow: 'inset 0 -2px 4px rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.2)',
      path: 'bg-amber-950/40 border border-amber-800/30',
    },
    volkan: {
      grid: 'rounded-2xl bg-gradient-to-br from-zinc-950/80 to-red-950/80 border-red-500/30',
      wall: 'bg-gradient-to-br from-zinc-700 via-red-700 to-rose-700 border border-red-300/40',
      wallShadow: 'inset 0 -2px 4px rgba(0,0,0,0.45), inset 0 2px 4px rgba(255,255,255,0.15)',
      path: 'bg-zinc-950/60 border border-red-900/30',
    },
  } as const;

  const activeTheme = themeTokens[theme];
  const wallClass = activeTheme.wall;
  const pathClass = activeTheme.path;
  const wallShadow = activeTheme.wallShadow;

  // ✅ collected coin colors (door unlock uses color, not a specific coin position)
  const collectedColors = useMemo(() => {
    const set = new Set<CoinColor>();
    for (const coin of coins) {
      const key = `${coin.position.x},${coin.position.y}`;
      if (collectedCoins.has(key)) set.add(coin.color);
    }
    return set;
  }, [coins, collectedCoins]);

  // Color mapping
  const getColorClasses = (color: CoinColor) => {
    switch (color) {
      case 'red': return { bg: 'from-red-400 to-red-600', shadow: 'rgba(239, 68, 68, 0.8)', border: 'border-red-200' };
      case 'blue': return { bg: 'from-blue-400 to-blue-600', shadow: 'rgba(59, 130, 246, 0.8)', border: 'border-blue-200' };
      case 'green': return { bg: 'from-green-400 to-green-600', shadow: 'rgba(34, 197, 94, 0.8)', border: 'border-green-200' };
      case 'yellow': return { bg: 'from-yellow-400 to-yellow-600', shadow: 'rgba(234, 179, 8, 0.8)', border: 'border-yellow-200' };
      case 'purple': return { bg: 'from-purple-400 to-purple-600', shadow: 'rgba(168, 85, 247, 0.8)', border: 'border-purple-200' };
      case 'orange': return { bg: 'from-orange-400 to-orange-600', shadow: 'rgba(249, 115, 22, 0.8)', border: 'border-orange-200' };
    }
  };

  return (
    <div className="relative inline-block">
      <div
        className={[
          'relative inline-grid backdrop-blur-sm shadow-2xl border-2 z-0',
          gapClass,
          activeTheme.grid,
        ].join(' ')}
        style={{
          gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
          padding: paddingPx, // ✅ paddingPx ile birebir hizala
        }}
      >
        <StaticGrid
          grid={grid}
          cellSizeClass={cellSizeClass}
          wallClass={wallClass}
          wallShadow={wallShadow}
          pathClass={pathClass}
        />

        {/* Coins */}
        {coins.map((coin) => {
          const coinKey = `${coin.position.x},${coin.position.y}`;
          if (collectedCoins.has(coinKey)) return null;

          const colors = getColorClasses(coin.color);

          return (
            <motion.div
              key={coinKey}
              className="absolute pointer-events-none flex items-center justify-center"
              style={{
                left: paddingPx,
                top: paddingPx,
                width: cellPx,
                height: cellPx,
              }}
              initial={false}
              animate={{
                x: coin.position.x * cellStep,
                y: coin.position.y * cellStep,
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <motion.div
                className={`w-3 h-3 bg-gradient-to-br ${colors.bg} rounded-full border ${colors.border}`}
                style={{ boxShadow: `0 0 10px ${colors.shadow}` }}
                animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
          );
        })}

        {/* Doors */}
        {doors.map((door) => {
          const isUnlocked = collectedColors.has(door.color); // ✅ RENK bazlı unlock

          const colors = getColorClasses(door.color);
          const doorKey = `${door.position.x},${door.position.y}`;

          return (
            <motion.div
              key={doorKey}
              className="absolute pointer-events-none flex items-center justify-center"
              style={{
                left: paddingPx,
                top: paddingPx,
                width: cellPx,
                height: cellPx,
                zIndex: isUnlocked ? 1 : 10,
              }}
              initial={false}
              animate={{
                x: door.position.x * cellStep,
                y: door.position.y * cellStep,
              }}
            >
              <motion.div
                className={`w-4 h-4 bg-gradient-to-br ${colors.bg} rounded flex items-center justify-center border-2 ${colors.border}`}
                style={{
                  boxShadow: isUnlocked ? 'none' : `0 0 15px ${colors.shadow}`,
                }}
                animate={
                  isUnlocked
                    ? { opacity: 0.3, scale: 1.3 }
                    : { opacity: 1, scale: [1, 1.1, 1] }
                }
                transition={
                  isUnlocked
                    ? { duration: 0.3, ease: 'easeOut' }
                    : { duration: 1.5, repeat: Infinity, repeatType: 'reverse' }
                }
              >
                {!isUnlocked && <Lock className="w-2 h-2 text-white" strokeWidth={3} />}
              </motion.div>
            </motion.div>
          );
        })}

        {/* Exit */}
        <motion.div
          className="absolute pointer-events-none flex items-center justify-center"
          style={{
            left: paddingPx,
            top: paddingPx,
            width: cellPx,
            height: cellPx,
          }}
          initial={false}
          animate={{
            x: exitPos.x * cellStep,
            y: exitPos.y * cellStep,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <motion.div
            className="w-4 h-4 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center border-2 border-green-200"
            style={{ boxShadow: '0 0 15px rgba(52, 211, 153, 0.8)' }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
          >
            <Flag className="w-2 h-2 text-white" strokeWidth={3} fill="white" />
          </motion.div>
        </motion.div>

        {/* Player */}
        <motion.div
          className="absolute pointer-events-none flex items-center justify-center"
          style={{
            left: paddingPx,
            top: paddingPx,
            width: cellPx,
            height: cellPx,
            zIndex: 20,
          }}
          initial={false}
          animate={{
            x: playerPos.x * cellStep,
            y: playerPos.y * cellStep,
          }}
          transition={{ type: 'spring', stiffness: 800, damping: 30, mass: 0.3 }}
        >
          <motion.div
            className="absolute inset-0 bg-cyan-400 rounded-full blur-md"
            animate={{ opacity: [0, 0.5, 0], scale: [0.7, 1.4, 0.7] }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            key={`glow-${playerPos.x}-${playerPos.y}`}
          />
          <motion.div
            className="w-4 h-4 bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 rounded-full flex items-center justify-center border-2 border-cyan-200 relative z-10"
            style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.9)' }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          >
            <User className="w-2 h-2 text-white" strokeWidth={3} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
});

interface MazeCellProps {
  type: CellType;
  onClick?: () => void;
  cellSizeClass: string;
  wallClass: string;
  wallShadow: string;
  pathClass: string;
}

const MazeCell = memo(function MazeCell({
  type,
  onClick,
  cellSizeClass,
  wallClass,
  wallShadow,
  pathClass,
}: MazeCellProps) {
  const baseClass = `${cellSizeClass} rounded-sm transition-all duration-150`;

  if (type === 'wall') {
    return (
      <div
        className={`${baseClass} ${wallClass}`}
        style={{ boxShadow: wallShadow }}
        onClick={onClick}
      />
    );
  }

  return <div className={`${baseClass} ${pathClass}`} onClick={onClick} />;
});

interface StaticGridProps {
  grid: CellType[][];
  cellSizeClass: string;
  wallClass: string;
  wallShadow: string;
  pathClass: string;
}

const StaticGrid = memo(function StaticGrid({
  grid,
  cellSizeClass,
  wallClass,
  wallShadow,
  pathClass,
}: StaticGridProps) {
  return (
    <>
      {grid.map((row, y) =>
        row.map((cell, x) => {
          const cellType = cell === 'player' || cell === 'exit' ? 'path' : cell;
          return (
            <MazeCell
              key={`${x}-${y}`}
              type={cellType}
              cellSizeClass={cellSizeClass}
              wallClass={wallClass}
              wallShadow={wallShadow}
              pathClass={pathClass}
              // prod'da istersen kaldırırız
              onClick={() => console.log('cell', { x, y })}
            />
          );
        })
      )}
    </>
  );
});
