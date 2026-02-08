/**
 * Maze Grid Component
 * Renders the maze grid with optimized performance and smooth player animations
 */

import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import type { CellType, Coin, Door, CoinColor } from '../game/types';
import type { ThemeKey } from '../themes';
import type { Position } from '../game/types';
import { User, Flag, Lock } from 'lucide-react';

type StageTheme = ThemeKey | 'ice' | 'default';

interface MazeGridProps {
  grid: CellType[][];
  playerPos: Position;
  exitPos: Position;
  coins: Coin[];
  doors: Door[];
  collectedCoins: Set<string>; // stores "x,y" of collected coins
  icyCells?: Set<string>;
  lastMoveIcy?: boolean;
  soilVisits?: Map<string, number>;
  sandStormActive?: boolean;
  sandCheckpoint?: string | null;
  sandRevealSeconds?: number;
  lavaRow?: number | null;
  lavaMoveCounter?: number;
  theme?: StageTheme;
}

// ✅ FIX: Theme token tipini sabitle (wallImage opsiyonel)
type ThemeTokens = {
  grid: string;
  wall: string;
  wallShadow: string;
  path: string;
  wallImage?: string;
};

export const MazeGrid = memo(function MazeGrid({
  grid,
  playerPos,
  exitPos,
  coins,
  doors,
  collectedCoins,
  icyCells,
  lastMoveIcy,
  soilVisits,
  sandStormActive,
  sandCheckpoint,
  sandRevealSeconds,
  lavaRow,
  lavaMoveCounter,
  theme = 'gezegen',
}: MazeGridProps) {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  // Cell size + gap
  const cellPx = 24;
  const gapPx = 2;
  const paddingPx = 12;

  const cellStep = cellPx + gapPx;
  const cellSizeClass = 'w-6 h-6';
  const gapClass = 'gap-0.5';

  // ✅ FIX: themeTokens'ı Record<StageTheme, ThemeTokens> olarak tipleyerek
  // wallImage hatasını kaldırıyoruz.
  const themeTokens: Record<StageTheme, ThemeTokens> = {
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
      grid: 'rounded-3xl bg-gradient-to-b from-sky-100/35 via-cyan-100/30 to-sky-200/35 border-cyan-100/60 shadow-cyan-400/25',
      wall: 'bg-gradient-to-br from-sky-100/100 via-cyan-200/98 to-sky-400/95 border border-white/90',
      wallShadow: 'inset 0 3px 12px rgba(255, 255, 255, 0.75), inset 0 -4px 12px rgba(90, 130, 180, 0.35)',
      path: 'bg-sky-900/26 border border-white/35 backdrop-blur-[1px]',
    },
    toprak: {
      grid: 'rounded-3xl bg-gradient-to-br from-[#3b2a1f]/75 via-[#2a1d16]/75 to-[#1f150f]/85 border-[#6b4a32]/35',
      wall: 'border border-[#6e4a2b]/60',
      wallShadow: 'inset 0 -2px 6px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.12)',
      path: 'bg-gradient-to-br from-[#6b4a2b]/75 to-[#3f2a1a]/85 border border-[#5a3a1f]/45',
      wallImage: "url('/stages/toprak-wall.jpg')",
    },
    kum: {
      grid: 'rounded-2xl bg-gradient-to-br from-[#6b4b2a]/70 via-[#7b5a34]/70 to-[#5a3f24]/80 border-[#d8b37a]/30',
      wall: 'bg-gradient-to-br from-[#b87925] via-[#a86a1c] to-[#8a5311] border border-[#f2c97a]/70',
      wallShadow: 'inset 0 -3px 6px rgba(0,0,0,0.45), inset 0 2px 6px rgba(255,255,255,0.18)',
      path: 'bg-gradient-to-br from-[#d5b178]/30 via-[#c79b5d]/24 to-[#a7733f]/30 border border-[#f2d5a2]/30 backdrop-blur-[1px]',
    },
    volkan: {
      grid: 'rounded-2xl bg-gradient-to-br from-[#0e0606]/90 via-[#1a0b0b]/88 to-[#2c0d0b]/92 border-red-500/40',
      wall: 'bg-gradient-to-br from-[#8a0a0a] via-[#ef2d2d] to-[#ff3b00] border border-[#ffd166]/95',
      wallShadow:
        'inset 0 -5px 14px rgba(0,0,0,0.75), inset 0 3px 16px rgba(255,70,0,0.75), 0 0 28px rgba(255, 30, 0, 0.75)',
      path: 'bg-gradient-to-br from-[#2a0707]/94 via-[#3a0b0b]/92 to-[#5a160f]/94 border border-[#c0261a]/75',
    },
  };

  const themeKey: ThemeKey = theme === 'ice' || theme === 'default' ? 'gezegen' : theme;

  // ✅ FIX: activeTheme artık ThemeTokens tipinde (wallImage? var)
  const activeTheme = themeTokens[theme];

  const wallClass = activeTheme.wall + (themeKey === 'volkan' ? ' volkan-wall' : '');
  const pathClass = activeTheme.path + (themeKey === 'volkan' ? ' volkan-path' : '');
  const isVolkan = themeKey === 'volkan';

  const isPlayerOnIce = icyCells?.has(`${playerPos.x},${playerPos.y}`) ?? false;
  const shouldSlowMove = isPlayerOnIce || Boolean(lastMoveIcy);

  // ✅ FIX: grid.height yok; height kullanılır
  const warnLavaRow =
    isVolkan && typeof lavaRow === 'number' && lavaRow < (height - 1) && (lavaMoveCounter ?? 0) >= 2
      ? lavaRow + 1
      : null;

  const sandRevealActive = (sandRevealSeconds ?? 0) > 0;
  const isKumFog = themeKey === 'kum' && sandStormActive && !sandRevealActive;
  const isVisibleCell = (x: number, y: number) => {
    if (!isKumFog) return true;
    return Math.abs(x - playerPos.x) <= 1 && Math.abs(y - playerPos.y) <= 1;
  };

  const wallShadow = activeTheme.wallShadow;
  const wallImage = activeTheme.wallImage;

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
      case 'red':
        return { bg: 'from-red-400 to-red-600', shadow: 'rgba(239, 68, 68, 0.8)', border: 'border-red-200' };
      case 'blue':
        return { bg: 'from-blue-400 to-blue-600', shadow: 'rgba(59, 130, 246, 0.8)', border: 'border-blue-200' };
      case 'green':
        return { bg: 'from-green-400 to-green-600', shadow: 'rgba(34, 197, 94, 0.8)', border: 'border-green-200' };
      case 'yellow':
        return { bg: 'from-yellow-400 to-yellow-600', shadow: 'rgba(234, 179, 8, 0.8)', border: 'border-yellow-200' };
      case 'purple':
        return { bg: 'from-purple-400 to-purple-600', shadow: 'rgba(168, 85, 247, 0.8)', border: 'border-purple-200' };
      case 'orange':
        return { bg: 'from-orange-400 to-orange-600', shadow: 'rgba(249, 115, 22, 0.8)', border: 'border-orange-200' };
    }
  };

  return (
    <div className="relative inline-block">
      {isKumFog && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'rgba(246, 226, 190, 0.12)',
              borderRadius: '16px',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(2px 2px at 20% 30%, rgba(255, 230, 180, 0.4) 0, transparent 60%), radial-gradient(2px 2px at 70% 40%, rgba(255, 210, 150, 0.35) 0, transparent 60%), radial-gradient(3px 3px at 45% 65%, rgba(255, 220, 170, 0.35) 0, transparent 60%), radial-gradient(2px 2px at 80% 75%, rgba(255, 235, 190, 0.35) 0, transparent 60%)',
              backgroundSize: '220% 220%',
              animation: 'sandStormDust 14s linear infinite',
              opacity: 0.55,
              borderRadius: '16px',
            }}
          />
        </>
      )}

      <div
        className={[
          'relative inline-grid backdrop-blur-sm shadow-2xl border-2 z-0',
          gapClass,
          activeTheme.grid,
        ].join(' ')}
        style={{
          gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
          padding: paddingPx,
        }}
      >
        <StaticGrid
          grid={grid}
          cellSizeClass={cellSizeClass}
          wallClass={wallClass}
          wallShadow={wallShadow}
          wallImage={wallImage}
          pathClass={pathClass}
          themeKey={themeKey}
          cellPx={cellPx}
          isVolkan={isVolkan}
          icyCells={icyCells}
          soilVisits={soilVisits}
          sandStormActive={isKumFog}
          playerPos={playerPos}
          sandCheckpoint={sandCheckpoint}
          sandRevealActive={sandRevealActive}
          lavaRow={lavaRow}
          warnLavaRow={warnLavaRow}
        />

        {/* Coins */}
        {coins.map((coin) => {
          const coinKey = `${coin.position.x},${coin.position.y}`;
          if (collectedCoins.has(coinKey)) return null;
          if (!isVisibleCell(coin.position.x, coin.position.y)) return null;

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
                className={`bg-gradient-to-br ${colors.bg} rounded-full border ${colors.border}`}
                style={{ width: cellPx * 0.6, height: cellPx * 0.6, boxShadow: `0 0 10px ${colors.shadow}` }}
                animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
          );
        })}

        {/* Doors */}
        {doors.map((door) => {
          const isUnlocked = collectedColors.has(door.color);
          const colors = getColorClasses(door.color);
          const doorKey = `${door.position.x},${door.position.y}`;
          if (!isVisibleCell(door.position.x, door.position.y)) return null;

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
                className={`bg-gradient-to-br ${colors.bg} rounded flex items-center justify-center border-2 ${colors.border}`}
                style={{
                  width: cellPx * 0.7,
                  height: cellPx * 0.7,
                  boxShadow: isUnlocked ? 'none' : `0 0 15px ${colors.shadow}`,
                }}
                animate={isUnlocked ? { opacity: 0.3, scale: 1.3 } : { opacity: 1, scale: [1, 1.1, 1] }}
                transition={isUnlocked ? { duration: 0.3, ease: 'easeOut' } : { duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
              >
                {!isUnlocked && (
                  <Lock className="text-white" strokeWidth={3} style={{ width: cellPx * 0.35, height: cellPx * 0.35 }} />
                )}
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
          {isVisibleCell(exitPos.x, exitPos.y) && (
            <motion.div
              className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center border-2 border-green-200"
              style={{ width: cellPx * 0.7, height: cellPx * 0.7, boxShadow: '0 0 15px rgba(52, 211, 153, 0.8)' }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
            >
              <Flag className="text-white" strokeWidth={3} fill="white" style={{ width: cellPx * 0.35, height: cellPx * 0.35 }} />
            </motion.div>
          )}
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
          transition={
            shouldSlowMove ? { type: 'tween', duration: 1.3, ease: 'easeOut' } : { type: 'spring', stiffness: 800, damping: 30, mass: 0.3 }
          }
        >
          {isPlayerOnIce && (
            <motion.div
              key={`freeze-${playerPos.x}-${playerPos.y}`}
              className="absolute inset-0 rounded-full"
              initial={{ scale: 0.4, opacity: 0.0 }}
              animate={{ scale: [0.4, 1.9, 1.2], opacity: [0.0, 1, 0.0] }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(200,245,255,0.75) 35%, rgba(120,200,255,0.0) 70%)',
                boxShadow: '0 0 28px rgba(180, 230, 255, 0.95)',
                pointerEvents: 'none',
              }}
            />
          )}

          <motion.div
            className="absolute inset-0 bg-cyan-400 rounded-full blur-md"
            animate={{ opacity: [0, 0.5, 0], scale: [0.7, 1.4, 0.7] }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            key={`glow-${playerPos.x}-${playerPos.y}`}
          />

          <motion.div
            className="bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 rounded-full flex items-center justify-center border-2 border-cyan-200 relative z-10"
            style={{ width: cellPx * 0.7, height: cellPx * 0.7, boxShadow: '0 0 20px rgba(34, 211, 238, 0.9)' }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          >
            <User className="text-white" strokeWidth={3} style={{ width: cellPx * 0.35, height: cellPx * 0.35 }} />
          </motion.div>
        </motion.div>
      </div>

      {isKumFog && (
        <style>
          {`
          @keyframes sandStormDust {
            0% { background-position: 0% 0%; }
            100% { background-position: 100% 100%; }
          }
        `}
        </style>
      )}
    </div>
  );
});

interface MazeCellProps {
  type: CellType;
  onClick?: () => void;
  cellSizeClass: string;
  wallClass: string;
  wallShadow: string;
  wallImage?: string;
  pathClass: string;
  themeKey: ThemeKey;
  cellPx: number;
  isVolkan?: boolean;
  isIceCell?: boolean;
  isCracked?: boolean;
  isCheckpoint?: boolean;
  isLavaWarning?: boolean;
}

const MazeCell = memo(function MazeCell({
  type,
  onClick,
  cellSizeClass,
  wallClass,
  wallShadow,
  wallImage,
  pathClass,
  themeKey,
  cellPx,
  isVolkan,
  isIceCell,
  isCracked,
  isCheckpoint,
  isLavaWarning,
}: MazeCellProps) {
  const baseClass = `${cellSizeClass} rounded-sm transition-all duration-150 relative overflow-hidden`;
  const sizeStyle = cellSizeClass ? undefined : { width: cellPx, height: cellPx };
  const isWall = type === 'wall';
  const cellFx = getCellFx(themeKey, isWall ? 'wall' : 'path');

  if (isWall) {
    const animationName = isLavaWarning ? 'lavaWarnShake' : isVolkan ? 'volkanWallFlicker' : undefined;

    return (
      <div
        className={`${baseClass} ${wallClass}`}
        style={{
          boxShadow: wallShadow,
          backgroundImage: wallImage,
          backgroundSize: isVolkan ? '200% 200%' : wallImage ? 'cover' : undefined,
          backgroundPosition: isVolkan || wallImage ? 'center' : undefined,
          filter: isVolkan ? 'saturate(1.35) brightness(1.12)' : undefined,
          outline: isLavaWarning ? '1px solid rgba(255, 140, 60, 0.8)' : undefined,
          animationName,
          animationDuration: isLavaWarning ? '0.35s' : isVolkan ? '2.2s' : undefined,
          animationTimingFunction: isLavaWarning ? 'linear' : isVolkan ? 'ease-in-out' : undefined,
          animationIterationCount: isLavaWarning || isVolkan ? 'infinite' : undefined,
          animationDirection: isVolkan && !isLavaWarning ? 'alternate' : undefined,
          ...sizeStyle,
        }}
        onClick={onClick}
      >
        {cellFx}
      </div>
    );
  }

  const pathAnimationName = isLavaWarning ? 'lavaWarnShake' : isVolkan ? 'volkanPathPulse' : undefined;

  return (
    <div
      className={`${baseClass} ${pathClass}`}
      style={{
        ...sizeStyle,
        backgroundSize: isVolkan ? '160% 160%' : undefined,
        filter: isVolkan ? 'saturate(1.08)' : undefined,
        border: isIceCell ? '1px solid rgba(140, 220, 255, 0.85)' : undefined,
        boxShadow: isIceCell ? 'inset 0 0 8px rgba(120, 200, 255, 0.6)' : undefined,
        outline: isLavaWarning ? '1px solid rgba(255, 140, 60, 0.8)' : undefined,
        animationName: pathAnimationName,
        animationDuration: isLavaWarning ? '0.35s' : isVolkan ? '3.6s' : undefined,
        animationTimingFunction: isLavaWarning ? 'linear' : isVolkan ? 'ease-in-out' : undefined,
        animationIterationCount: isLavaWarning || isVolkan ? 'infinite' : undefined,
        animationDirection: isVolkan && !isLavaWarning ? 'alternate' : undefined,
      }}
      onClick={onClick}
    >
      {/* ... (Aşağıdaki geri kalan kodun tamamı sende zaten aynı; burada hiç dokunmadım) */}
      {isIceCell && (
        <>
          <span
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgba(200,250,255,0.7) 0%, rgba(140,215,255,0.4) 45%, rgba(60,140,220,0.28) 100%), radial-gradient(6px 6px at 25% 25%, rgba(230,255,255,0.85) 0, transparent 60%), radial-gradient(4px 4px at 70% 60%, rgba(190,235,255,0.7) 0, transparent 60%)',
            }}
          />
          <span
            className="absolute inset-0 opacity-55"
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.0) 40%, rgba(255,255,255,0.5) 65%, rgba(255,255,255,0.0) 100%), linear-gradient(35deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.0) 35%, rgba(255,255,255,0.45) 70%, rgba(255,255,255,0.0) 100%), linear-gradient(80deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.0) 50%, rgba(255,255,255,0.35) 85%, rgba(255,255,255,0.0) 100%), radial-gradient(1px 1px at 25% 30%, rgba(255,255,255,0.85) 0, transparent 60%), radial-gradient(1px 1px at 75% 60%, rgba(255,255,255,0.8) 0, transparent 60%)',
            }}
          />
        </>
      )}

      {isCracked && (
        <span
          className="absolute inset-0 opacity-65"
          style={{
            backgroundImage:
              'linear-gradient(160deg, rgba(255,255,255,0.2) 0%, transparent 35%, rgba(0,0,0,0.25) 65%, transparent 100%), linear-gradient(20deg, rgba(0,0,0,0.2) 0%, transparent 40%, rgba(255,255,255,0.2) 70%, transparent 100%), radial-gradient(2px 2px at 30% 35%, rgba(255,255,255,0.35) 0, transparent 60%), radial-gradient(2px 2px at 70% 55%, rgba(0,0,0,0.3) 0, transparent 60%)',
          }}
        />
      )}

      {isCheckpoint && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span
            style={{
              width: cellPx * 0.5,
              height: cellPx * 0.5,
              borderRadius: 999,
              background: 'rgba(255, 240, 200, 0.95)',
              boxShadow: '0 0 12px rgba(255, 230, 160, 0.85)',
              border: '1px solid rgba(120, 80, 30, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={cellPx * 0.32}
              height={cellPx * 0.32}
              fill="none"
              stroke="#5a3a1f"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7l2.5 5-2.5 5-2.5-5z" fill="#5a3a1f" />
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
            </svg>
          </span>
        </span>
      )}

      {cellFx}
    </div>
  );
});

interface StaticGridProps {
  grid: CellType[][];
  cellSizeClass: string;
  wallClass: string;
  wallShadow: string;
  wallImage?: string;
  pathClass: string;
  themeKey: ThemeKey;
  cellPx: number;
  isVolkan?: boolean;
  icyCells?: Set<string>;
  soilVisits?: Map<string, number>;
  sandStormActive?: boolean;
  playerPos?: Position;
  sandCheckpoint?: string | null;
  sandRevealActive?: boolean;
  lavaRow?: number | null;
  warnLavaRow?: number | null;
}

const StaticGrid = memo(function StaticGrid(props: StaticGridProps) {
  const {
    grid,
    cellSizeClass,
    wallClass,
    wallShadow,
    wallImage,
    pathClass,
    themeKey,
    cellPx,
    isVolkan,
    icyCells,
    soilVisits,
    sandStormActive,
    playerPos,
    sandCheckpoint,
    sandRevealActive,
    lavaRow,
    warnLavaRow,
  } = props;

  const canUseDom = typeof document !== 'undefined';
  return (
    <>
      {isVolkan && canUseDom && (
        <style>
          {`
          @keyframes volkanWallFlicker {
            0% { background-position: 0% 50%; filter: saturate(1.1) brightness(1.02); }
            100% { background-position: 100% 50%; filter: saturate(1.25) brightness(1.12); }
          }
          @keyframes volkanPathPulse {
            0% { background-position: 0% 0%; opacity: 0.95; }
            100% { background-position: 100% 100%; opacity: 1; }
          }
          @keyframes lavaWarnShake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-1px); }
            50% { transform: translateX(1px); }
            75% { transform: translateX(-1px); }
            100% { transform: translateX(0); }
          }
        `}
        </style>
      )}

      {grid.map((row, y) =>
        row.map((cell, x) => {
          const isVisible =
            !sandStormActive ||
            sandRevealActive ||
            (playerPos && Math.abs(x - playerPos.x) <= 1 && Math.abs(y - playerPos.y) <= 1);

          const isCheckpoint = isVisible && sandCheckpoint === `${x},${y}`;
          const isLava = isVolkan && typeof lavaRow === 'number' && y >= lavaRow;
          const isLavaWarning = isVolkan && warnLavaRow !== null && y === warnLavaRow;

          const cellType = cell === 'player' || cell === 'exit' ? 'path' : cell;
          const isIceCell = icyCells?.has(`${x},${y}`) ?? false;

          const isCracked = themeKey === 'toprak' && (soilVisits?.get(`${x},${y}`) ?? 0) === 2;

          return (
            <MazeCell
              key={`${x}-${y}`}
              type={isVisible ? cellType : 'path'}
              cellSizeClass={cellSizeClass}
              wallClass={
                isVisible
                  ? isLava
                    ? 'bg-gradient-to-br from-red-700 via-orange-600 to-yellow-500'
                    : wallClass
                  : 'bg-black/60'
              }
              wallShadow={
                isVisible
                  ? isLava
                    ? 'inset 0 -2px 6px rgba(0,0,0,0.5), 0 0 12px rgba(255, 120, 40, 0.6)'
                    : wallShadow
                  : 'none'
              }
              wallImage={isVisible ? (isLava ? undefined : wallImage) : undefined}
              pathClass={
                isVisible
                  ? isLava
                    ? 'bg-gradient-to-br from-red-800 via-orange-700 to-yellow-600'
                    : pathClass
                  : 'bg-black/50'
              }
              themeKey={themeKey}
              cellPx={cellPx}
              isVolkan={isVolkan}
              isIceCell={isVisible ? isIceCell : false}
              isCracked={isVisible ? isCracked : false}
              isCheckpoint={isCheckpoint}
              isLavaWarning={isLavaWarning}
              onClick={() => console.log('cell', { x, y })}
            />
          );
        })
      )}
    </>
  );
});

function getCellFx(themeKey: ThemeKey, kind: 'wall' | 'path') {
  switch (themeKey) {
    case 'gezegen': {
      if (kind === 'wall') {
        return (
          <span
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 45%, rgba(255,255,255,0.12) 100%)',
            }}
          />
        );
      }
      return (
        <span
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(1px 1px at 30% 35%, rgba(255,255,255,0.35) 0, transparent 70%), radial-gradient(1px 1px at 70% 65%, rgba(255,255,255,0.2) 0, transparent 70%)',
          }}
        />
      );
    }
    case 'buz': {
      if (kind === 'wall') {
        return (
          <span
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                'linear-gradient(45deg, transparent 20%, rgba(255, 255, 255, 0.35) 50%, transparent 80%)',
            }}
          />
        );
      }
      return (
        <span
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(120% 120% at 50% 50%, rgba(255,255,255,0.2) 0, transparent 55%)',
          }}
        />
      );
    }
    case 'toprak': {
      if (kind === 'wall') {
        return (
          <span
            className="absolute inset-0 opacity-55"
            style={{
              backgroundImage:
                'radial-gradient(55% 55% at 50% 50%, rgba(18,10,6,0.9) 0%, rgba(18,10,6,0) 60%), radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.1) 0, transparent 70%)',
            }}
          />
        );
      }
      return (
        <span
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(0,0,0,0.15) 0%, transparent 50%, rgba(255,255,255,0.08) 100%)',
          }}
        />
      );
    }
    case 'kum': {
      if (kind === 'wall') {
        return (
          <span
            className="absolute inset-0 opacity-45"
            style={{
              backgroundImage:
                'linear-gradient(90deg, rgba(255,255,255,0.18) 0%, transparent 45%, rgba(0,0,0,0.12) 100%)',
            }}
          />
        );
      }
      return (
        <span
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(10px 6px at 50% 40%, rgba(255,255,255,0.08) 0, transparent 70%), radial-gradient(12px 8px at 60% 70%, rgba(0,0,0,0.1) 0, transparent 70%)',
          }}
        />
      );
    }
    case 'volkan': {
      if (kind === 'wall') {
        return (
          <span
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                'linear-gradient(160deg, rgba(255,120,0,0.38) 0%, transparent 55%, rgba(255,0,0,0.3) 100%), radial-gradient(14px 12px at 30% 30%, rgba(255,220,140,0.5) 0, transparent 70%), radial-gradient(6px 6px at 65% 70%, rgba(255,80,0,0.35) 0, transparent 70%)',
            }}
          />
        );
      }
      return (
        <span
          className="absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              'radial-gradient(6px 6px at 25% 35%, rgba(255,140,0,0.5) 0, transparent 70%), radial-gradient(8px 8px at 70% 65%, rgba(255,60,0,0.4) 0, transparent 70%), linear-gradient(135deg, rgba(255,90,0,0.18) 0%, transparent 60%)',
          }}
        />
      );
    }
  }
}
