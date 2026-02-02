/**
 * Game Screen Component
 * Main presentation layer that integrates all UI components
 */

import { useReducer, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { Coins } from 'lucide-react';
import { gameReducer, createLevel } from '../game/reducer';
import { getGridForRender, canUndo, getProgress } from '../game/selectors';
import { type Direction } from '../game/types';
import { MazeGrid } from './MazeGrid';
import { Controls } from './Controls';
import { ResultDialog } from './overlays/ResultDialog';

export function GameScreen() {
  const [state, dispatch] = useReducer(gameReducer, null, () => createLevel(1));

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Memoized selectors
  const grid = useMemo(() => getGridForRender(state), [state]);
  const canUndoMove = useMemo(() => canUndo(state), [state]);
  const progress = useMemo(() => getProgress(state), [state]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.status !== 'playing') return;

      let direction: Direction | null = null;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 'up';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 'down';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = 'left';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = 'right';
          break;
        case 'z':
        case 'Z':
          if (canUndoMove) {
            dispatch({ type: 'UNDO' });
          }
          return;
        case 'r':
        case 'R':
          dispatch({ type: 'RESTART' });
          return;
      }

      if (direction) {
        e.preventDefault();
        dispatch({ type: 'MOVE', direction });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.status, canUndoMove]);

  // Touch/swipe controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || state.status !== 'playing') return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const minSwipeDistance = 30;

    let direction: Direction | null = null;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        direction = deltaX > 0 ? 'right' : 'left';
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        direction = deltaY > 0 ? 'down' : 'up';
      }
    }

    if (direction) {
      dispatch({ type: 'MOVE', direction });
    }

    touchStartRef.current = null;
  };

  const handleMove = (direction: Direction) => {
    dispatch({ type: 'MOVE', direction });
  };

  const handleUndo = () => {
    dispatch({ type: 'UNDO' });
  };

  const handleRestart = () => {
    dispatch({ type: 'RESTART' });
  };

  const handleNextLevel = () => {
    dispatch({ type: 'NEXT_LEVEL' });
  };

  const movesUsed = state.maxMoves - state.movesLeft;

  return (
    <div
      className="min-h-dvh w-full flex flex-col bg-gradient-to-b from-indigo-950 via-purple-950 to-indigo-900 overflow-hidden select-none relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated background stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="px-4 py-4 relative z-10">
        <div className="max-w-md mx-auto space-y-3">
          {/* Level and Moves */}
          <div className="flex items-center justify-between gap-3">
            {/* Level */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white px-4 py-2 rounded-2xl shadow-2xl relative"
              style={{
                boxShadow: '0 0 25px rgba(124, 58, 237, 0.5)',
              }}
            >
              <div className="text-xs font-bold opacity-80">SEVİYE</div>
              <div className="text-2xl font-black tabular-nums">{state.level}</div>
            </motion.div>

            {/* Coins (if level has coins) */}
            {state.coins.length > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-amber-500 to-yellow-600 text-white px-4 py-2 rounded-2xl shadow-2xl relative flex items-center gap-2"
                style={{
                  boxShadow: '0 0 25px rgba(245, 158, 11, 0.5)',
                }}
              >
                <Coins className="w-5 h-5" strokeWidth={2.5} />
                <div className="text-xl font-black tabular-nums">
                  {state.collectedCoins.size}/{state.coins.length}
                </div>
              </motion.div>
            )}

            {/* Moves Left */}
            <motion.div
              key={state.movesLeft}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex-1 bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 text-white px-4 py-2 rounded-2xl shadow-2xl relative"
              style={{
                boxShadow: '0 0 30px rgba(251, 191, 36, 0.5)',
              }}
            >
              <div className="text-xs font-bold opacity-80">KALAN HAMLE</div>
              <div className="text-2xl font-black tabular-nums">{state.movesLeft}</div>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white/10 rounded-full h-2 overflow-hidden backdrop-blur-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <MazeGrid 
            grid={grid} 
            playerPos={state.playerPos}
            exitPos={state.exitPos}
            coins={state.coins}
            doors={state.doors}
            collectedCoins={state.collectedCoins}
          />
        </motion.div>
      </div>

      {/* Controls */}
      <div className="pb-8 px-4 relative z-10">
        <div className="max-w-md mx-auto">
          <Controls
            canUndo={canUndoMove}
            onUndo={handleUndo}
            onRestart={handleRestart}
            onMove={handleMove}
            disabled={state.status !== 'playing'}
          />
        </div>
      </div>

      {/* Result Dialog */}
      <ResultDialog
        status={state.status}
        level={state.level}
        movesUsed={movesUsed}
        onRestart={handleRestart}
        onNextLevel={handleNextLevel}
      />
    </div>
  );
}
