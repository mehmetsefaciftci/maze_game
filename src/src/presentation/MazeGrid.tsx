/**
 * Maze Grid Component
 * Renders the maze grid with optimized performance and smooth player animations
 */

import { memo } from 'react';
import { motion } from 'motion/react';
import type { CellType, Coin, Door, CoinColor } from '../game/types';
import type { Position } from '../game/types';
import { User, Flag, Lock } from 'lucide-react';

interface MazeGridProps {
  grid: CellType[][];
  playerPos: Position;
  exitPos: Position;
  coins: Coin[];
  doors: Door[];
  collectedCoins: Set<string>;
}

export const MazeGrid = memo(function MazeGrid({ grid, playerPos, exitPos, coins, doors, collectedCoins }: MazeGridProps) {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;

  // Cell size + gap (w-6=24px + gap-0.5=2px = 26px)
  const cellStep = 26;
  
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
        className="inline-grid gap-0.5 bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-sm rounded-2xl p-3 shadow-2xl border-2 border-purple-500/30"
        style={{
          gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
        }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => {
            // Don't render player and exit in the grid cells
            const cellType = cell === 'player' || cell === 'exit' ? 'path' : cell;
            return <MazeCell key={`${x}-${y}`} type={cellType} />;
          })
        )}
        
        {/* Coins */}
        {coins.map((coin) => {
          const coinKey = `${coin.position.x},${coin.position.y}`;
          const isCollected = collectedCoins.has(coinKey);
          
          const colors = getColorClasses(coin.color);
          
          if (isCollected) return null; // Remove collected coins from DOM
          
          return (
            <motion.div
              key={coinKey}
              className="absolute pointer-events-none w-6 h-6 flex items-center justify-center"
              style={{
                left: 12,
                top: 12,
              }}
              initial={false}
              animate={{
                x: coin.position.x * cellStep,
                y: coin.position.y * cellStep,
              }}
              exit={{
                scale: [1, 1.5, 0],
                opacity: [1, 1, 0],
                rotate: [0, 180],
              }}
              transition={{
                exit: {
                  duration: 0.4,
                  ease: 'easeOut',
                }
              }}
            >
              <motion.div
                className={`w-3 h-3 bg-gradient-to-br ${colors.bg} rounded-full border ${colors.border}`}
                style={{
                  boxShadow: `0 0 10px ${colors.shadow}`,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </motion.div>
          );
        })}
        
        {/* Doors */}
        {doors.map((door) => {
          const coinKey = coins.find(c => c.color === door.color);
          const coinKeyStr = coinKey ? `${coinKey.position.x},${coinKey.position.y}` : '';
          const isUnlocked = collectedCoins.has(coinKeyStr);
          
          const colors = getColorClasses(door.color);
          const doorKey = `${door.position.x},${door.position.y}`;
          
          return (
            <motion.div
              key={doorKey}
              className="absolute pointer-events-none w-6 h-6 flex items-center justify-center"
              style={{
                left: 12,
                top: 12,
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
                animate={isUnlocked ? {
                  opacity: 0.3,
                  scale: 1.3,
                } : {
                  opacity: 1,
                  scale: [1, 1.1, 1],
                }}
                transition={isUnlocked ? {
                  duration: 0.3,
                  ease: 'easeOut',
                } : {
                  duration: 1.5,
                  repeat: Infinity,
                  repeatType: 'reverse',
                }}
              >
                {!isUnlocked && <Lock className="w-2 h-2 text-white" strokeWidth={3} />}
              </motion.div>
            </motion.div>
          );
        })}
        
        {/* Animated Exit */}
        <motion.div
          className="absolute pointer-events-none w-6 h-6 flex items-center justify-center"
          style={{
            left: 12, // p-3
            top: 12,
          }}
          initial={false}
          animate={{
            x: exitPos.x * cellStep,
            y: exitPos.y * cellStep,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        >
          <motion.div
            className="w-4 h-4 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center border-2 border-green-200"
            style={{
              boxShadow: '0 0 15px rgba(52, 211, 153, 0.8)',
            }}
            animate={{
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            <Flag className="w-2 h-2 text-white" strokeWidth={3} fill="white" />
          </motion.div>
        </motion.div>
        
        {/* Animated Player */}
        <motion.div
          className="absolute pointer-events-none w-6 h-6 flex items-center justify-center"
          style={{
            left: 12, // p-3
            top: 12,
            zIndex: 20,
          }}
          initial={false}
          animate={{
            x: playerPos.x * cellStep,
            y: playerPos.y * cellStep,
          }}
          transition={{
            type: 'spring',
            stiffness: 800,
            damping: 30,
            mass: 0.3,
          }}
        >
          {/* Glow effect during movement */}
          <motion.div
            className="absolute inset-0 bg-cyan-400 rounded-full blur-md"
            animate={{
              opacity: [0, 0.5, 0],
              scale: [0.7, 1.4, 0.7],
            }}
            transition={{
              duration: 0.3,
              ease: 'easeOut',
            }}
            key={`glow-${playerPos.x}-${playerPos.y}`}
          />
          
          <motion.div
            className="w-4 h-4 bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 rounded-full flex items-center justify-center border-2 border-cyan-200 relative z-10"
            style={{
              boxShadow: '0 0 20px rgba(34, 211, 238, 0.9)',
            }}
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
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
}

const MazeCell = memo(function MazeCell({ type }: MazeCellProps) {
  const baseClass = 'w-6 h-6 rounded-sm transition-all duration-150';
  
  if (type === 'wall') {
    return (
      <div
        className={`${baseClass} bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 border border-purple-400/50`}
        style={{
          boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)',
        }}
      />
    );
  }
  
  // path
  return (
    <div className={`${baseClass} bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border border-purple-800/30`} />
  );
});
