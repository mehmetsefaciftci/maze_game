import type { RefObject } from 'react';
import { motion } from 'motion/react';
import { Snowflake } from 'lucide-react';
import type { MazeState } from '../game/types';
import { MazeGrid } from './MazeGrid';

interface BuzStageProps {
  gameState: MazeState;
  onPause: () => void;
  onMenuReturn: () => void;
  mazeScale: number;
  mazeSlotRef: RefObject<HTMLDivElement>;
}

export function BuzStage({ gameState, onPause, onMenuReturn, mazeScale, mazeSlotRef }: BuzStageProps) {
  return (
    <div className="min-h-dvh w-full relative overflow-hidden">
      {/* background layers (winter cave vibe, low cost) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #0a1a33 0%, #0d274d 46%, #081426 100%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-35"
        style={{
          backgroundImage:
            'radial-gradient(40% 35% at 20% 20%, rgba(90, 140, 200, 0.22), transparent 70%), radial-gradient(38% 40% at 82% 26%, rgba(120, 170, 220, 0.18), transparent 72%), radial-gradient(45% 48% at 58% 70%, rgba(70, 120, 180, 0.18), transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-45"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,0.25) 0, transparent 70%), radial-gradient(1px 1px at 78% 28%, rgba(255,255,255,0.2) 0, transparent 70%), radial-gradient(1px 1px at 34% 72%, rgba(255,255,255,0.18) 0, transparent 70%), radial-gradient(1px 1px at 64% 62%, rgba(255,255,255,0.18) 0, transparent 70%), radial-gradient(1px 1px at 50% 52%, rgba(255,255,255,0.2) 0, transparent 70%)',
          backgroundSize: '240px 240px',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-8"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 45%), radial-gradient(120% 70% at 50% 12%, rgba(200, 230, 255, 0.18), transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(120% 70% at 50% 8%, rgba(220, 245, 255, 0.16), transparent 62%), radial-gradient(120% 70% at 50% 100%, rgba(40, 70, 110, 0.4), transparent 60%)',
        }}
      />

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

              <button
                onClick={onPause}
                className="px-7 py-3 rounded-full text-base font-black text-white transition-all"
                style={{
                  background: 'linear-gradient(180deg, rgba(84, 72, 130, 0.95) 0%, rgba(60, 52, 98, 0.95) 100%)',
                  boxShadow:
                    '0 12px 26px rgba(22, 15, 60, 0.45), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}
              >
                Duraklat
              </button>
            </div>

            <div className="bg-white/10 rounded-full h-2 overflow-hidden backdrop-blur-sm">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-600"
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
