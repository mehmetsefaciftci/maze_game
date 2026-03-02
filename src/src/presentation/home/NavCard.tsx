import styles from './NavCard.module.css';

export type NavCardTone = 'map' | 'daily';

interface NavCardProps {
  title: string;
  subtitle: string;
  tone: NavCardTone;
  onClick: () => void;
}

export function NavCard({ title, subtitle, tone, onClick }: NavCardProps) {
  return (
    <button type="button" className={`${styles.card} ${styles[tone]}`} onClick={onClick}>
      <div className={styles.preview} aria-hidden="true">
        <span className={styles.previewIcon}>{tone === 'map' ? '🧭' : '☑'}</span>
      </div>
      <div className={styles.text}>
        <p className={styles.title}>{title}</p>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
      <span className={styles.arrow} aria-hidden="true">
        ›
      </span>
    </button>
  );
}
