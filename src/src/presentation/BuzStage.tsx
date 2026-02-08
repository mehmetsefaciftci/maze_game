import { useMemo } from 'react';
import type { RefObject } from 'react';
import { motion } from 'motion/react';
import { Snowflake } from 'lucide-react';
import type { MazeState } from '../game/types';
import { MazeGrid } from './MazeGrid';

interface BuzStageProps {
  gameState: MazeState;
  onPause: () => void;
  onRestart: () => void;
  onMenuReturn: () => void;
  mazeScale: number;
  mazeSlotRef: RefObject<HTMLDivElement>;
}

function SnowOverlay() {
  // Generate once for stable snow and better perf
  const flakes = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        id: `snow-${i}`,
        size: 2 + Math.random() * 3,
        left: Math.random() * 100,
        duration: 6 + Math.random() * 8,
        delay: Math.random() * 4,
        drift: (Math.random() - 0.5) * 22,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {flakes.map((flake) => (
        <motion.div
          key={flake.id}
          className="absolute rounded-full bg-white/80"
          style={{
            width: flake.size,
            height: flake.size,
            left: `${flake.left}%`,
            top: `-12%`,
            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.25))',
          }}
          animate={{
            y: ['0%', '125%'],
            x: [`0%`, `${flake.drift}%`],
            opacity: [0.5, 0.9, 0.5],
          }}
          transition={{
            duration: flake.duration,
            repeat: Infinity,
            delay: flake.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

export function BuzStage({
  gameState,
  onPause,
  onRestart,
  onMenuReturn,
  mazeScale,
  mazeSlotRef,
}: BuzStageProps) {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.max(0, totalSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <div className="min-h-dvh w-full relative overflow-hidden">
      {/* background layers (winter cave vibe, low cost) */}
      <div
        className="absolute inset-0"
        style={{
          background: "url('/stages/ice-bg.png') center / cover no-repeat",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(120% 70% at 50% 8%, rgba(220, 245, 255, 0.18), transparent 62%), radial-gradient(120% 70% at 50% 100%, rgba(20, 40, 70, 0.35), transparent 60%)',
        }}
      />

      <SnowOverlay />

      {/* ice cave frame */}
      <div className="absolute inset-0 pointer-events-none">
        {/* top shelf */}
        <div
          className="absolute left-0 right-0 top-0 h-28 rounded-b-[48px]"
          style={{
            background:
              'linear-gradient(180deg, rgba(235, 248, 255, 0.95) 0%, rgba(190, 225, 250, 0.9) 55%, rgba(140, 195, 235, 0.75) 100%)',
            boxShadow:
              '0 12px 30px rgba(160, 210, 240, 0.35), inset 0 -8px 18px rgba(120, 180, 220, 0.35)',
          }}
        />
        <div
          className="absolute left-10 right-10 top-14 h-6 rounded-full opacity-70"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(210, 235, 255, 0.6) 100%)',
          }}
        />
        {/* icicles */}
        <div className="absolute left-16 right-16 top-16 flex justify-between">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`icicle-${i}`}
              className="rounded-b-full"
              style={{
                width: 14 + i * 2,
                height: 54 + (i % 3) * 20,
                background:
                  'linear-gradient(180deg, rgba(220, 245, 255, 0.95) 0%, rgba(150, 210, 245, 0.6) 60%, rgba(110, 170, 220, 0.4) 100%)',
                boxShadow: '0 10px 18px rgba(120, 180, 220, 0.35)',
              }}
            />
          ))}
        </div>

        {/* side walls */}
        <div
          className="absolute -left-6 top-24 bottom-20 w-56"
          style={{
            background:
              'linear-gradient(90deg, rgba(220, 245, 255, 0.95) 0%, rgba(140, 200, 235, 0.75) 45%, rgba(90, 150, 205, 0.35) 75%, transparent 100%)',
            filter: 'blur(0.4px)',
            borderTopRightRadius: 60,
            borderBottomRightRadius: 60,
          }}
        />
        <div
          className="absolute -right-6 top-24 bottom-20 w-56"
          style={{
            background:
              'linear-gradient(270deg, rgba(220, 245, 255, 0.95) 0%, rgba(140, 200, 235, 0.75) 45%, rgba(90, 150, 205, 0.35) 75%, transparent 100%)',
            filter: 'blur(0.4px)',
            borderTopLeftRadius: 60,
            borderBottomLeftRadius: 60,
          }}
        />

        {/* bottom snow bank */}
        <div
          className="absolute left-0 right-0 bottom-0 h-32"
          style={{
            background:
              'linear-gradient(0deg, rgba(235, 248, 255, 0.98) 0%, rgba(190, 225, 250, 0.9) 45%, rgba(150, 200, 235, 0.65) 100%)',
            borderTopLeftRadius: 140,
            borderTopRightRadius: 140,
            boxShadow: '0 -12px 26px rgba(150, 200, 235, 0.35)',
          }}
        />
        <div
          className="absolute left-12 right-12 bottom-14 h-6 rounded-full opacity-70"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(210, 235, 255, 0.55) 100%)',
          }}
        />
      </div>

      {/* subtle snow dust layer (static, low cost) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-35"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 10% 30%, rgba(255,255,255,0.45) 0, transparent 70%), radial-gradient(1px 1px at 30% 60%, rgba(255,255,255,0.35) 0, transparent 70%), radial-gradient(1px 1px at 55% 45%, rgba(255,255,255,0.35) 0, transparent 70%), radial-gradient(1px 1px at 75% 55%, rgba(255,255,255,0.35) 0, transparent 70%), radial-gradient(1px 1px at 90% 35%, rgba(255,255,255,0.3) 0, transparent 70%)',
          backgroundSize: '220px 220px',
        }}
      />

      {/* content */}
      <div className="relative z-10 flex flex-col min-h-dvh">
        <div className="px-4 py-4">
          <div className="relative z-10 max-w-md mx-auto space-y-3">
            <div className="flex items-center justify-between gap-3">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="px-4 py-2 rounded-2xl text-white shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, #7dd3fc 0%, #60a5fa 100%)',
                  boxShadow: '0 0 22px rgba(56, 189, 248, 0.45)',
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
                    background: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)',
                    boxShadow: '0 0 22px rgba(245, 158, 11, 0.45)',
                  }}
                >
                  <Snowflake size={18} className="text-white/90" />
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
                  background: 'linear-gradient(135deg, #fbbf24 0%, #fb7185 100%)',
                  boxShadow: '0 0 26px rgba(251, 191, 36, 0.45)',
                }}
              >
                <div className="text-xs font-bold opacity-80">KALAN HAMLE</div>
                <div className="text-2xl font-black tabular-nums">{gameState.movesLeft}</div>
              </motion.div>

              {gameState.timeLeft !== null && (
                <motion.div
                  key={gameState.timeLeft}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="px-4 py-2 rounded-2xl text-white shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
                    boxShadow: '0 0 26px rgba(56, 189, 248, 0.45)',
                  }}
                >
                  <div className="text-xs font-bold opacity-80">SÜRE</div>
                  <div className="text-2xl font-black tabular-nums">{formatTime(gameState.timeLeft)}</div>
                </motion.div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={onPause}
                  className="rounded-full text-base font-black text-white transition-all flex items-center justify-center"
                  style={{
                    width: '90.29px',
                    height: '41.6px',
                    background: 'linear-gradient(180deg, rgba(84, 72, 130, 0.95) 0%, rgba(60, 52, 98, 0.95) 100%)',
                    boxShadow:
                      '0 12px 26px rgba(22, 15, 60, 0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}
                >
                  Duraklat
                </button>
                <button
                  onClick={onRestart}
                  className="rounded-full text-base font-black text-white transition-all flex items-center justify-center"
                  style={{
                    width: '90.29px',
                    height: '41.6px',
                    background: 'linear-gradient(180deg, rgba(46, 98, 130, 0.9) 0%, rgba(32, 70, 98, 0.92) 100%)',
                    boxShadow:
                      '0 12px 26px rgba(22, 15, 60, 0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}
                >
                  Yeniden Başla
                </button>
              </div>
            </div>

            <div className="bg-white/10 rounded-full h-2 overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, Math.round((gameState.movesLeft / gameState.maxMoves) * 100)))}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {gameState.timeLeft !== null && gameState.maxTime !== null && (
              <div className="bg-white/10 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                <motion.div
                  className="h-full bg-gradient-to-r from-sky-300 to-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, Math.round((gameState.timeLeft / gameState.maxTime) * 100)))}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
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
                  icyCells={gameState.icyCells}
                  lastMoveIcy={gameState.lastMoveIcy}
                  sandStormActive={gameState.sandStormActive}
                  theme="buz"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
