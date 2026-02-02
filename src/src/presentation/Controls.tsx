/**
 * Game Controls Component
 * Undo, Restart, and D-pad controls
 */

import { memo } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Undo2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Direction } from '../game/types';

interface ControlsProps {
  canUndo: boolean;
  onUndo: () => void;
  onRestart: () => void;
  onMove: (direction: Direction) => void;
  disabled?: boolean;
}

export const Controls = memo(function Controls({
  canUndo,
  onUndo,
  onRestart,
  onMove,
  disabled = false,
}: ControlsProps) {
  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onUndo}
          disabled={!canUndo || disabled}
          className="bg-gradient-to-br from-amber-500 to-orange-600 text-white px-4 py-2.5 rounded-xl shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          style={{
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
          }}
        >
          <Undo2 className="w-5 h-5" />
          <span className="font-bold text-sm">Geri Al</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRestart}
          disabled={disabled}
          className="bg-gradient-to-br from-pink-600 to-red-600 text-white px-4 py-2.5 rounded-xl shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          style={{
            boxShadow: '0 0 20px rgba(236, 72, 153, 0.4)',
          }}
        >
          <RotateCcw className="w-5 h-5" />
          <span className="font-bold text-sm">Yeniden</span>
        </motion.button>
      </div>

      {/* D-Pad Controls */}
      <div className="flex flex-col items-center gap-3">
        {/* Up */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onMove('up')}
          disabled={disabled}
          className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center shadow-xl disabled:opacity-30"
          style={{
            boxShadow: '0 0 20px rgba(34, 211, 238, 0.6)',
          }}
        >
          <ChevronUp className="w-8 h-8 text-white" strokeWidth={4} />
        </motion.button>

        {/* Left, Down, Right */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onMove('left')}
            disabled={disabled}
            className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center shadow-xl disabled:opacity-30"
            style={{
              boxShadow: '0 0 20px rgba(34, 211, 238, 0.6)',
            }}
          >
            <ChevronLeft className="w-8 h-8 text-white" strokeWidth={4} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onMove('down')}
            disabled={disabled}
            className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center shadow-xl disabled:opacity-30"
            style={{
              boxShadow: '0 0 20px rgba(34, 211, 238, 0.6)',
            }}
          >
            <ChevronDown className="w-8 h-8 text-white" strokeWidth={4} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onMove('right')}
            disabled={disabled}
            className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center shadow-xl disabled:opacity-30"
            style={{
              boxShadow: '0 0 20px rgba(34, 211, 238, 0.6)',
            }}
          >
            <ChevronRight className="w-8 h-8 text-white" strokeWidth={4} />
          </motion.button>
        </div>
      </div>
    </div>
  );
});
