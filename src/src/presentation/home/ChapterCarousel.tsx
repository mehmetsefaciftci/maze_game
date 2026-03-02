import { useId } from 'react';
import styles from './ChapterCarousel.module.css';

export type ChapterTheme = 'cosmic' | 'ice' | 'sand' | 'soil' | 'volcano';

export interface ChapterItem {
  id: string;
  title: string;
  completedText: string;
  progress: number;
  icon: string;
  theme: ChapterTheme;
  onOpen: () => void;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function themeClass(theme: ChapterTheme) {
  switch (theme) {
    case 'ice':
      return styles.ice;
    case 'sand':
      return styles.sand;
    case 'soil':
      return styles.soil;
    case 'volcano':
      return styles.volcano;
    default:
      return styles.cosmic;
  }
}

export function ChapterCarousel({ items }: { items: ChapterItem[] }) {
  const idBase = useId();

  return (
    <section className={styles.wrap} aria-label="Chapters">
      <div className={styles.head}>
        <h2 className={styles.title}>Chapters</h2>
      </div>

      <div className={styles.row}>
        {items.map((item, index) => {
          const safeProgress = clamp(item.progress);
          const r = 14;
          const c = 2 * Math.PI * r;
          const dash = c - (safeProgress / 100) * c;
          const gradId = `${idBase}-${index}`;

          return (
            <button key={item.id} type="button" className={`${styles.card} ${themeClass(item.theme)}`} onClick={item.onOpen}>
              <svg className={styles.ring} viewBox="0 0 40 40" aria-hidden="true">
                <defs>
                  <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop className={styles.stopA} offset="0%" />
                    <stop className={styles.stopB} offset="100%" />
                  </linearGradient>
                </defs>
                <circle className={styles.ringTrack} cx="20" cy="20" r={r} />
                <circle
                  className={styles.ringFill}
                  cx="20"
                  cy="20"
                  r={r}
                  strokeDasharray={c}
                  strokeDashoffset={dash}
                  stroke={`url(#${gradId})`}
                />
              </svg>
              <span className={styles.icon} aria-hidden="true">
                {item.icon}
              </span>
              <p className={styles.cardTitle}>{item.title}</p>
              <p className={styles.completed}>{item.completedText}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
