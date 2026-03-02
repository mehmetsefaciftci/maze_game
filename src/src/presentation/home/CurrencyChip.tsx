import styles from './CurrencyChip.module.css';

export type CurrencyChipTone = 'energy' | 'shard' | 'coin';

interface CurrencyChipProps {
  icon: string;
  value: number;
  tone: CurrencyChipTone;
  label: string;
}

export function CurrencyChip({ icon, value, tone, label }: CurrencyChipProps) {
  return (
    <div className={`${styles.chip} ${styles[tone]}`} aria-label={`${label} ${value}`}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}
