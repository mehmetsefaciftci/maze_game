import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Coins, Mountain } from 'lucide-react';
import type { MazeState } from '../game/types';
import { MazeGrid } from './MazeGrid';

interface ToprakStageProps {
  gameState: MazeState;
  onPause: () => void;
  onRestart: () => void;
  mazeScale: number;
  mazeSlotRef: RefObject<HTMLDivElement>;
}

// Art prompt notes (tile states):
// 1) Normal soil (safe): top-down stylized terra tile, warm clay/earth browns, smooth matte, no cracks.
// 2) Cracked soil (warning): slightly darker, subtle thin cracks, light dust, warning state.
// 3) Collapsed soil (blocked): dark hollow center, crumbled edges, impassable.

export function ToprakStage({
  gameState,
  onPause,
  onRestart,
  mazeScale,
  mazeSlotRef,
}: ToprakStageProps) {
  const [showIntro, setShowIntro] = useState(false);
  const prevLevelRef = useRef<number | null>(null);
  const prevHistoryLenRef = useRef<number>(0);

  useEffect(() => {
    if (gameState.status !== 'playing') return;
    const isFreshStart = gameState.history.length === 0 && gameState.movesLeft === gameState.maxMoves;
    if (!isFreshStart) return;
    const prevLevel = prevLevelRef.current;
    const prevHistoryLen = prevHistoryLenRef.current;
    const isFirstEnter = prevLevel !== gameState.level;
    const isRestart = prevLevel === gameState.level && prevHistoryLen > 0;
    if (isFirstEnter || isRestart) {
      setShowIntro(true);
    }
  }, [gameState.status, gameState.history.length, gameState.movesLeft, gameState.maxMoves, gameState.level]);

  useEffect(() => {
    prevLevelRef.current = gameState.level;
    prevHistoryLenRef.current = gameState.history.length;
  }, [gameState.level, gameState.history.length]);

  const handleCloseIntro = () => {
    setShowIntro(false);
  };

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
        {showIntro &&
          createPortal(
            <div
              className="fixed inset-0 flex items-center justify-center p-4"
              style={{ zIndex: 2147483647, position: 'fixed', pointerEvents: 'auto', isolation: 'isolate' }}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-[92%] sm:max-w-[420px] rounded-2xl p-5 text-white shadow-2xl"
                style={{
                  backgroundColor: '#2b1606',
                  border: '1px solid #3a1f10',
                  boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: '#5a3a1f' }}
                  >
                    <Mountain className="w-5 h-5" style={{ color: '#fff1d6' }} />
                  </div>
                  <div className="font-black text-base" style={{ color: '#fff1d6' }}>
                    Toprak Aşaması
                  </div>
                </div>
                <div className="mt-2 text-[13px] font-semibold leading-relaxed" style={{ color: '#fff7e6' }}>
                  Toprak zemin aşınır. Aynı yerden çok geçersen çökebilir.
                </div>
                <div className="mt-3">
                  <button
                    onClick={handleCloseIntro}
                    className="w-full rounded-lg py-2 text-sm font-black"
                    style={{
                      backgroundColor: '#6b3a1c',
                      color: '#fff1d6',
                      border: '1px solid #8b5e34',
                    }}
                  >
                    Tamam
                  </button>
                </div>
              </motion.div>
            </div>,
            document.body
          )}
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

              <div className="flex items-center gap-2">
                <button
                  onClick={onPause}
                  aria-label="Duraklat"
                  title="Duraklat"
                  className="rounded-full text-base font-black text-white transition-all flex items-center justify-center p-0"
                  style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(180deg, rgba(96, 66, 44, 0.95) 0%, rgba(58, 38, 26, 0.95) 100%)',
                    boxShadow:
                      '0 12px 26px rgba(35, 22, 14, 0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
                  }}
                >
                  <img
                    src="/icons/duraklat-ikonu.png"
                    alt=""
                    className="w-[40px] h-[40px] object-contain"
                    style={{ transform: 'translate(-2px, 2px)' }}
                    aria-hidden="true"
                  />
                </button>
                <button
                  onClick={onRestart}
                  aria-label="Yeniden Başla"
                  title="Yeniden Başla"
                  className="rounded-full text-base font-black text-white transition-all flex items-center justify-center p-0"
                  style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(180deg, rgba(136, 82, 42, 0.95) 0%, rgba(84, 48, 24, 0.95) 100%)',
                    boxShadow:
                      '0 12px 26px rgba(35, 22, 14, 0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
                  }}
                >
                  <img
                    src="/icons/yeniden-baslat-ikonu.png"
                    alt=""
                    className="w-[40px] h-[40px] object-contain"
                    style={{ transform: 'translate(0, 2px)' }}
                    aria-hidden="true"
                  />
                </button>
              </div>
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
                  soilVisits={gameState.soilVisits}
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
