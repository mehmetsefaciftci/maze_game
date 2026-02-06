export type ThemeKey = 'gezegen' | 'buz' | 'toprak' | 'kum' | 'volkan';

export interface StageTheme {
  id: ThemeKey;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    gridBg: string;
    wall: string;
    floor: string;
    player: string;
    exit: string;
  };
  effects: {
    particles: 'snow' | 'dust' | 'sparkles' | 'fire' | 'none';
    animation: 'ice-shine' | 'heat-wave' | 'wind' | 'none';
    sounds?: string;
  };
  assets: {
    background?: string;
    overlays?: string[];
    customCSS?: string;
  };
  levelRange: { start: number; end: number };
  ui: {
    rootBgClass: string;
    hazeClass: string;
    starsEnabled: boolean;
  };
}

export const THEME_KEYS: ThemeKey[] = ['gezegen', 'buz', 'toprak', 'kum', 'volkan'];

export const THEMES: Record<ThemeKey, StageTheme> = {
  gezegen: {
    id: 'gezegen',
    name: 'Gezegen',
    colors: {
      primary: '#7c3aed',
      secondary: '#ec4899',
      accent: '#06b6d4',
      background: 'linear-gradient(180deg, #1a0f3e 0%, #2d1b69 50%, #4a2d8f 100%)',
      gridBg: 'rgba(139, 92, 246, 0.1)',
      wall: 'linear-gradient(135deg, #4c1d95 0%, #6b21a8 100%)',
      floor: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
      player: 'radial-gradient(circle, #10b981 0%, #059669 100%)',
      exit: '#fbbf24',
    },
    effects: {
      particles: 'sparkles',
      animation: 'none',
    },
    assets: {},
    levelRange: { start: 1, end: 50 },
    ui: {
      rootBgClass: 'bg-gradient-to-b from-indigo-950 via-purple-950 to-indigo-900',
      hazeClass: 'from-fuchsia-400/10 via-cyan-300/5 to-transparent',
      starsEnabled: true,
    },
  },
  buz: {
    id: 'buz',
    name: 'Buz',
    colors: {
      primary: '#38bdf8',
      secondary: '#0ea5e9',
      accent: '#60a5fa',
      background: 'linear-gradient(180deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)',
      gridBg: 'rgba(56, 189, 248, 0.1)',
      wall: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
      floor: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
      player: 'radial-gradient(circle, #10b981 0%, #059669 100%)',
      exit: '#fbbf24',
    },
    effects: {
      particles: 'snow',
      animation: 'ice-shine',
    },
    assets: {
      customCSS: 'ice-stage.css',
    },
    levelRange: { start: 51, end: 100 },
    ui: {
      rootBgClass: 'bg-gradient-to-b from-slate-950 via-sky-950 to-indigo-950',
      hazeClass: 'from-cyan-200/12 via-sky-200/10 to-transparent',
      starsEnabled: false,
    },
  },
  toprak: {
    id: 'toprak',
    name: 'Toprak',
    colors: {
      primary: '#f59e0b',
      secondary: '#f97316',
      accent: '#fcd34d',
      background: 'linear-gradient(180deg, #2b1606 0%, #3b1f0b 50%, #4a2a12 100%)',
      gridBg: 'rgba(245, 158, 11, 0.08)',
      wall: 'linear-gradient(135deg, #8b5e34 0%, #a16207 100%)',
      floor: 'linear-gradient(135deg, #92400e 0%, #b45309 100%)',
      player: 'radial-gradient(circle, #10b981 0%, #059669 100%)',
      exit: '#fbbf24',
    },
    effects: {
      particles: 'dust',
      animation: 'wind',
    },
    assets: {},
    levelRange: { start: 101, end: 150 },
    ui: {
      rootBgClass: 'bg-gradient-to-b from-amber-950 via-orange-950 to-stone-900',
      hazeClass: 'from-amber-200/10 via-orange-300/10 to-transparent',
      starsEnabled: true,
    },
  },
  kum: {
    id: 'kum',
    name: 'Kum',
    colors: {
      primary: '#f59e0b',
      secondary: '#fbbf24',
      accent: '#fde68a',
      background: 'linear-gradient(180deg, #3b2f0a 0%, #6b4f12 50%, #8a6a1c 100%)',
      gridBg: 'rgba(251, 191, 36, 0.08)',
      wall: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      floor: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
      player: 'radial-gradient(circle, #10b981 0%, #059669 100%)',
      exit: '#fbbf24',
    },
    effects: {
      particles: 'dust',
      animation: 'wind',
    },
    assets: {},
    levelRange: { start: 151, end: 200 },
    ui: {
      rootBgClass: 'bg-gradient-to-b from-yellow-950 via-amber-950 to-stone-900',
      hazeClass: 'from-yellow-200/10 via-amber-200/10 to-transparent',
      starsEnabled: true,
    },
  },
  volkan: {
    id: 'volkan',
    name: 'Volkan',
    colors: {
      primary: '#ef4444',
      secondary: '#f97316',
      accent: '#fbbf24',
      background: 'linear-gradient(180deg, #1a0b0b 0%, #3b0b0b 50%, #5a0f0f 100%)',
      gridBg: 'rgba(239, 68, 68, 0.08)',
      wall: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)',
      floor: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
      player: 'radial-gradient(circle, #10b981 0%, #059669 100%)',
      exit: '#fbbf24',
    },
    effects: {
      particles: 'fire',
      animation: 'heat-wave',
    },
    assets: {},
    levelRange: { start: 201, end: 250 },
    ui: {
      rootBgClass: 'bg-gradient-to-b from-zinc-950 via-red-950 to-orange-950',
      hazeClass: 'from-red-300/10 via-orange-300/10 to-transparent',
      starsEnabled: true,
    },
  },
};

export function getThemeForLevel(level: number): ThemeKey {
  for (const key of THEME_KEYS) {
    const range = THEMES[key].levelRange;
    if (level >= range.start && level <= range.end) return key;
  }
  return 'gezegen';
}
