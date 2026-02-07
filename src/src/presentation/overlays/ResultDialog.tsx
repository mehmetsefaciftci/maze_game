/**
 * Result Dialog Component
 * Shows win/lose overlay using Radix Dialog
 */

import { motion } from 'motion/react';
import { Trophy, Skull, Sparkles } from 'lucide-react';
import type { GameStatus } from '../../game/types';

interface ResultDialogProps {
  status: GameStatus;
  level: number;
  movesUsed: number;
  isFinalLevel: boolean;
  onRestart: () => void;
  onNextLevel: () => void;
  onMenu: () => void;
}

export function ResultDialog({
  status,
  level,
  movesUsed,
  isFinalLevel,
  onRestart,
  onNextLevel,
  onMenu,
}: ResultDialogProps) {
  if (status === 'playing') {
    return null;
  }

  const isWin = status === 'won';
  const isStageTransition = isWin && [50, 100, 150, 200].includes(level);
  const stageTransitionText = (() => {
    switch (level) {
      case 50:
        return { from: 'Gezegen', to: 'Buz' };
      case 100:
        return { from: 'Buz', to: 'Toprak' };
      case 150:
        return { from: 'Toprak', to: 'Kum' };
      case 200:
        return { from: 'Kum', to: 'Volkan' };
      default:
        return null;
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 100 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.5, opacity: 0, y: 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`${
          isWin
            ? 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500'
            : 'bg-gradient-to-br from-red-600 via-orange-600 to-red-700'
        } rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl relative overflow-hidden`}
        style={{
          boxShadow: isWin
            ? '0 0 60px rgba(168, 85, 247, 0.8)'
            : '0 0 60px rgba(239, 68, 68, 0.8)',
        }}
      >
        {/* Animated particles for win */}
        {isWin && (
          <>
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                initial={{ x: '50%', y: '50%', scale: 0 }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 200}%`,
                  y: `${50 + (Math.random() - 0.5) * 200}%`,
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </>
        )}

        {/* Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className={`relative w-24 h-24 ${
            isWin
              ? 'bg-gradient-to-br from-yellow-300 to-yellow-500'
              : 'bg-gradient-to-br from-orange-400 to-red-500'
          } rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-white`}
        >
          {isWin ? (
            <Trophy className="w-12 h-12 text-white" strokeWidth={3} />
          ) : (
            <Skull className="w-12 h-12 text-white" strokeWidth={3} />
          )}
        </motion.div>

        {/* Title */}
        <h2
          className="text-5xl font-black text-white mb-3"
          style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
        >
          {isWin ? 'Tebrikler!' : 'Oyun Bitti!'}
        </h2>

        {isStageTransition && stageTransitionText && (
          <div className="text-white/95 text-base font-bold mb-2">
            {stageTransitionText.from} aşamasını tamamladınız ve {stageTransitionText.to} aşamasına ulaştınız.
          </div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 my-6 border-2 border-white/30"
        >
          <div className="text-sm text-white/90 mb-1 flex items-center justify-center gap-2 font-bold">
            <Sparkles className="w-4 h-4" />
            {isWin ? 'HAMLE SAYISI' : 'SEVİYE'}
          </div>
          <div className="text-6xl font-black text-white tabular-nums">
            {isWin ? movesUsed : level}
          </div>
        </motion.div>

        {/* Buttons */}
        <div className="flex gap-2">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMenu}
            className="flex-1 bg-white/15 backdrop-blur-sm text-white py-4 rounded-2xl font-black text-lg shadow-2xl border-2 border-white/20"
          >
            Menüye Dön
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRestart}
            className="flex-1 bg-white/20 backdrop-blur-sm text-white py-4 rounded-2xl font-black text-lg shadow-2xl border-2 border-white/30"
          >
            {isWin ? 'Tekrar Oyna' : 'Tekrar Dene'}
          </motion.button>

          {isWin && !isFinalLevel && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNextLevel}
              className="flex-1 bg-white text-purple-600 py-4 rounded-2xl font-black text-lg shadow-2xl"
            >
              {isStageTransition && stageTransitionText
                ? `Sıradaki Aşama: ${stageTransitionText.to}`
                : `Sonraki Seviye: ${level + 1}`}
            </motion.button>
          )}
        </div>
        {isWin && isFinalLevel && (
          <div className="mt-4 text-white/90 text-sm font-bold">
            Final seviye tamamlandı!
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
