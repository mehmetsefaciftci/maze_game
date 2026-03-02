import styles from './HeroContinueCard.module.css';

interface HeroContinueCardProps {
  chapterName: string;
  levelLabel: string;
  subtext: string;
  stageIcon: string;
  onContinue: () => void;
}

export function HeroContinueCard({ chapterName, levelLabel, subtext, stageIcon, onContinue }: HeroContinueCardProps) {
  return (
    <section className={styles.card} aria-label="Continue run">
      <div className={styles.stageIcon} aria-hidden="true">
        {stageIcon}
      </div>

      <div className={styles.body}>
        <p className={styles.kicker}>Continue</p>
        <h1 className={styles.title}>{chapterName}</h1>
        <p className={styles.level}>{levelLabel}</p>
        <p className={styles.subtext}>{subtext}</p>
        <button type="button" className={styles.cta} onClick={onContinue}>
          Continue
        </button>
      </div>
    </section>
  );
}
