import { useEffect, useId, useMemo, useState } from 'react';
import styles from './MoveCounter.module.css';

interface MoveCounterProps {
  currentMoves: number;
  maxMoves: number;
}

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function MoveCounter({ currentMoves, maxMoves }: MoveCounterProps) {
  const ringId = useId();
  const safeMax = Math.max(1, maxMoves);
  const safeMoves = clamp(currentMoves, 0, safeMax);
  const progress = safeMoves / safeMax;
  const isLow = safeMoves < 5;
  const isCritical = safeMoves <= 2;
  const [bump, setBump] = useState(false);

  const dashOffset = useMemo(
    () => RING_CIRCUMFERENCE * (1 - progress),
    [progress]
  );

  useEffect(() => {
    setBump(true);
    const timer = window.setTimeout(() => setBump(false), 220);
    return () => window.clearTimeout(timer);
  }, [safeMoves]);

  return (
    <div
      className={`${styles.wrap} ${isLow ? styles.low : ''} ${isCritical ? styles.critical : ''}`}
      aria-label={`Moves left ${safeMoves} out of ${safeMax}`}
    >
      <div className={styles.counter}>
        <svg className={styles.ring} viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <linearGradient id={ringId} x1="15%" y1="12%" x2="92%" y2="92%">
              <stop className={styles.ringStopA} offset="0%" />
              <stop className={styles.ringStopB} offset="100%" />
            </linearGradient>
          </defs>
          <circle className={styles.ringTrack} cx="60" cy="60" r={RING_RADIUS} />
          <circle
            className={styles.ringProgress}
            cx="60"
            cy="60"
            r={RING_RADIUS}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            stroke={`url(#${ringId})`}
          />
        </svg>

        <div className={styles.face}>
          <span className={styles.label}>Moves</span>
          <span className={`${styles.value} ${bump ? styles.bump : ''}`}>{safeMoves}</span>
          <span className={styles.max}>/ {safeMax}</span>
        </div>
      </div>
    </div>
  );
}
