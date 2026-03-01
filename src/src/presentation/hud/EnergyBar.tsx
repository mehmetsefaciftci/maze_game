import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './EnergyBar.module.css';

interface EnergyBarProps {
  currentEnergy: number;
  maxEnergy: number;
  timerLabel: string;
  notice?: string | null;
  floating?: boolean;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function EnergyBar({ currentEnergy, maxEnergy, timerLabel, notice, floating = true }: EnergyBarProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const targetPercent = useMemo(() => {
    if (maxEnergy <= 0) return 0;
    return clampPercent((currentEnergy / maxEnergy) * 100);
  }, [currentEnergy, maxEnergy]);

  const [animatedPercent, setAnimatedPercent] = useState(targetPercent);
  const lowEnergy = targetPercent < 25;

  useEffect(() => {
    let raf = 0;
    let current = animatedPercent;
    const animate = () => {
      const diff = targetPercent - current;
      if (Math.abs(diff) < 0.08) {
        current = targetPercent;
        setAnimatedPercent(targetPercent);
        return;
      }
      current += diff * 0.12;
      setAnimatedPercent(current);
      raf = window.requestAnimationFrame(animate);
    };
    raf = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPercent]);

  useEffect(() => {
    if (!rootRef.current) return;
    rootRef.current.style.setProperty('--energy-fill', `${clampPercent(animatedPercent)}%`);
  }, [animatedPercent]);

  return (
    <div ref={rootRef} className={`${styles.wrap} ${floating ? styles.floating : ''} ${lowEnergy ? styles.low : ''}`}>
      <div className={styles.shell}>
        <div className={styles.glass} />
        <div className={styles.row}>
          <div className={styles.iconChip} aria-hidden="true">
            ⚡
          </div>

          <div className={styles.valueCore} aria-label="Energy value">
            <span className={styles.valueText}>
              {currentEnergy}/{maxEnergy}
            </span>
          </div>

          <button type="button" className={styles.plusChip} aria-label="Increase energy" title="Coming soon">
            +
          </button>
        </div>

        <div className={styles.track} aria-hidden="true">
          <div className={styles.fill} />
          <div className={styles.shimmer} />
        </div>
      </div>

      <div className={styles.timerPill}>{timerLabel}</div>

      {notice && <div className={styles.notice}>{notice}</div>}
    </div>
  );
}
