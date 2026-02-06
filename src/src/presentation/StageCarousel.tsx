import { motion } from 'motion/react';
import { MAX_LEVEL } from '../game/types';
import { THEMES, THEME_KEYS, type ThemeKey } from '../themes';

type StageKey = ThemeKey;

type Stage = {
  key: StageKey;
  title: string;
  subtitle: string;
  gradient: string;
  rangeText: string;
  startLevel: number;
  endLevel: number;
};

interface StageCarouselProps {
  username?: string;
  completedSet: Set<number>;
  currentLevel: number;
  unlockedUntil: number;
  onPickLevel: (level: number) => void;
  onBack: () => void;
  onLogout?: () => void;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function StageCarousel({
  username,
  completedSet,
  currentLevel,
  unlockedUntil,
  onPickLevel,
  onBack,
  onLogout,
}: StageCarouselProps) {
  const maxFromThemes = Math.max(...THEME_KEYS.map((key) => THEMES[key].levelRange.end));
  // MAX_LEVEL beklenen: 250. Yine de güvenli olsun diye clamp.
  const safeMax = Math.max(MAX_LEVEL, maxFromThemes);

  const stages: Stage[] = THEME_KEYS.map((key, idx) => {
    const theme = THEMES[key];
    const rawStart = theme.levelRange.start;
    const rawEnd = theme.levelRange.end;
    const startLevel = clamp(rawStart, 1, safeMax);
    const endLevel = clamp(rawEnd, 1, safeMax);
    return {
      key,
      title: theme.name,
      subtitle: `Aşama ${idx + 1}`,
      gradient: theme.ui.rootBgClass,
      startLevel,
      endLevel,
      rangeText: `Bölüm 1-${endLevel - startLevel + 1}`,
    };
  });

  const topPadding = 120;
  const stepY = 90;
  const stepX = 70;

  return (
    <div className="w-full max-w-sm max-h-[85dvh] bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-2xl overflow-hidden">
      <div className="grid grid-cols-3 items-center">
        <div className="text-white/80 text-xs font-bold justify-self-start">
          Kullanıcı: <span className="text-white">{username ?? '-'}</span>
        </div>
        <button
          onClick={onBack}
          className="justify-self-center text-white/80 text-xs font-bold underline underline-offset-4"
        >
          Geri
        </button>
        {onLogout && (
          <button onClick={onLogout} className="justify-self-end text-white/70 text-xs font-bold underline underline-offset-4">
            Kullanıcıdan çıkış
          </button>
        )}
      </div>

      <div className="text-center space-y-2 mt-3">
        <div className="text-sm font-bold text-white/80 tracking-[0.2em]">AŞAMALAR</div>
        <h2 className="text-3xl font-black text-white">Seçim</h2>
        <p className="text-white/80 text-sm">Aşamayı seç, sonra bölümü oyna.</p>
      </div>

      <div className="mt-4 overflow-x-auto snap-x snap-mandatory flex gap-4 pb-2 -mx-2 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stages.map((stage) => {
          const levels = Array.from(
            { length: stage.endLevel - stage.startLevel + 1 },
            (_, i) => {
              const actualLevel = stage.startLevel + i;
              return { actualLevel, displayLevel: i + 1 };
            }
          );
          const totalHeight = topPadding + levels.length * stepY + 200;

          return (
            <div key={stage.key} className="snap-center shrink-0 w-[92%]">
              <div
                className={[
                  'relative w-full text-left text-white p-4 rounded-2xl shadow-2xl border border-white/20 overflow-hidden',
                  stage.gradient,
                ].join(' ')}
              >
                <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br from-fuchsia-400/40 to-cyan-300/30 blur-xl" />
                <div className="absolute -bottom-20 -left-16 w-44 h-44 rounded-full bg-gradient-to-br from-orange-300/20 to-pink-400/30 blur-2xl" />

                <div className="text-xs font-bold opacity-80">{stage.subtitle}</div>
                <div className="text-2xl font-black">{stage.title}</div>
                <div className="text-sm font-semibold opacity-90">{stage.rangeText}</div>

                <div className="mt-4 max-h-[58dvh] overflow-y-auto pr-1">
                  <div className="relative mx-auto w-full max-w-[260px] overflow-visible">
                    <div className="relative overflow-visible" style={{ height: totalHeight }}>
                      {levels.map(({ actualLevel, displayLevel }, idx) => {
                        const isCompleted = completedSet.has(actualLevel);
                        const isInProgress = actualLevel === currentLevel;
                        const isUnlocked = actualLevel <= unlockedUntil;

                        // Zig-zag aynı kalsın ama idx üzerinden (stage içinde 1..50)
                        const offsetX = (idx + 1) % 2 === 0 ? stepX : -stepX;

                        const bgColor = isInProgress
                          ? 'rgba(249, 115, 22, 0.22)'
                          : isCompleted
                          ? 'rgba(16, 185, 129, 0.22)'
                          : 'rgba(148, 163, 184, 0.22)';

                        const borderColor = isInProgress
                          ? 'rgba(251, 146, 60, 0.45)'
                          : isCompleted
                          ? 'rgba(52, 211, 153, 0.45)'
                          : 'rgba(148, 163, 184, 0.45)';

                        const textColor = isUnlocked ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)';

                        return (
                          <motion.div
                            key={actualLevel}
                            className="absolute z-10"
                            style={{
                              left: `calc(50% + ${offsetX}px)`,
                              top: `${topPadding + idx * stepY}px`,
                              transform: 'translate(-50%, -50%)',
                            }}
                            whileHover={{ zIndex: 50 }}
                          >
                            <motion.button
                              type="button"
                              disabled={!isUnlocked}
                              className={[
                                'w-12 h-12 rounded-full',
                                'flex items-center justify-center',
                                'text-[16px] font-black tabular-nums',
                                'tracking-[0.02em]',
                                'border backdrop-blur-sm',
                                'shadow-lg shadow-cyan-500/10',
                                'will-change-transform',
                                'disabled:opacity-100',
                                isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed',
                              ].join(' ')}
                              style={{
                                backgroundColor: bgColor,
                                borderColor,
                                color: textColor,
                                textShadow: '0 2px 10px rgba(0,0,0,0.35)',
                              }}
                              whileHover={isUnlocked ? { scale: 1.06 } : undefined}
                              whileTap={isUnlocked ? { scale: 0.95 } : undefined}
                              onClick={() => {
                                if (!isUnlocked) return;
                                onPickLevel(actualLevel);
                              }}
                            >
                              {displayLevel}
                            </motion.button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4" />
    </div>
  );
}
