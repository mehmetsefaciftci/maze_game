import { useEffect } from 'react';
import styles from './BottomSheetDailyQuests.module.css';

export interface DailyQuestItem {
  id: string;
  title: string;
  current: number;
  target: number;
  rewardLabel: string;
  claimed?: boolean;
  claimable?: boolean;
  onClaim?: () => void;
}

interface BottomSheetDailyQuestsProps {
  open: boolean;
  quests: DailyQuestItem[];
  onClose: () => void;
}

function clampProgress(current: number, target: number) {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(target, current));
}

export function BottomSheetDailyQuests({ open, quests, onClose }: BottomSheetDailyQuestsProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className={`${styles.root} ${open ? styles.open : ''}`} aria-hidden={!open}>
      <button type="button" className={styles.backdrop} aria-label="Close quests" onClick={onClose} />
      <section className={styles.sheet} role="dialog" aria-modal="true" aria-label="Daily quests">
        <div className={styles.handle} aria-hidden="true" />
        <header className={styles.header}>
          <h2 className={styles.title}>Daily Quests</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
            Close
          </button>
        </header>

        <ul className={styles.list}>
          {quests.map((quest) => {
            const value = clampProgress(quest.current, quest.target);
            const claimDisabled = quest.claimed || !quest.claimable || !quest.onClaim;

            return (
              <li key={quest.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <p className={styles.itemTitle}>{quest.title}</p>
                  <span className={styles.itemCount}>
                    {quest.current}/{quest.target}
                  </span>
                </div>

                <progress className={styles.progress} value={value} max={Math.max(1, quest.target)} />

                <div className={styles.itemFoot}>
                  <span className={styles.reward}>{quest.rewardLabel}</span>
                  <button
                    type="button"
                    className={styles.claim}
                    onClick={quest.onClaim}
                    disabled={claimDisabled}
                    aria-label={quest.claimed ? 'Claimed' : 'Claim reward'}
                  >
                    {quest.claimed ? 'Claimed' : 'Claim'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
