import { motion } from 'motion/react';
import { MAX_LEVEL } from '../game/types';

type Stage = {
  key: string;
  title: string;
  subtitle: string;
  gradient: string;
  rangeText: string;
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

export function StageCarousel({
  username,
  completedSet,
  currentLevel,
  unlockedUntil,
  onPickLevel,
  onBack,
  onLogout,
}: StageCarouselProps) {
  const ranges =
    MAX_LEVEL === 250
      ? [
          'Bölüm 1-50',
          'Bölüm 51-100',
          'Bölüm 101-150',
          'Bölüm 151-200',
          'Bölüm 201-250',
        ]
      : ['Bölüm 1-50', 'Bölüm 1-50', 'Bölüm 1-50', 'Bölüm 1-50', 'Bölüm 1-50'];

  const stages: Stage[] = [
    {
      key: 'gezegen',
      title: 'Gezegen',
      subtitle: 'Aşama 1',
      gradient: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900',
      rangeText: ranges[0],
    },
    {
      key: 'buz',
      title: 'Buz',
      subtitle: 'Aşama 2',
      gradient: 'bg-gradient-to-br from-sky-900 via-cyan-800 to-blue-900',
      rangeText: ranges[1],
    },
    {
      key: 'toprak',
      title: 'Toprak',
      subtitle: 'Aşama 3',
      gradient: 'bg-gradient-to-br from-emerald-900 via-green-800 to-lime-900',
      rangeText: ranges[2],
    },
    {
      key: 'kum',
      title: 'Kum',
      subtitle: 'Aşama 4',
      gradient: 'bg-gradient-to-br from-amber-900 via-orange-800 to-yellow-900',
      rangeText: ranges[3],
    },
    {
      key: 'volkan',
      title: 'Volkan',
      subtitle: 'Aşama 5',
      gradient: 'bg-gradient-to-br from-red-900 via-rose-800 to-orange-900',
      rangeText: ranges[4],
    },
  ];

  const topPadding = 120;
  const stepY = 90;
  const stepX = 70;
  const totalHeight = topPadding + MAX_LEVEL * stepY + 200;

  return (
    <div className="w-full max-w-sm max-h-[85dvh] bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="text-white/80 text-xs font-bold">
          Kullanıcı: <span className="text-white">{username ?? '-'}</span>
        </div>
        {onLogout && (
          <button onClick={onLogout} className="text-white/70 text-xs font-bold underline underline-offset-4">
            Çıkış
          </button>
        )}
      </div>

      <div className="text-center space-y-2 mt-3">
        <div className="text-sm font-bold text-white/80 tracking-[0.2em]">AŞAMALAR</div>
        <h2 className="text-3xl font-black text-white">Seçim</h2>
        <p className="text-white/80 text-sm">Aşamayı seç, sonra bölümü oyna.</p>
      </div>

      <div className="mt-4 overflow-x-auto snap-x snap-mandatory flex gap-4 pb-2 -mx-2 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {stages.map((stage) => (
          <div key={stage.key} className="snap-center shrink-0 w-[92%]">
            <div className={`relative w-full text-left text-white p-4 rounded-2xl shadow-2xl border border-white/20 overflow-hidden ${stage.gradient}`}>
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br from-fuchsia-400/40 to-cyan-300/30 blur-xl" />
              <div className="absolute -bottom-20 -left-16 w-44 h-44 rounded-full bg-gradient-to-br from-orange-300/20 to-pink-400/30 blur-2xl" />

              <div className="text-xs font-bold opacity-80">{stage.subtitle}</div>
              <div className="text-2xl font-black">{stage.title}</div>
              <div className="text-sm font-semibold opacity-90">{stage.rangeText}</div>

              <div className="mt-4 max-h-[58dvh] overflow-y-auto pr-1">
                <div className="relative mx-auto w-full max-w-[260px] overflow-visible">
                  <div className="relative overflow-visible" style={{ height: totalHeight }}>
                    {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((level) => {
                      const isCompleted = completedSet.has(level);
                      const isInProgress = level === currentLevel;
                      const isUnlocked = level <= unlockedUntil;
                      const offsetX = level % 2 === 0 ? stepX : -stepX;

                      const bgColor = isCompleted
                        ? 'rgba(16, 185, 129, 0.22)'
                        : isInProgress
                        ? 'rgba(249, 115, 22, 0.22)'
                        : 'rgba(255, 255, 255, 0.22)';

                      const borderColor = isCompleted
                        ? 'rgba(52, 211, 153, 0.45)'
                        : isInProgress
                        ? 'rgba(251, 146, 60, 0.45)'
                        : 'rgba(255, 255, 255, 0.35)';

                      const textColor = isUnlocked ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)';

                      return (
                        <motion.div
                          key={level}
                          className="absolute z-10"
                          style={{
                            left: `calc(50% + ${offsetX}px)`,
                            top: `${topPadding + (level - 1) * stepY}px`,
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
                              onPickLevel(level);
                            }}
                          >
                            {level}
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onBack} className="mt-4 w-full text-white/80 text-sm font-bold">
        Geri
      </button>
    </div>
  );
}
