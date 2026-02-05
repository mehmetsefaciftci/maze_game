import { motion } from 'motion/react';
import { MAX_LEVEL } from '../game/types';

type StageKey = 'gezegen' | 'buz' | 'toprak' | 'kum' | 'volkan';

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

const STAGE_COUNT = 5;
const LEVELS_PER_STAGE = 50;

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
  // MAX_LEVEL beklenen: 250. Yine de güvenli olsun diye clamp.
  const safeMax = Math.max(MAX_LEVEL, STAGE_COUNT * LEVELS_PER_STAGE);

  const stages: Stage[] = ([
    {
      key: 'gezegen',
      title: 'Gezegen',
      subtitle: 'Aşama 1',
      gradient: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900',
      startLevel: 1,
      endLevel: 50,
    },
    {
      key: 'buz',
      title: 'Buz',
      subtitle: 'Aşama 2',
      gradient: 'bg-gradient-to-br from-sky-900 via-cyan-800 to-blue-900',
      startLevel: 51,
      endLevel: 100,
    },
    {
      key: 'toprak',
      title: 'Toprak',
      subtitle: 'Aşama 3',
      gradient: 'bg-gradient-to-br from-emerald-900 via-green-800 to-lime-900',
      startLevel: 101,
      endLevel: 150,
    },
    {
      key: 'kum',
      title: 'Kum',
      subtitle: 'Aşama 4',
      gradient: 'bg-gradient-to-br from-amber-900 via-orange-800 to-yellow-900',
      startLevel: 151,
      endLevel: 200,
    },
    {
      key: 'volkan',
      title: 'Volkan',
      subtitle: 'Aşama 5',
      gradient: 'bg-gradient-to-br from-red-900 via-rose-800 to-orange-900',
      startLevel: 201,
      endLevel: 250,
    },
  ] as Omit<Stage, 'rangeText'>[]).map((s) => ({
    ...s,
    // güvenli clamp (yanlışlıkla MAX_LEVEL düşük kalırsa bile aralık taşmasın)
    startLevel: clamp(s.startLevel, 1, safeMax),
    endLevel: clamp(s.endLevel, 1, safeMax),
    rangeText: `Bölüm 1-${s.endLevel - s.startLevel + 1}`,
  }));

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
                          : 'rgba(255, 255, 255, 0.22)';

                        const borderColor = isInProgress
                          ? 'rgba(251, 146, 60, 0.45)'
                          : isCompleted
                          ? 'rgba(52, 211, 153, 0.45)'
                          : 'rgba(255, 255, 255, 0.35)';

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
