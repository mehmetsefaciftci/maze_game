import { useEffect, useRef, useState } from 'react';
import { EnergyBar } from './EnergyBar';
import styles from './InGameHud.module.css';

interface InGameHudProps {
  level: number;
  movesLeft: number;
  coinsCollected: number;
  coinsTotal: number;
  score: number;
  currentEnergy: number;
  maxEnergy: number;
  energyTimerLabel: string;
  energyNotice?: string | null;
  onPause: () => void;
}

function useCountUp(target: number) {
  const [value, setValue] = useState(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    let current = value;
    const animate = () => {
      const diff = target - current;
      if (Math.abs(diff) < 0.5) {
        setValue(target);
        return;
      }
      current += diff * 0.18;
      setValue(current);
      rafRef.current = window.requestAnimationFrame(animate);
    };

    rafRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return Math.max(0, Math.round(value));
}

export function InGameHud({
  level,
  movesLeft,
  coinsCollected,
  coinsTotal,
  score,
  currentEnergy,
  maxEnergy,
  energyTimerLabel,
  energyNotice,
  onPause,
}: InGameHudProps) {
  const animatedScore = useCountUp(score);
  const coinText = coinsTotal > 0 ? `${coinsCollected}/${coinsTotal}` : '0/0';

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.topRow}>
          <div className={styles.leftCluster}>
            <div className={styles.scoreCard}>
              <div className={styles.scoreLabel}>Score</div>
              <div className={styles.scoreValue}>{animatedScore}</div>
            </div>
            <div className={styles.coinCard}>
              <span className={styles.coinIcon} aria-hidden="true" />
              <span className={styles.coinValue}>{coinText}</span>
            </div>
          </div>

          <div className={styles.rightCluster}>
            <div className={styles.levelChip}>L{level}</div>
            <div className={styles.movesCard} aria-label={`Moves left ${movesLeft}`}>
              {movesLeft}
            </div>
            <button type="button" className={styles.pauseBtn} onClick={onPause} aria-label="Pause" title="Pause">
              II
            </button>
          </div>
        </div>

        <div className={styles.energySlot}>
          <EnergyBar
            currentEnergy={currentEnergy}
            maxEnergy={maxEnergy}
            timerLabel={energyTimerLabel}
            notice={energyNotice}
            floating={false}
          />
        </div>
      </div>
    </div>
  );
}
