import type { ReactNode } from 'react';

type IceMazeProps = {
  level: number;
  movesLeft: number;
  onPause: () => void;
  children: ReactNode;
};

export function IceMaze({ level, movesLeft, onPause, children }: IceMazeProps) {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-gradient-to-b from-indigo-950 via-purple-950 to-indigo-900 flex flex-col items-center justify-center select-none font-sans">
      {/* KATMAN 1: YILDIZLI ARKA PLAN */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {[...Array(28)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white/80 rounded-full"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              opacity: 0.4 + (i % 6) * 0.1,
            }}
          />
        ))}
      </div>

      {/* KATMAN 3: ÜST HUD */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg">
        <div className="relative flex items-center justify-center h-24">
          <img src="/ice/ice-top-bar.png" className="absolute inset-0 w-full h-full object-contain" alt="hud" />
          <div className="relative z-10 flex gap-12 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest opacity-80">Seviye</p>
              <p className="text-2xl font-black">{level}</p>
            </div>
            <div className="text-center border-x border-white/20 px-8">
              <p className="text-[10px] uppercase tracking-widest opacity-80">Kalan Hamle</p>
              <p className="text-2xl font-black text-cyan-300">{movesLeft}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest opacity-80">Duraklat</p>
              <button className="text-xl hover:scale-110 transition-transform" type="button" onClick={onPause}>
                ⏸
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KATMAN 4: OYUN ALANI (MAZE) */}
      <div className="relative z-20 flex-1 w-full flex items-center justify-center pt-16 pb-10">
        <div className="relative z-10 origin-center scale-[0.68] sm:scale-[0.78] md:scale-[0.9]">
          {children}
        </div>
      </div>

      {/* KATMAN 5: ATMOSFERİK EFEKTLER */}
      <div className="absolute inset-0 pointer-events-none z-40 bg-gradient-to-t from-blue-900/20 to-transparent" />
    </div>
  );
}
