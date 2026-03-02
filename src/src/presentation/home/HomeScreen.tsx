import { ChapterCarousel } from './ChapterCarousel';
import type { ChapterItem } from './ChapterCarousel';
import { CurrencyChip } from './CurrencyChip';
import type { CurrencyChipTone } from './CurrencyChip';
import { HeroContinueCard } from './HeroContinueCard';
import { NavCard } from './NavCard';
import styles from './HomeScreen.module.css';

interface HomeCurrency {
  id: string;
  icon: string;
  value: number;
  tone: CurrencyChipTone;
}

interface HomeScreenProps {
  // Connect auth state: `user.username`
  userName: string;
  // Connect game progression state: current chapter/stage name
  chapterName: string;
  // Connect game progression state: current level label (e.g. "Level 53")
  levelLabel: string;
  // Connect progression/theme state for hero icon
  heroIcon: string;
  // Connect economy state: energy, shards, coins...
  energy: HomeCurrency;
  // Connect economy state: right-side compact currency chips
  currencies: HomeCurrency[];
  // Connect chapter progression state for carousel
  chapters: ChapterItem[];
  // Connect daily quests aggregate state (e.g. "1/3 ready")
  dailySummary: string;
  // Connect existing action handlers:
  onContinue: () => void;
  onWorldMap: () => void;
  onDaily: () => void;
  onLogout: () => void;
  onSettings: () => void;
}

export function HomeScreen({
  userName,
  chapterName,
  levelLabel,
  heroIcon,
  energy,
  currencies,
  chapters,
  dailySummary,
  onContinue,
  onWorldMap,
  onDaily,
  onLogout,
  onSettings,
}: HomeScreenProps) {
  return (
    <div className={styles.screen}>
      <header className={styles.topBar}>
        <div className={styles.left}>
          <CurrencyChip icon={energy.icon} value={energy.value} tone={energy.tone} label="Energy" />
        </div>

        <div className={styles.right}>
          {currencies.map((currency) => (
            <CurrencyChip key={currency.id} icon={currency.icon} value={currency.value} tone={currency.tone} label={currency.id} />
          ))}

          <button type="button" className={styles.iconButton} onClick={onSettings} aria-label="Settings">
            <svg viewBox="0 0 24 24" className={styles.iconSvg} aria-hidden="true">
              <path
                d="M12 8.9a3.1 3.1 0 1 1 0 6.2 3.1 3.1 0 0 1 0-6.2Zm8 3.1-1.7-.7a7.3 7.3 0 0 0-.4-1l.8-1.6-1.8-1.8-1.6.8a7.3 7.3 0 0 0-1-.4L13.6 3h-3.2l-.7 1.7c-.3.1-.7.2-1 .4l-1.6-.8-1.8 1.8.8 1.6c-.2.3-.3.7-.4 1L3 10.4v3.2l1.7.7c.1.3.2.7.4 1l-.8 1.6 1.8 1.8 1.6-.8c.3.2.7.3 1 .4l.7 1.7h3.2l.7-1.7c.3-.1.7-.2 1-.4l1.6.8 1.8-1.8-.8-1.6c.2-.3.3-.7.4-1l1.7-.7v-3.2Z"
                fill="currentColor"
              />
            </svg>
          </button>
          <button type="button" className={styles.logoutButton} onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.userName}>{userName}</div>

        <HeroContinueCard
          chapterName={chapterName}
          levelLabel={levelLabel}
          subtext="Beat your best run"
          stageIcon={heroIcon}
          onContinue={onContinue}
        />

        <section className={styles.navGrid}>
          <NavCard title="World Map" subtitle="Explore chapters" tone="map" onClick={onWorldMap} />
          <NavCard title="Daily" subtitle={dailySummary} tone="daily" onClick={onDaily} />
        </section>

        <ChapterCarousel items={chapters} />
      </main>
    </div>
  );
}
