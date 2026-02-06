import type { RefObject } from 'react';
import { motion } from 'motion/react';
import { Coins } from 'lucide-react';
import type { MazeState } from '../game/types';
import { MazeGrid } from './MazeGrid';

interface ToprakStageProps {
  gameState: MazeState;
  onPause: () => void;
  mazeScale: number;
  mazeSlotRef: RefObject<HTMLDivElement>;
}

// Art prompt notes (tile states):
// 1) Normal soil (safe): top-down stylized terra tile, warm clay/earth browns, smooth matte, no cracks.
// 2) Cracked soil (warning): slightly darker, subtle thin cracks, light dust, warning state.
// 3) Collapsed soil (blocked): dark hollow center, crumbled edges, impassable.

export function ToprakStage({ gameState, onPause, mazeScale, mazeSlotRef }: ToprakStageProps) {
  return (
    <div className="min-h-dvh w-full relative overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: "url('/stages/toprak-bg.png') center / cover no-repeat",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 0%, rgba(255, 220, 180, 0.08) 0%, transparent 60%), radial-gradient(120% 80% at 50% 100%, rgba(40, 20, 10, 0.35) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 flex flex-col min-h-dvh">
        <div className="px-4 py-4">
          <div className="relative z-10 max-w-md mx-auto space-y-3">
            <div className="flex items-center justify-between gap-3">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="px-4 py-2 rounded-2xl text-white shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, #c0843d 0%, #8b5a2b 100%)',
                  boxShadow: '0 0 22px rgba(120, 72, 35, 0.45)',
                }}
              >
                <div className="text-xs font-bold opacity-80">SEVİYE</div>
                <div className="text-2xl font-black tabular-nums">{gameState.level}</div>
              </motion.div>

              {gameState.coins.length > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="px-4 py-2 rounded-2xl text-white shadow-2xl flex items-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
                    boxShadow: '0 0 22px rgba(249, 115, 22, 0.45)',
                  }}
                >
                  <Coins className="w-5 h-5" strokeWidth={2.5} />
                  <div className="text-xl font-black tabular-nums">
                    {gameState.collectedCoins.size}/{gameState.coins.length}
                  </div>
                </motion.div>
              )}

              <motion.div
                key={gameState.movesLeft}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex-1 px-4 py-2 rounded-2xl text-white shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, #ef9f4a 0%, #c2410c 100%)',
                  boxShadow: '0 0 26px rgba(194, 65, 12, 0.45)',
                }}
              >
                <div className="text-xs font-bold opacity-80">KALAN HAMLE</div>
                <div className="text-2xl font-black tabular-nums">{gameState.movesLeft}</div>
              </motion.div>

              <button
                onClick={onPause}
                className="rounded-full text-base font-black text-white transition-all flex items-center justify-center"
                style={{
                  width: '90.29px',
                  height: '41.6px',
                  background: 'linear-gradient(180deg, rgba(96, 66, 44, 0.95) 0%, rgba(58, 38, 26, 0.95) 100%)',
                  boxShadow: '0 12px 26px rgba(35, 22, 14, 0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
                }}
              >
                Duraklat
              </button>
            </div>

            <div className="bg-white/10 rounded-full h-2 overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-300 to-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, Math.round((gameState.movesLeft / gameState.maxMoves) * 100)))}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 w-full p-4 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full flex items-center justify-center"
          >
            <div ref={mazeSlotRef} className="relative flex items-center justify-center">
              <div
                style={{
                  transform: `scale(${mazeScale})`,
                  transformOrigin: 'center',
                }}
              >
                <MazeGrid
                  grid={gameState.grid.cells}
                  playerPos={gameState.playerPos}
                  exitPos={gameState.exitPos}
                  coins={gameState.coins}
                  doors={gameState.doors}
                  collectedCoins={gameState.collectedCoins}
                  theme="toprak"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
