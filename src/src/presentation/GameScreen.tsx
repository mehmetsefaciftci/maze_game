/**
 * Game Screen Component
 * Main presentation layer that integrates all UI components
 *
 * Added:
 * - Simple Auth (Register/Login)
 * - User-based progress: completedLevels + currentLevel
 * - Stage circles: completed=green, inProgress=orange, default=grey
 *
 * UI tweaks (requested):
 * - Removed tick/dot badges
 * - Numbers are bolder / more prominent (ALL levels, even locked)
 * - Circles are more transparent (ALL levels, same transparency family)
 * - Locked levels are NOT “faded”; only less bright text + not clickable
 */

import { useReducer, useEffect, useRef, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TouchEvent } from 'react';
import { motion } from 'motion/react';
import { gameReducer, createLevel } from '../game/reducer';
import { findSoftRegenSeed } from '../game/generator';
import { getGridForRender, canUndo } from '../game/selectors';
import { type Direction, MAX_LEVEL, type GameStatus } from '../game/types';
import { THEMES, THEME_KEYS, getThemeForLevel, type ThemeKey } from '../themes';
import { useTheme } from '../themes/ThemeProvider';
import { MazeGrid } from './MazeGrid';
import { BuzStage } from './BuzStage';
import { ToprakStage } from './ToprakStage';
import { EnergyBar } from './hud/EnergyBar';
import { InGameHud } from './hud/InGameHud';
import { ResultDialog } from './overlays/ResultDialog';

type ScreenState = 'auth' | 'menu' | 'world' | 'stages' | 'game';
type StageKey = ThemeKey;
type UserProgress = {
  completedLevels: number[];
  currentLevel: number;
  energy: number;
  energyUpdatedAt: number;
  levelSeeds: Record<number, number>;
  failStreakByLevel: Record<number, number>;
};

type QuestProgress = {
  levelWins: number;
  doorsOpened: number;
  buzSpeedWins: number;
};

type QuestState = {
  key: string;
  progress: QuestProgress;
  claimed: {
    dailyLevels: boolean;
    dailyDoors: boolean;
    dailyBuz: boolean;
    weeklyLevels: boolean;
  };
};

type MetaProgress = {
  starsByLevel: Record<number, number>;
  shard: number;
  skinToken: number;
  daily: QuestState;
  weekly: QuestState;
};

type AuthUser = {
  username: string;
};

const AUTH_USER_KEY = 'maze_auth_user';
const PROGRESS_PREFIX = 'maze_progress_user_';
const META_PREFIX = 'maze_meta_user_';
const MAIN_MENU_THEME_KEY: ThemeKey = 'gezegen';
const ENERGY_MAX = 10;
const ENERGY_REFILL_MS = 5 * 60 * 1000;
const SOFT_REGEN_FAIL_THRESHOLD = 2;

const DAILY_TARGETS = {
  levels: 10,
  doors: 3,
  buzWins: 5,
};

const WEEKLY_TARGETS = {
  levels: 30,
};

function getEnergyCostForLevel(level: number): number {
  const stage = getThemeForLevel(level);
  return stage === 'kum' || stage === 'volkan' ? 2 : 1;
}

const STAGES: { key: StageKey; label: string; startLevel: number; endLevel: number }[] = [
  ...THEME_KEYS.map((key) => ({
    key,
    label: THEMES[key].name,
    startLevel: THEMES[key].levelRange.start,
    endLevel: THEMES[key].levelRange.end,
  })),
];

function loadCurrentUser(): AuthUser | null {
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthUser;
    if (parsed?.username) return parsed;
  } catch {}
  return null;
}

function saveCurrentUser(user: AuthUser | null) {
  if (!user) {
    window.localStorage.removeItem(AUTH_USER_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function defaultProgress(): UserProgress {
  return {
    completedLevels: [],
    currentLevel: 1,
    energy: ENERGY_MAX,
    energyUpdatedAt: Date.now(),
    levelSeeds: {},
    failStreakByLevel: {},
  };
}

function loadUserProgress(username: string): UserProgress {
  const raw = window.localStorage.getItem(PROGRESS_PREFIX + username);
  if (!raw) return defaultProgress();
  try {
    const parsed = JSON.parse(raw) as Partial<UserProgress>;

    const completedLevels = Array.isArray(parsed.completedLevels)
      ? parsed.completedLevels
          .filter((n) => Number.isFinite(n))
          .map((n) => Math.max(1, Math.min(MAX_LEVEL, n)))
      : [];

    const currentLevel = Number.isFinite(parsed.currentLevel)
      ? Math.max(1, Math.min(MAX_LEVEL, parsed.currentLevel))
      : 1;
    const energy = Number.isFinite(parsed.energy)
      ? Math.max(0, Math.min(ENERGY_MAX, Math.floor(parsed.energy as number)))
      : ENERGY_MAX;
    const energyUpdatedAt = Number.isFinite(parsed.energyUpdatedAt)
      ? Number(parsed.energyUpdatedAt)
      : Date.now();
    const levelSeeds: Record<number, number> = {};
    if (parsed.levelSeeds && typeof parsed.levelSeeds === 'object') {
      for (const [k, v] of Object.entries(parsed.levelSeeds)) {
        const levelKey = Number(k);
        if (Number.isFinite(levelKey) && Number.isFinite(v)) {
          levelSeeds[levelKey] = Number(v);
        }
      }
    }
    const failStreakByLevel: Record<number, number> = {};
    if (parsed.failStreakByLevel && typeof parsed.failStreakByLevel === 'object') {
      for (const [k, v] of Object.entries(parsed.failStreakByLevel)) {
        const levelKey = Number(k);
        if (Number.isFinite(levelKey) && Number.isFinite(v)) {
          failStreakByLevel[levelKey] = Math.max(0, Math.floor(Number(v)));
        }
      }
    }

    const uniq = Array.from(new Set(completedLevels)).sort((a, b) => a - b);
    return withRegeneratedEnergy(
      { completedLevels: uniq, currentLevel, energy, energyUpdatedAt, levelSeeds, failStreakByLevel },
      Date.now()
    );
  } catch {
    return defaultProgress();
  }
}

function saveUserProgress(username: string, progress: UserProgress) {
  window.localStorage.setItem(PROGRESS_PREFIX + username, JSON.stringify(progress));
}

function getHighestCompleted(completedLevels: number[]) {
  return completedLevels.length ? Math.max(...completedLevels) : 0;
}

function withRegeneratedEnergy(progress: UserProgress, now: number): UserProgress {
  const safeNow = Number.isFinite(now) ? now : Date.now();
  const safeEnergy = Math.max(0, Math.min(ENERGY_MAX, Math.floor(progress.energy)));
  const safeUpdatedAt = Number.isFinite(progress.energyUpdatedAt) ? progress.energyUpdatedAt : safeNow;

  if (safeEnergy >= ENERGY_MAX) {
    return { ...progress, energy: ENERGY_MAX, energyUpdatedAt: safeUpdatedAt };
  }
  if (safeNow <= safeUpdatedAt) {
    return { ...progress, energy: safeEnergy, energyUpdatedAt: safeUpdatedAt };
  }

  const gained = Math.floor((safeNow - safeUpdatedAt) / ENERGY_REFILL_MS);
  if (gained <= 0) {
    return { ...progress, energy: safeEnergy, energyUpdatedAt: safeUpdatedAt };
  }

  const nextEnergy = Math.min(ENERGY_MAX, safeEnergy + gained);
  const nextUpdatedAt = nextEnergy === ENERGY_MAX ? safeNow : safeUpdatedAt + gained * ENERGY_REFILL_MS;
  return { ...progress, energy: nextEnergy, energyUpdatedAt: nextUpdatedAt };
}

function getEnergyMsUntilNext(progress: UserProgress, now: number): number {
  if (progress.energy >= ENERGY_MAX) return 0;
  const safeNow = Number.isFinite(now) ? now : Date.now();
  const safeUpdatedAt = Number.isFinite(progress.energyUpdatedAt) ? progress.energyUpdatedAt : safeNow;
  const elapsed = Math.max(0, safeNow - safeUpdatedAt);
  const remain = ENERGY_REFILL_MS - (elapsed % ENERGY_REFILL_MS);
  return remain === 0 ? ENERGY_REFILL_MS : remain;
}

function formatEnergyCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getDayKey(ts: number) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekKey(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return getDayKey(d.getTime());
}

function emptyQuestState(key: string): QuestState {
  return {
    key,
    progress: { levelWins: 0, doorsOpened: 0, buzSpeedWins: 0 },
    claimed: { dailyLevels: false, dailyDoors: false, dailyBuz: false, weeklyLevels: false },
  };
}

function defaultMeta(now: number): MetaProgress {
  return {
    starsByLevel: {},
    shard: 0,
    skinToken: 0,
    daily: emptyQuestState(getDayKey(now)),
    weekly: emptyQuestState(getWeekKey(now)),
  };
}

function loadUserMeta(username: string): MetaProgress {
  const now = Date.now();
  const raw = window.localStorage.getItem(META_PREFIX + username);
  if (!raw) return defaultMeta(now);
  try {
    const parsed = JSON.parse(raw) as Partial<MetaProgress>;
    const base = defaultMeta(now);
    const daily = parsed.daily?.key === base.daily.key ? parsed.daily : base.daily;
    const weekly = parsed.weekly?.key === base.weekly.key ? parsed.weekly : base.weekly;
    return {
      starsByLevel: parsed.starsByLevel ?? {},
      shard: Number.isFinite(parsed.shard) ? Math.max(0, Math.floor(parsed.shard as number)) : 0,
      skinToken: Number.isFinite(parsed.skinToken) ? Math.max(0, Math.floor(parsed.skinToken as number)) : 0,
      daily,
      weekly,
    };
  } catch {
    return defaultMeta(now);
  }
}

function saveUserMeta(username: string, meta: MetaProgress) {
  window.localStorage.setItem(META_PREFIX + username, JSON.stringify(meta));
}

function getStageCostText(stage: StageKey) {
  return stage === 'kum' || stage === 'volkan' ? '2 Enerji' : '1 Enerji';
}

export function GameScreen() {
  const { setTheme, themeKey } = useTheme();
  const [state, dispatch] = useReducer(gameReducer, null, () => createLevel(1));
  const [screen, setScreen] = useState<ScreenState>('auth');
  const [stagePopupOpen, setStagePopupOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<StageKey>('gezegen');
  const [paused, setPaused] = useState(false);
  const [kumIntroOpen, setKumIntroOpen] = useState(false);
  const [volkanIntroOpen, setVolkanIntroOpen] = useState(false);
  const [buzIntroOpen, setBuzIntroOpen] = useState(false);
  const [buzIntroDismissed, setBuzIntroDismissed] = useState(false);
  const [gezegenIntroOpen, setGezegenIntroOpen] = useState(false);
  const [resultStatus, setResultStatus] = useState<GameStatus>('playing');
  const [inputLocked, setInputLocked] = useState(false);
  const inputLockTimer = useRef<number | null>(null);
  const mazeSlotRef = useRef<HTMLDivElement | null>(null);
  const [mazeScale, setMazeScale] = useState(1);
  const prevKumLevelRef = useRef<number | null>(null);
  const prevKumHistoryLenRef = useRef<number>(0);
  const prevVolkanLevelRef = useRef<number | null>(null);
  const prevVolkanHistoryLenRef = useRef<number>(0);
  const prevBuzLevelRef = useRef<number | null>(null);
  const prevBuzHistoryLenRef = useRef<number>(0);
  const prevGezegenLevelRef = useRef<number | null>(null);
  const prevGezegenHistoryLenRef = useRef<number>(0);
  const processedLossRef = useRef<string>('');

  const [user, setUser] = useState<AuthUser | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [energyNotice, setEnergyNotice] = useState<string | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());

  const [progressData, setProgressData] = useState<UserProgress>(defaultProgress());
  const [metaData, setMetaData] = useState<MetaProgress>(() => defaultMeta(Date.now()));
  const [resultStars, setResultStars] = useState(0);
  const [resultShardGain, setResultShardGain] = useState(0);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const grid = useMemo(() => getGridForRender(state), [state]);
  const canUndoMove = useMemo(() => canUndo(state), [state]);
  const isGameActive = screen === 'game' && state.status === 'playing' && !paused && !inputLocked;
  const isFinalLevel = state.level >= MAX_LEVEL;
  const currentStage = useMemo(() => getThemeForLevel(state.level), [state.level]);
  const isIceStage = currentStage === 'buz';
  const isToprakStage = currentStage === 'toprak';
  const activeThemeKey = screen === 'game' ? currentStage : MAIN_MENU_THEME_KEY;
  const canUseDom = typeof document !== 'undefined';
  const mazeSize = useMemo(() => {
    const gridWidth = grid[0]?.length ?? 0;
    const gridHeight = grid.length;
    if (!gridWidth || !gridHeight) return null;

    const cellPx = 24;
    const gapPx = 2;
    const paddingPx = 12;
    const totalWidth = paddingPx * 2 + gridWidth * cellPx + (gridWidth - 1) * gapPx;
    const totalHeight = paddingPx * 2 + gridHeight * cellPx + (gridHeight - 1) * gapPx;
    const level8GridSize = 13;
    const baseWidth = paddingPx * 2 + level8GridSize * cellPx + (level8GridSize - 1) * gapPx;
    const baseHeight = paddingPx * 2 + level8GridSize * cellPx + (level8GridSize - 1) * gapPx;
    const useBaseClamp = !(currentStage === 'gezegen' && state.level <= 7);
    const clampToBase = currentStage === 'gezegen' && state.level >= 18 && state.level <= 20;
    return {
      totalWidth,
      totalHeight,
      baseWidth: useBaseClamp ? baseWidth : totalWidth,
      baseHeight: useBaseClamp ? baseHeight : totalHeight,
      clampToBase,
    };
  }, [grid, currentStage, state.level]);

  useEffect(() => {
    if (!mazeSlotRef.current || !mazeSize) return;

    const updateScale = () => {
      if (!mazeSlotRef.current) return;
      const rect = mazeSlotRef.current.getBoundingClientRect();
      const targetWidth = mazeSize.clampToBase
        ? mazeSize.baseWidth
        : Math.max(mazeSize.totalWidth, mazeSize.baseWidth);
      const targetHeight = mazeSize.clampToBase
        ? mazeSize.baseHeight
        : Math.max(mazeSize.totalHeight, mazeSize.baseHeight);
      const nextScale = Math.min(rect.width / targetWidth, rect.height / targetHeight);
      setMazeScale(Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 1);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(mazeSlotRef.current);

    return () => observer.disconnect();
  }, [mazeSize]);

  useEffect(() => {
    if (themeKey !== activeThemeKey) setTheme(activeThemeKey);
  }, [activeThemeKey, setTheme, themeKey]);

  // Kum stage intro (only on first enter or restart; not on auto-advance)
  useEffect(() => {
    if (screen !== 'game') {
      setKumIntroOpen(false);
      return;
    }
    const isFreshStart =
      state.status === 'playing' && state.history.length === 0 && state.movesLeft === state.maxMoves;
    if (currentStage !== 'kum' || !isFreshStart) {
      setKumIntroOpen(false);
      return;
    }
    const prevLevel = prevKumLevelRef.current;
    const prevHistoryLen = prevKumHistoryLenRef.current;
    const isFirstEnter = prevLevel !== state.level;
    const isRestart = prevLevel === state.level && prevHistoryLen > 0;
    if (isFirstEnter || isRestart) {
      setKumIntroOpen(true);
      return;
    }
    setKumIntroOpen(false);
  }, [screen, currentStage, state.status, state.history.length, state.movesLeft, state.maxMoves, state.level]);

  useEffect(() => {
    prevKumLevelRef.current = state.level;
    prevKumHistoryLenRef.current = state.history.length;
  }, [state.level, state.history.length]);

  // Volkan stage intro (only on first enter or restart; not on auto-advance)
  useEffect(() => {
    if (screen !== 'game') {
      setVolkanIntroOpen(false);
      return;
    }
    const isFreshStart =
      state.status === 'playing' && state.history.length === 0 && state.movesLeft === state.maxMoves;
    if (currentStage !== 'volkan' || !isFreshStart) {
      setVolkanIntroOpen(false);
      return;
    }
    const prevLevel = prevVolkanLevelRef.current;
    const prevHistoryLen = prevVolkanHistoryLenRef.current;
    const isFirstEnter = prevLevel !== state.level;
    const isRestart = prevLevel === state.level && prevHistoryLen > 0;
    if (isFirstEnter || isRestart) {
      setVolkanIntroOpen(true);
      return;
    }
    setVolkanIntroOpen(false);
  }, [screen, currentStage, state.status, state.history.length, state.movesLeft, state.maxMoves, state.level]);

  useEffect(() => {
    prevVolkanLevelRef.current = state.level;
    prevVolkanHistoryLenRef.current = state.history.length;
  }, [state.level, state.history.length]);

  // Buz stage intro (only on first enter or restart; not on auto-advance)
  useEffect(() => {
    if (screen !== 'game') {
      setBuzIntroOpen(false);
      setBuzIntroDismissed(false);
      return;
    }
    const isFreshStart =
      state.status === 'playing' && state.history.length === 0 && state.movesLeft === state.maxMoves;
    if (currentStage !== 'buz' || !isFreshStart) {
      setBuzIntroOpen(false);
      return;
    }
    const prevLevel = prevBuzLevelRef.current;
    const prevHistoryLen = prevBuzHistoryLenRef.current;
    const isFirstEnter = prevLevel !== state.level;
    const isRestart = prevLevel === state.level && prevHistoryLen > 0;
    if (isFirstEnter || isRestart) {
      setBuzIntroOpen(true);
      setBuzIntroDismissed(false);
      return;
    }
    setBuzIntroOpen(false);
  }, [screen, currentStage, state.status, state.history.length, state.movesLeft, state.maxMoves, state.level]);

  useEffect(() => {
    prevBuzLevelRef.current = state.level;
    prevBuzHistoryLenRef.current = state.history.length;
  }, [state.level, state.history.length]);

  // Gezegen stage intro (only on first enter or restart; not on auto-advance)
  useEffect(() => {
    if (screen !== 'game') {
      setGezegenIntroOpen(false);
      return;
    }
    const isFreshStart =
      state.status === 'playing' && state.history.length === 0 && state.movesLeft === state.maxMoves;
    if (currentStage !== 'gezegen' || !isFreshStart) {
      setGezegenIntroOpen(false);
      return;
    }
    const prevLevel = prevGezegenLevelRef.current;
    const prevHistoryLen = prevGezegenHistoryLenRef.current;
    const isFirstEnter = prevLevel !== state.level;
    const isRestart = prevLevel === state.level && prevHistoryLen > 0;
    if (isFirstEnter || isRestart) {
      setGezegenIntroOpen(true);
      return;
    }
    setGezegenIntroOpen(false);
  }, [screen, currentStage, state.status, state.history.length, state.movesLeft, state.maxMoves, state.level]);

  useEffect(() => {
    prevGezegenLevelRef.current = state.level;
    prevGezegenHistoryLenRef.current = state.history.length;
  }, [state.level, state.history.length]);

  // Boot: load logged user (if exists)
  useEffect(() => {
    const existing = loadCurrentUser();
    if (existing) {
      setUser(existing);
      const loaded = loadUserProgress(existing.username);
      const loadedMeta = loadUserMeta(existing.username);
      setProgressData(loaded);
      setMetaData(loadedMeta);
      dispatch({
        type: 'LOAD_LEVEL',
        level: loaded.currentLevel,
        seed: loaded.levelSeeds[loaded.currentLevel],
      });
      setScreen('menu');
    } else {
      setMetaData(defaultMeta(Date.now()));
      setScreen('auth');
    }
  }, []);

  // Keep currentLevel synced
  useEffect(() => {
    if (!user) return;
    setProgressData((prev) => {
      const next = { ...prev, currentLevel: state.level };
      saveUserProgress(user.username, next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.level, user?.username]);

  // On win: mark completed + bump currentLevel
  useEffect(() => {
    if (!user) return;
    if (state.status !== 'won') return;

    const starsEarned = computeStarsForCurrentRun();
    setResultStars(starsEarned);

    setProgressData((prev) => {
      const completed = new Set(prev.completedLevels);
      completed.add(state.level);

      const nextCurrent = Math.min(MAX_LEVEL, state.level + 1);
      const next: UserProgress = {
        ...prev,
        completedLevels: Array.from(completed).sort((a, b) => a - b),
        currentLevel: nextCurrent,
        failStreakByLevel: { ...prev.failStreakByLevel, [state.level]: 0 },
      };

      saveUserProgress(user.username, next);
      return next;
    });

    setMetaData((prev) => {
      const prevStars = prev.starsByLevel[state.level] ?? 0;
      const nextBest = Math.max(prevStars, starsEarned);
      const bonusStars = Math.max(0, nextBest - prevStars);
      const collectedColorSet = new Set<string>();
      for (const coin of state.coins) {
        const coinKey = `${coin.position.x},${coin.position.y}`;
        if (state.collectedCoins.has(coinKey)) collectedColorSet.add(coin.color);
      }
      const doorUnlockCount = state.doors.filter((door) => collectedColorSet.has(door.color)).length;
      const buzFastWin = currentStage === 'buz' && (state.timeLeft ?? 0) > 0 ? 1 : 0;

      const next: MetaProgress = {
        ...prev,
        starsByLevel: { ...prev.starsByLevel, [state.level]: nextBest },
        shard: prev.shard + bonusStars * 3,
        daily: {
          ...prev.daily,
          progress: {
            levelWins: prev.daily.progress.levelWins + 1,
            doorsOpened: prev.daily.progress.doorsOpened + doorUnlockCount,
            buzSpeedWins: prev.daily.progress.buzSpeedWins + buzFastWin,
          },
        },
        weekly: {
          ...prev.weekly,
          progress: {
            ...prev.weekly.progress,
            levelWins: prev.weekly.progress.levelWins + 1,
          },
        },
      };
      if (bonusStars > 0) {
        setResultShardGain(bonusStars * 3);
      } else {
        setResultShardGain(0);
      }
      saveUserMeta(user.username, next);
      return next;
    });

  }, [state.status, state.level, user, state.doors, state.coins, state.collectedCoins, currentStage, state.timeLeft]);

  useEffect(() => {
    if (!user) return;
    if (state.status !== 'lost') return;

    const lossKey = `${state.level}-${state.seed}-${state.history.length}-${state.movesLeft}-${state.timeLeft}`;
    if (processedLossRef.current === lossKey) return;
    processedLossRef.current = lossKey;

    setProgressData((prev) => {
      const currentStreak = prev.failStreakByLevel[state.level] ?? 0;
      const nextStreak = currentStreak + 1;
      let next: UserProgress = {
        ...prev,
        failStreakByLevel: { ...prev.failStreakByLevel, [state.level]: nextStreak },
      };

      if (nextStreak >= SOFT_REGEN_FAIL_THRESHOLD) {
        const currentSeed = next.levelSeeds[state.level] ?? state.seed;
        const softSeed = findSoftRegenSeed(state.level, currentSeed, state.difficulty);
        if (softSeed !== currentSeed) {
          next = {
            ...next,
            failStreakByLevel: { ...next.failStreakByLevel, [state.level]: 0 },
            levelSeeds: { ...next.levelSeeds, [state.level]: softSeed },
          };
          setEnergyNotice('Seviye dengelemesi aktif: yakın zorlukta yeni seed yüklendi.');
          dispatch({ type: 'LOAD_LEVEL', level: state.level, seed: softSeed });
        }
      }

      saveUserProgress(user.username, next);
      return next;
    });
  }, [user, state.status, state.level, state.seed, state.history.length, state.movesLeft, state.timeLeft, state.difficulty]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGameActive) return;

      let direction: Direction | null = null;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = 'up';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = 'down';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = 'left';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = 'right';
          break;
        case 'z':
        case 'Z':
          if (canUndoMove) dispatch({ type: 'UNDO' });
          return;
        case 'r':
        case 'R':
          dispatch({ type: 'RESTART' });
          return;
      }

        if (direction) {
          e.preventDefault();
          if (currentStage === 'buz' && !state.iceTimerStarted && buzIntroDismissed) {
            dispatch({ type: 'START_ICE_TIMER' });
          }
          dispatch({ type: 'MOVE', direction });
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameActive, canUndoMove]);

  // Ice stage timer
  useEffect(() => {
    if (screen !== 'game') return;
    if (currentStage !== 'buz') return;
    if (state.status !== 'playing') return;
    if (paused) return;

    const id = window.setInterval(() => {
      dispatch({ type: 'TICK', seconds: 1 });
    }, 1000);

    return () => window.clearInterval(id);
  }, [screen, currentStage, state.status, paused]);

  // Sand storm reveal timer
  useEffect(() => {
    if (screen !== 'game') return;
    if (currentStage !== 'kum') return;
    if (state.status !== 'playing') return;
    if (paused) return;
    if (state.sandRevealSeconds <= 0) return;
    if (state.sandRevealSeconds >= 999) return;

    const id = window.setInterval(() => {
      dispatch({ type: 'SAND_REVEAL_TICK', seconds: 0.1 });
    }, 100);

    return () => window.clearInterval(id);
  }, [screen, currentStage, state.status, paused, state.sandRevealSeconds]);

  // Touch/swipe controls
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || !isGameActive) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const minSwipeDistance = 30;

    let direction: Direction | null = null;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) direction = deltaX > 0 ? 'right' : 'left';
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) direction = deltaY > 0 ? 'down' : 'up';
    }

    if (direction) {
      if (currentStage === 'buz' && !state.iceTimerStarted && buzIntroDismissed) {
        dispatch({ type: 'START_ICE_TIMER' });
      }
      dispatch({ type: 'MOVE', direction });
    }
    touchStartRef.current = null;
  };

  const handleRestart = () => dispatch({ type: 'RESTART' });
  const handleRestartLevel = () => {
    setPaused(false);
    dispatch({ type: 'RESTART' });
  };
  const handleNextLevel = () => {
    if (isFinalLevel) return;
    const nextLevel = Math.min(MAX_LEVEL, state.level + 1);
    dispatch({ type: 'LOAD_LEVEL', level: nextLevel, seed: progressData.levelSeeds[nextLevel] });
  };

  const computeStarsForCurrentRun = () => {
    if (state.status !== 'won') return 0;
    let stars = 1;
    if (state.movesLeft >= Math.ceil(state.maxMoves * 0.25)) stars += 1;
    if (state.maxTime !== null) {
      if ((state.timeLeft ?? 0) >= Math.ceil(state.maxTime * 0.3)) stars += 1;
    } else if (state.movesLeft >= Math.ceil(state.maxMoves * 0.55)) {
      stars += 1;
    }
    return Math.min(3, stars);
  };

  const claimQuestReward = (kind: 'dailyLevels' | 'dailyDoors' | 'dailyBuz' | 'weeklyLevels') => {
    if (!user) return;
    setMetaData((prev) => {
      const next: MetaProgress = {
        ...prev,
        daily: { ...prev.daily, claimed: { ...prev.daily.claimed } },
        weekly: { ...prev.weekly, claimed: { ...prev.weekly.claimed } },
      };

      if (kind === 'dailyLevels' && canClaimDailyLevels) {
        next.daily.claimed.dailyLevels = true;
        next.shard += 10;
      } else if (kind === 'dailyDoors' && canClaimDailyDoors) {
        next.daily.claimed.dailyDoors = true;
        next.shard += 8;
      } else if (kind === 'dailyBuz' && canClaimDailyBuz) {
        next.daily.claimed.dailyBuz = true;
        next.shard += 12;
        next.skinToken += 1;
      } else if (kind === 'weeklyLevels' && canClaimWeeklyLevels) {
        next.weekly.claimed.weeklyLevels = true;
        next.shard += 30;
        next.skinToken += 2;
      } else {
        return prev;
      }

      saveUserMeta(user.username, next);
      return next;
    });
  };

  const handlePauseToggle = () => setPaused((prev) => !prev);
  const handleResume = () => setPaused(false);
  const handlePauseMenu = () => {
    setPaused(false);
    handleMenuReturn();
  };

  const movesUsed = state.maxMoves - state.movesLeft;

  const handleShowStages = () => setScreen('world');
  const handleBackToMenu = () => {
    setPaused(false);
    setScreen('menu');
  };
  const handleMenuReturn = () => {
    setPaused(false);
    setScreen('menu');
  };
  const handleSelectStage = (stage: StageKey) => {
    setSelectedStage(stage);
    setStagePopupOpen(false);
    setScreen('stages');
  };

  const handleStartLevel = (level: number) => {
    if (!user) return;
    setEnergyNotice(null);
    const now = Date.now();
    const regenerated = withRegeneratedEnergy(progressData, now);
    const cost = getEnergyCostForLevel(level);
    if (regenerated.energy < cost) {
      setProgressData(regenerated);
      saveUserProgress(user.username, regenerated);
      setEnergyNotice(`Yetersiz enerji. ${cost} enerji gerekiyor. ${energyTimerText}`);
      return;
    }

    const wasFull = regenerated.energy >= ENERGY_MAX;
    const levelSeed = regenerated.levelSeeds[level];
    const spent: UserProgress = {
      ...regenerated,
      energy: regenerated.energy - cost,
      energyUpdatedAt: wasFull ? now : regenerated.energyUpdatedAt,
    };
    const next = { ...spent, currentLevel: level };

    setPaused(false);
    dispatch({ type: 'LOAD_LEVEL', level, seed: levelSeed });
    setProgressData(next);
    saveUserProgress(user.username, next);

    setScreen('game');
  };

  // Auth actions
  const doLoginOrRegister = () => {
    const username = usernameInput.trim();
    if (!username) return;
    setEnergyNotice(null);

    const nextUser: AuthUser = { username };
    setUser(nextUser);
    saveCurrentUser(nextUser);

    const loaded = loadUserProgress(username);
    const loadedMeta = loadUserMeta(username);
    setProgressData(loaded);
    setMetaData(loadedMeta);

    dispatch({
      type: 'LOAD_LEVEL',
      level: loaded.currentLevel,
      seed: loaded.levelSeeds[loaded.currentLevel],
    });
    setScreen('menu');
  };

  const doLogout = () => {
    setUser(null);
    saveCurrentUser(null);
    setProgressData(defaultProgress());
    setMetaData(defaultMeta(Date.now()));
    dispatch({ type: 'LOAD_LEVEL', level: 1 });
    setUsernameInput('');
    setEnergyNotice(null);
    setPaused(false);
    setScreen('auth');
  };

  const completedSet = useMemo(() => new Set(progressData.completedLevels), [progressData.completedLevels]);
  const highestCompletedLevel = getHighestCompleted(progressData.completedLevels);
  const unlockedUntil = Math.max(highestCompletedLevel + 2, progressData.currentLevel);
  const selectedStageInfo = useMemo(
    () => STAGES.find((s) => s.key === selectedStage) ?? STAGES[0],
    [selectedStage]
  );
  const selectedStageRangeText = `Bölüm 1-${selectedStageInfo.endLevel - selectedStageInfo.startLevel + 1}`;
  const theme = THEMES[activeThemeKey];
  const assetBase = import.meta.env.BASE_URL ?? '/';
  const liveProgress = useMemo(() => withRegeneratedEnergy(progressData, clockNow), [progressData, clockNow]);
  const energyMsUntilNext = useMemo(() => getEnergyMsUntilNext(liveProgress, clockNow), [liveProgress, clockNow]);
  const energyTimerText =
    liveProgress.energy >= ENERGY_MAX ? 'Enerji dolu' : `+1 enerji: ${formatEnergyCountdown(energyMsUntilNext)}`;
  const energyTimerCompact = liveProgress.energy >= ENERGY_MAX ? 'FULL' : formatEnergyCountdown(energyMsUntilNext);
  const stageStats = useMemo(
    () =>
      STAGES.map((stage) => {
        const total = stage.endLevel - stage.startLevel + 1;
        let completed = 0;
        let stars = 0;
        for (let lv = stage.startLevel; lv <= stage.endLevel; lv++) {
          if (completedSet.has(lv)) completed += 1;
          stars += metaData.starsByLevel[lv] ?? 0;
        }
        return { ...stage, total, completed, stars };
      }),
    [completedSet, metaData.starsByLevel]
  );
  const daily = metaData.daily;
  const weekly = metaData.weekly;
  const canClaimDailyLevels = daily.progress.levelWins >= DAILY_TARGETS.levels && !daily.claimed.dailyLevels;
  const canClaimDailyDoors = daily.progress.doorsOpened >= DAILY_TARGETS.doors && !daily.claimed.dailyDoors;
  const canClaimDailyBuz = daily.progress.buzSpeedWins >= DAILY_TARGETS.buzWins && !daily.claimed.dailyBuz;
  const canClaimWeeklyLevels = weekly.progress.levelWins >= WEEKLY_TARGETS.levels && !weekly.claimed.weeklyLevels;
  const dailyLevelPct = Math.max(0, Math.min(100, Math.round((daily.progress.levelWins / DAILY_TARGETS.levels) * 100)));
  const dailyDoorsPct = Math.max(0, Math.min(100, Math.round((daily.progress.doorsOpened / DAILY_TARGETS.doors) * 100)));
  const dailyBuzPct = Math.max(0, Math.min(100, Math.round((daily.progress.buzSpeedWins / DAILY_TARGETS.buzWins) * 100)));
  const weeklyLevelPct = Math.max(0, Math.min(100, Math.round((weekly.progress.levelWins / WEEKLY_TARGETS.levels) * 100)));
  const hudScore = useMemo(() => {
    const base = state.level * 120;
    const coinScore = state.collectedCoins.size * 180;
    const efficiency = Math.max(0, state.movesLeft) * 22;
    return base + coinScore + efficiency;
  }, [state.level, state.collectedCoins.size, state.movesLeft]);

  useEffect(() => {
    if (state.status === 'playing') {
      setResultStatus('playing');
      setResultShardGain(0);
      return;
    }
    if (currentStage === 'buz' && state.status === 'won' && state.lastMoveIcy) {
      const id = window.setTimeout(() => setResultStatus(state.status), 1300);
      return () => window.clearTimeout(id);
    }
    setResultStatus(state.status);
  }, [state.status, currentStage, state.lastMoveIcy]);

  useEffect(() => {
    if (screen !== 'game') return;
    if (state.status !== 'playing') return;
    if (inputLockTimer.current) {
      window.clearTimeout(inputLockTimer.current);
      inputLockTimer.current = null;
    }
    if (state.history.length === 0) return;
    const lockMs = currentStage === 'buz' && state.lastMoveIcy ? 650 : 120;
    setInputLocked(true);
    inputLockTimer.current = window.setTimeout(() => {
      setInputLocked(false);
      inputLockTimer.current = null;
    }, lockMs);
    return () => {
      if (inputLockTimer.current) {
        window.clearTimeout(inputLockTimer.current);
        inputLockTimer.current = null;
      }
    };
  }, [screen, state.status, state.history.length, currentStage, state.lastMoveIcy]);

  useEffect(() => {
    if (screen === 'game' && !paused) return;
    if (inputLockTimer.current) {
      window.clearTimeout(inputLockTimer.current);
      inputLockTimer.current = null;
    }
    setInputLocked(false);
  }, [screen, paused]);

  useEffect(() => {
    const id = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    setProgressData((prev) => {
      const next = withRegeneratedEnergy(prev, clockNow);
      if (next.energy === prev.energy && next.energyUpdatedAt === prev.energyUpdatedAt) {
        return prev;
      }
      saveUserProgress(user.username, next);
      return next;
    });
  }, [clockNow, user]);

  useEffect(() => {
    if (!user) return;
    setProgressData((prev) => {
      const existing = prev.levelSeeds[state.level];
      if (existing === state.seed) return prev;
      const next = {
        ...prev,
        levelSeeds: { ...prev.levelSeeds, [state.level]: state.seed },
      };
      saveUserProgress(user.username, next);
      return next;
    });
  }, [user, state.level, state.seed]);

  useEffect(() => {
    if (!user) return;
    const dayKey = getDayKey(clockNow);
    const weekKey = getWeekKey(clockNow);
    setMetaData((prev) => {
      const needsDailyReset = prev.daily.key !== dayKey;
      const needsWeeklyReset = prev.weekly.key !== weekKey;
      if (!needsDailyReset && !needsWeeklyReset) return prev;
      const next: MetaProgress = {
        ...prev,
        daily: needsDailyReset ? emptyQuestState(dayKey) : prev.daily,
        weekly: needsWeeklyReset ? emptyQuestState(weekKey) : prev.weekly,
      };
      saveUserMeta(user.username, next);
      return next;
    });
  }, [clockNow, user]);

  useEffect(() => {
    if (!energyNotice) return;
    const id = window.setTimeout(() => setEnergyNotice(null), 2800);
    return () => window.clearTimeout(id);
  }, [energyNotice]);

  return (
    <div
      className={[
        'min-h-dvh w-full flex flex-col overflow-hidden select-none relative isolate z-0',
        theme.ui.rootBgClass,
      ].join(' ')}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      >
        {screen === 'game' && currentStage === 'volkan' && (
          <style>
            {`
          @keyframes volkanBgGlow {
            0% { opacity: 0.75; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.02); }
            100% { opacity: 0.8; transform: scale(1); }
          }
          @keyframes volkanEmbers {
            0% { background-position: 0% 0%; }
            100% { background-position: 100% 100%; }
          }
        `}
          </style>
        )}
        {screen === 'game' && currentStage === 'kum' && (
          <style>
            {`
          @keyframes sandDust {
            0% { background-position: 0% 0%; }
            100% { background-position: 100% 100%; }
          }
        `}
          </style>
        )}
        {user && screen !== 'auth' && (screen !== 'game' || isIceStage || isToprakStage) && (
          <EnergyBar
            currentEnergy={liveProgress.energy}
            maxEnergy={ENERGY_MAX}
            timerLabel={energyTimerCompact}
            notice={energyNotice}
          />
        )}
        {/* Animated background stars */}
      {!(screen === 'game' && (isIceStage || isToprakStage)) && (
        <>
          <div
            className={[
              'absolute inset-0 pointer-events-none',
              'bg-gradient-to-b',
              theme.ui.hazeClass,
            ].join(' ')}
          />
          {theme.ui.starsEnabled && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    opacity: [0.2, 1, 0.2],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Kum stage background (levels only) */}
      {screen === 'game' && currentStage === 'kum' && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "url('/stages/kum-bg.png') center / cover no-repeat",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(120% 80% at 50% 0%, rgba(255, 230, 180, 0.18) 0%, transparent 60%), radial-gradient(120% 80% at 50% 100%, rgba(80, 50, 20, 0.35) 0%, transparent 60%)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(2px 2px at 20% 30%, rgba(255, 220, 180, 0.35) 0, transparent 60%), radial-gradient(2px 2px at 70% 40%, rgba(255, 200, 140, 0.3) 0, transparent 60%), radial-gradient(3px 3px at 45% 65%, rgba(255, 210, 160, 0.3) 0, transparent 60%), radial-gradient(2px 2px at 80% 75%, rgba(255, 230, 190, 0.3) 0, transparent 60%)',
              backgroundSize: '220% 220%',
              animation: 'sandDust 14s linear infinite',
              opacity: 0.55,
            }}
          />
        </>
      )}

      {/* Volkan stage background (levels only) */}
      {screen === 'game' && currentStage === 'volkan' && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "url('/stages/volkan-bg.jpg') center / cover no-repeat",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none volkan-bg-glow"
            style={{
              background:
                'radial-gradient(120% 85% at 50% 0%, rgba(255, 110, 0, 0.22) 0%, transparent 58%), radial-gradient(120% 80% at 50% 100%, rgba(40, 0, 0, 0.65) 0%, transparent 62%)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none volkan-bg-dim"
            style={{
              background:
                'linear-gradient(180deg, rgba(255, 90, 0, 0.12) 0%, rgba(0,0,0,0.22) 55%, rgba(0,0,0,0.45) 100%)',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(2px 2px at 20% 30%, rgba(255, 180, 80, 0.28) 0, transparent 60%), radial-gradient(2px 2px at 70% 40%, rgba(255, 90, 0, 0.22) 0, transparent 60%), radial-gradient(3px 3px at 45% 65%, rgba(255, 140, 0, 0.24) 0, transparent 60%), radial-gradient(2px 2px at 80% 75%, rgba(255, 200, 100, 0.2) 0, transparent 60%)',
              backgroundSize: '220% 220%',
              animation: 'volkanEmbers 10s linear infinite',
              opacity: 0.7,
            }}
          />
        </>
      )}

      {/* AUTH */}
      {screen === 'auth' ? (
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl"
          >
            <div className="text-center space-y-2">
              <div className="text-sm font-bold text-white/80 tracking-[0.2em]">LABİRENT</div>
              <h1 className="text-3xl font-black text-white">Hesap</h1>
              <p className="text-white/80 text-sm">Kullanıcıya göre ilerleme kaydedilecek.</p>
            </div>

            <div className="mt-6 space-y-3">
              <label className="block text-white/80 text-xs font-bold">Kullanıcı adı</label>
              <input
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="örn: bahar"
                className="w-full px-4 py-3 rounded-2xl bg-white/10 text-white placeholder:text-white/40 border border-white/20 outline-none"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={doLoginOrRegister}
                className="w-full bg-gradient-to-r from-cyan-400 to-blue-600 text-white py-3 rounded-2xl font-black shadow-2xl"
              >
                Giriş / Kayıt
              </motion.button>
            </div>
          </motion.div>
        </div>
      ) : screen === 'game' ? (
        <>
          {gezegenIntroOpen &&
            currentStage === 'gezegen' &&
            createPortal(
              <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 2147483647 }}>
                <div
                  className="w-full max-w-[92%] sm:max-w-[420px] rounded-2xl p-5 text-white shadow-2xl"
                  style={{
                    backgroundColor: 'rgba(26, 16, 42, 0.94)',
                    border: '1px solid rgba(120, 90, 180, 0.45)',
                    boxShadow: '0 18px 40px rgba(0,0,0,0.5)',
                    backgroundImage:
                      'radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.35) 0, transparent 70%), radial-gradient(1px 1px at 70% 40%, rgba(255,255,255,0.28) 0, transparent 70%), radial-gradient(1px 1px at 45% 65%, rgba(255,255,255,0.25) 0, transparent 70%)',
                  }}
                >
                  <div className="font-black text-base" style={{ color: '#E6E0F0' }}>
                    Gezegen Aşaması
                  </div>
                  <div className="mt-2 text-[13px] font-semibold leading-relaxed" style={{ color: '#E6E0F0' }}>
                    Labirentteki coinleri topla, kapıları aç ve yolu tamamla.
                  </div>
                  <div className="mt-2 text-[13px] font-semibold leading-relaxed" style={{ color: '#E6E0F0' }}>
                    Hamlelerini dikkatli kullan,{' '}
                    <span style={{ color: '#f0e9ff', fontWeight: 900 }}>belirlenen hamle sayısı</span> içinde çıkışa ulaş.
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => setGezegenIntroOpen(false)}
                      className="w-full rounded-lg py-2 text-sm font-black"
                      style={{
                        backgroundColor: '#20133A',
                        color: '#E6E0F0',
                        border: '1px solid rgba(150, 120, 220, 0.6)',
                      }}
                    >
                      Tamam
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          {buzIntroOpen &&
            currentStage === 'buz' &&
            createPortal(
              <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 2147483647 }}>
                <div
                  className="w-full max-w-[92%] sm:max-w-[420px] rounded-2xl p-5 text-white shadow-2xl"
                  style={{
                    backgroundColor: 'rgba(15, 30, 45, 0.94)',
                    border: '1px solid rgba(120, 180, 220, 0.35)',
                    boxShadow: '0 18px 40px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(2px)',
                  }}
                >
                  <div className="font-black text-base" style={{ color: '#EAF3F8' }}>
                    Buz Aşaması
                  </div>
                  <div className="mt-2 text-[13px] font-semibold leading-relaxed" style={{ color: '#EAF3F8' }}>
                    Zaman işlemeye başladığında buz seni yavaşlatır. Bazı buzlu zeminlerde{' '}
                    <span style={{ color: '#9fe3ff', fontWeight: 900 }}>vakit alır</span>.
                  </div>
                  <div className="mt-2 text-[13px] font-semibold leading-relaxed" style={{ color: '#EAF3F8' }}>
                    <span style={{ color: '#9fe3ff', fontWeight: 900 }}>Süre dolmadan</span> ve hamlelerini doğru kullanarak
                    çıkışa ulaşmalısın.
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        setBuzIntroOpen(false);
                        setBuzIntroDismissed(true);
                      }}
                      className="w-full rounded-lg py-2 text-sm font-black"
                      style={{
                        backgroundColor: '#11293A',
                        color: '#EAF3F8',
                        border: '1px solid rgba(120, 180, 220, 0.5)',
                      }}
                    >
                      Tamam
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          {volkanIntroOpen &&
            currentStage === 'volkan' &&
            createPortal(
              <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 2147483647 }}>
                <div
                  className="w-full max-w-[92%] sm:max-w-[420px] rounded-2xl p-5 text-white shadow-2xl"
                  style={{
                    backgroundColor: 'rgba(26, 14, 11, 0.95)',
                    border: '1px solid rgba(255, 120, 80, 0.5)',
                    boxShadow: '0 18px 40px rgba(0,0,0,0.5)',
                  }}
                >
                  <div className="font-black text-base" style={{ color: '#F2ECE8' }}>
                    Volkan Aşaması
                  </div>
                  <div className="mt-2 text-[13px] font-semibold leading-relaxed" style={{ color: '#F2ECE8' }}>
                    Lava yukarıdan aşağıya doğru ilerler.{' '}
                    <span style={{ color: '#ff6b3d', fontWeight: 900 }}>Her 3 hamlede</span> bir alan daralır.
                  </div>
                  <div className="mt-2 text-[13px] font-semibold leading-relaxed" style={{ color: '#F2ECE8' }}>
                    Hızlı değil, doğru kararlar seni kurtarır.
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => setVolkanIntroOpen(false)}
                      className="w-full rounded-lg py-2 text-sm font-black"
                      style={{
                        backgroundColor: '#2B0F0A',
                        color: '#F2ECE8',
                        border: '1px solid rgba(255, 120, 80, 0.6)',
                      }}
                    >
                      Tamam
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          {kumIntroOpen &&
            currentStage === 'kum' &&
            createPortal(
              <div
                className="fixed inset-0 flex items-center justify-center p-4"
                style={{ zIndex: 2147483647 }}
              >
                <div
                  className="w-full max-w-[92%] sm:max-w-[420px] rounded-2xl p-5 text-white shadow-2xl"
                  style={{
                    backgroundColor: '#7a5520',
                    border: '1px solid #b88a3a',
                    boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
                  }}
                >
                  <div className="font-black text-base" style={{ color: '#fff4db' }}>
                    Kum Aşaması
                  </div>
                  <div className="mt-2 text-[13px] font-semibold leading-relaxed" style={{ color: '#fff8e9' }}>
                    Kum fırtınası görüşünü kısıtlar. İlk adımı attıktan sonra labirentin tamamını göremezsin.
                  </div>
                  <div className="mt-2 text-[13px] font-semibold leading-relaxed" style={{ color: '#fff8e9' }}>
                    Harita pusulalarını kullanarak yolu tekrar görebilir, doğru rotayı hatırlayarak ilerleyebilirsin.
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => setKumIntroOpen(false)}
                      className="w-full rounded-lg py-2 text-sm font-black"
                      style={{
                        backgroundColor: '#b88a3a',
                        color: '#2b1606',
                        border: '1px solid #e4bf6b',
                      }}
                    >
                      Tamam
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          {isIceStage ? (
            <BuzStage
              gameState={state}
              onPause={handlePauseToggle}
              onRestart={handleRestartLevel}
              onMenuReturn={handleMenuReturn}
              mazeScale={mazeScale}
              mazeSlotRef={mazeSlotRef}
            />
          ) : isToprakStage ? (
            <ToprakStage
              gameState={state}
              onPause={handlePauseToggle}
              onRestart={handleRestartLevel}
              mazeScale={mazeScale}
              mazeSlotRef={mazeSlotRef}
            />
          ) : (
            <>
              <InGameHud
                level={state.level}
                movesLeft={state.movesLeft}
                coinsCollected={state.collectedCoins.size}
                coinsTotal={state.coins.length}
                score={hudScore}
                currentEnergy={liveProgress.energy}
                maxEnergy={ENERGY_MAX}
                energyTimerLabel={energyTimerCompact}
                energyNotice={energyNotice}
                onPause={handlePauseToggle}
              />

              <div className="flex-1 min-h-0 w-full p-4 relative z-10 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <div ref={mazeSlotRef} className="w-full h-full flex items-center justify-center">
                    <div style={{ transform: `scale(${mazeScale})`, transformOrigin: 'center' }}>
                      <MazeGrid
                        grid={grid}
                        playerPos={state.playerPos}
                        exitPos={state.exitPos}
                        coins={state.coins}
                        doors={state.doors}
                        collectedCoins={state.collectedCoins}
                        icyCells={state.icyCells}
                        lastMoveIcy={state.lastMoveIcy}
                        soilVisits={state.soilVisits}
                        sandStormActive={state.sandStormActive}
                        sandCheckpoint={state.sandCheckpoint}
                        sandRevealSeconds={state.sandRevealSeconds}
                        lavaRow={state.lavaRow}
                        lavaMoveCounter={state.lavaMoveCounter}
                        theme={currentStage}
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}

          <ResultDialog
            status={resultStatus}
            level={state.level}
            movesUsed={movesUsed}
            stars={resultStars}
            shardGain={resultShardGain}
            isFinalLevel={isFinalLevel}
            onRestart={handleRestart}
            onNextLevel={handleNextLevel}
            onMenu={handleMenuReturn}
          />
          {paused &&
            canUseDom &&
            createPortal(
              <>
                <div
                  className="fixed inset-0"
                  aria-hidden="true"
                  data-testid="pause-overlay"
                  data-overlay="pause"
                  role="presentation"
                  style={{
                    zIndex: 2147483646,
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(18,18,18,0.74)',
                    backdropFilter: 'blur(2px)',
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className="fixed inset-0 flex items-center justify-center p-4"
                  style={{ zIndex: 2147483647, position: 'fixed', inset: 0 }}
                >
                  <div className="w-full max-w-[360px]">
                    <div className="relative overflow-hidden rounded-[26px] border border-cyan-100/25 bg-[linear-gradient(170deg,rgba(7,14,33,0.86),rgba(23,14,42,0.84),rgba(9,31,49,0.84))] px-6 pt-6 pb-5 text-center backdrop-blur-2xl shadow-[0_18px_46px_rgba(0,0,0,0.42)]">
                      <div className="pointer-events-none absolute -top-16 -right-14 h-44 w-44 rounded-full bg-cyan-300/25 blur-3xl" />
                      <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-3xl" />

                      <div className="relative text-white font-black text-[26px] tracking-tight">Paused</div>
                      <div className="relative text-white/75 text-[15px] mt-1">Run is safe. Resume when ready.</div>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleResume}
                        className="relative mt-5 h-14 w-full rounded-2xl font-black text-[17px] text-white flex items-center justify-center gap-2 border border-cyan-100/40 bg-[linear-gradient(90deg,#22d3ee,#3b82f6,#6366f1)] shadow-[0_10px_24px_rgba(56,189,248,0.34)]"
                      >
                        <img
                          src={`${assetBase}icons/devam-et-ikonu.png`}
                          alt=""
                          className="w-8 h-8 object-contain"
                          style={{ transform: 'translate(-2px, 2px)' }}
                          aria-hidden="true"
                        />
                        <span>Continue</span>
                      </motion.button>

                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={handleRestartLevel}
                          className="h-12 rounded-2xl font-semibold text-white/95 border border-white/25 bg-white/12 backdrop-blur-sm shadow-[0_6px_14px_rgba(0,0,0,0.22)]"
                        >
                          Restart
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={handlePauseMenu}
                          className="h-12 rounded-2xl font-semibold text-rose-100 border border-rose-200/35 bg-rose-500/18 backdrop-blur-sm shadow-[0_6px_14px_rgba(0,0,0,0.22)]"
                        >
                          Quit
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>,
              document.body
            )}
        </>
      ) : screen === 'world' ? (
        <div className="flex-1 p-4 relative z-10 overflow-y-auto">
          <div className="mx-auto w-full max-w-md space-y-4">
            <div className="rounded-3xl border border-white/25 bg-white/10 backdrop-blur-md p-4 text-white">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setScreen('menu')}
                  className="px-3 py-1.5 rounded-xl bg-white/15 border border-white/30 text-xs font-black"
                >
                  Geri
                </button>
                <div className="text-xs font-bold text-white/80">
                  Shard: <span className="text-white">{metaData.shard}</span> | Skin Token: <span className="text-white">{metaData.skinToken}</span>
                </div>
              </div>
              <div className="mt-3 text-center">
                <div className="text-xs font-black tracking-[0.18em] text-white/70">WORLD MAP</div>
                <div className="text-2xl font-black">Gezegen Rotası</div>
              </div>

              <div className="mt-5 space-y-3">
                {stageStats.map((stage, idx) => (
                  <div key={stage.key} className="relative">
                    {idx < stageStats.length - 1 && (
                      <div className="absolute left-5 top-11 h-10 w-[2px] bg-white/30" />
                    )}
                    <button
                      onClick={() => handleSelectStage(stage.key)}
                      className="w-full rounded-2xl border border-white/20 bg-black/20 px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full border border-white/35 bg-gradient-to-br from-cyan-300/60 to-indigo-400/70 flex items-center justify-center font-black">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="text-base font-black">{stage.label}</div>
                          <div className="text-xs text-white/75">
                            {stage.completed}/{stage.total} seviye • {stage.stars} yıldız • {getStageCostText(stage.key)}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/25 bg-white/10 backdrop-blur-md p-4 text-white">
              <div className="text-sm font-black tracking-wide">Daily / Weekly Görevler</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="rounded-xl border border-white/20 bg-black/20 p-3">
                  <div className="font-semibold">Bugün 10 level bitir ({daily.progress.levelWins}/{DAILY_TARGETS.levels})</div>
                  <button
                    disabled={!canClaimDailyLevels}
                    onClick={() => claimQuestReward('dailyLevels')}
                    className="mt-2 px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-500/80 disabled:bg-white/20 disabled:text-white/60"
                  >
                    {daily.claimed.dailyLevels ? 'Alındı' : 'Ödül Al (+10 shard)'}
                  </button>
                </div>
                <div className="rounded-xl border border-white/20 bg-black/20 p-3">
                  <div className="font-semibold">3 kapı aç ({daily.progress.doorsOpened}/{DAILY_TARGETS.doors})</div>
                  <button
                    disabled={!canClaimDailyDoors}
                    onClick={() => claimQuestReward('dailyDoors')}
                    className="mt-2 px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-500/80 disabled:bg-white/20 disabled:text-white/60"
                  >
                    {daily.claimed.dailyDoors ? 'Alındı' : 'Ödül Al (+8 shard)'}
                  </button>
                </div>
                <div className="rounded-xl border border-white/20 bg-black/20 p-3">
                  <div className="font-semibold">Buz’da 5 leveli süre bitmeden geç ({daily.progress.buzSpeedWins}/{DAILY_TARGETS.buzWins})</div>
                  <button
                    disabled={!canClaimDailyBuz}
                    onClick={() => claimQuestReward('dailyBuz')}
                    className="mt-2 px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-500/80 disabled:bg-white/20 disabled:text-white/60"
                  >
                    {daily.claimed.dailyBuz ? 'Alındı' : 'Ödül Al (+12 shard, +1 token)'}
                  </button>
                </div>
                <div className="rounded-xl border border-white/20 bg-black/20 p-3">
                  <div className="font-semibold">Bu hafta 30 level bitir ({weekly.progress.levelWins}/{WEEKLY_TARGETS.levels})</div>
                  <button
                    disabled={!canClaimWeeklyLevels}
                    onClick={() => claimQuestReward('weeklyLevels')}
                    className="mt-2 px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-500/80 disabled:bg-white/20 disabled:text-white/60"
                  >
                    {weekly.claimed.weeklyLevels ? 'Alındı' : 'Ödül Al (+30 shard, +2 token)'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : screen === 'stages' ? (
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm max-h-[85dvh] bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-white/80 text-xs font-bold">
                Kullanıcı: <span className="text-white">{user?.username}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToMenu}
                  className="px-4 py-2 rounded-2xl bg-white/20 border border-white/40 text-white text-sm font-black shadow-[0_10px_22px_rgba(0,0,0,0.3)]"
                >
                  Geri
                </button>
                <button
                  onClick={doLogout}
                  className="px-4 py-2 rounded-2xl bg-rose-500/20 border border-rose-200/40 text-rose-50 text-sm font-black shadow-[0_10px_22px_rgba(0,0,0,0.3)]"
                >
                  Çıkış yap
                </button>
              </div>
            </div>

            <div className="text-center space-y-2 mt-3">
              <div className="text-sm font-bold text-white/80 tracking-[0.2em]">AŞAMA</div>
              <h2 className="text-3xl font-black text-white">{selectedStageInfo.label}</h2>
              <p className="text-white/80 text-sm">{selectedStageRangeText}</p>
            </div>

            <div className="mt-5 space-y-3">
              <div
                className={[
                  'relative w-full text-left text-white p-4 rounded-2xl shadow-2xl border border-white/20 overflow-hidden',
                  selectedStageInfo.key === 'buz'
                    ? 'bg-gradient-to-br from-slate-900 via-sky-900 to-cyan-900'
                    : 'bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900',
                ].join(' ')}
              >
                <div
                  className={[
                    'absolute -top-16 -right-16 w-40 h-40 rounded-full blur-xl',
                    selectedStageInfo.key === 'buz'
                      ? 'bg-gradient-to-br from-cyan-300/40 to-white/20'
                      : 'bg-gradient-to-br from-fuchsia-400/40 to-cyan-300/30',
                  ].join(' ')}
                />
                <div
                  className={[
                    'absolute -bottom-20 -left-16 w-44 h-44 rounded-full blur-2xl',
                    selectedStageInfo.key === 'buz'
                      ? 'bg-gradient-to-br from-blue-300/25 to-sky-400/25'
                      : 'bg-gradient-to-br from-orange-300/20 to-pink-400/30',
                  ].join(' ')}
                />

                <div className="mt-2 max-h-[58dvh] overflow-y-auto pr-1">
                  <div className="relative mx-auto w-full max-w-[260px] overflow-visible">
                    {(() => {
                      const topPadding = 120;
                      const stepY = 90;
                      const stepX = 70;
                      const totalLevels = selectedStageInfo.endLevel - selectedStageInfo.startLevel + 1;
                      const totalHeight = topPadding + totalLevels * stepY + 200;
                      const levels = Array.from(
                        { length: selectedStageInfo.endLevel - selectedStageInfo.startLevel + 1 },
                        (_, i) => {
                          const actualLevel = selectedStageInfo.startLevel + i;
                          return { actualLevel, displayLevel: i + 1 };
                        }
                      );

                      return (
                        <div className="relative overflow-visible" style={{ height: totalHeight }}>
                          {levels.map(({ actualLevel, displayLevel }, idx) => {
                            const isCompleted = completedSet.has(actualLevel);
                            const isInProgress = actualLevel === progressData.currentLevel;
                            const starCount = metaData.starsByLevel[actualLevel] ?? 0;
                            const isUnlocked =
                              actualLevel <= unlockedUntil ||
                              (selectedStageInfo.key === 'buz' && actualLevel === selectedStageInfo.startLevel);
                            const energyCost = getEnergyCostForLevel(actualLevel);
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
                                }}
                                whileHover={{ zIndex: 50 }}
                              >
                                <motion.button
                                  type="button"
                                  disabled={!isUnlocked}
                                  className={[
                                    'w-12 h-12 rounded-full',
                                    'flex items-center justify-center',
                                    'relative',
                                    'text-[16px] font-black tabular-nums',
                                    'tracking-[0.02em]',
                                    'border backdrop-blur-sm',
                                    '-translate-x-1/2 -translate-y-1/2',
                                    'shadow-lg shadow-cyan-500/10',
                                    'will-change-transform',
                                    isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed',
                                    'disabled:opacity-100',
                                  ].join(' ')}
                                  style={{
                                    backgroundColor: bgColor,
                                    borderColor,
                                    color: textColor,
                                    textShadow: '0 2px 10px rgba(0,0,0,0.35)',
                                  }}
                                  whileHover={isUnlocked ? { scale: 1.06 } : undefined}
                                  whileTap={isUnlocked ? { scale: 0.95 } : undefined}
                                  title={`${energyCost} enerji`}
                                  onClick={() => {
                                    if (!isUnlocked) return;
                                    handleStartLevel(actualLevel);
                                  }}
                                >
                                  <span>{displayLevel}</span>
                                  {starCount > 0 && (
                                    <span className="absolute -bottom-4 text-[10px] tracking-[2px] text-amber-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                                      {'★'.repeat(starCount)}
                                    </span>
                                  )}
                                </motion.button>
                              </motion.div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4" />
          </motion.div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-sm max-h-[85dvh] rounded-[30px] p-[1px] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.5)] bg-[linear-gradient(135deg,rgba(255,255,255,0.34),rgba(255,255,255,0.08),rgba(56,189,248,0.25))]"
          >
            <div className="relative h-full rounded-[30px] bg-[linear-gradient(160deg,rgba(8,14,34,0.9),rgba(36,18,74,0.88),rgba(10,45,72,0.88))] backdrop-blur-xl border border-white/10 p-5">
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
              <div className="pointer-events-none absolute -left-10 -bottom-12 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl" />
              <div className="relative flex items-center justify-between">
                <div className="text-white/80 text-xs font-bold">
                  Kullanıcı: <span className="text-white">{user?.username}</span>
                </div>
                <button onClick={doLogout} className="text-white/75 text-xs font-bold underline underline-offset-4">
                  Çıkış
                </button>
              </div>

              <div className="text-center space-y-2 mt-4">
                <div className="text-[11px] font-black text-cyan-100/80 tracking-[0.3em]">LABYRINTH PROTOCOL</div>
                <h1 className="text-4xl font-black text-white leading-none">MAZE GAME</h1>
                <p className="text-white/75 text-sm">Dünya haritasından aşamanı seç, görevleri tamamla ve kozmetik ödülleri topla.</p>
              </div>

              <div className="mt-4 rounded-2xl border border-cyan-100/20 bg-black/25 p-3 text-white">
                <div className="text-xs font-black tracking-[0.18em] text-cyan-100/80">QUEST TRACKER</div>
                <div className="mt-3 space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Bugün level</span>
                      <span className="font-black">{daily.progress.levelWins}/{DAILY_TARGETS.levels}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-300 to-blue-500" style={{ width: `${dailyLevelPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Kapı aç</span>
                      <span className="font-black">{daily.progress.doorsOpened}/{DAILY_TARGETS.doors}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-300 to-green-500" style={{ width: `${dailyDoorsPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Buz hızlı</span>
                      <span className="font-black">{daily.progress.buzSpeedWins}/{DAILY_TARGETS.buzWins}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-sky-300 to-cyan-500" style={{ width: `${dailyBuzPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Hafta level</span>
                      <span className="font-black">{weekly.progress.levelWins}/{WEEKLY_TARGETS.levels}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-300 to-fuchsia-500" style={{ width: `${weeklyLevelPct}%` }} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-center text-[11px]">
                    <div className="text-white/60">Shard</div>
                    <div className="font-black text-cyan-100">{metaData.shard}</div>
                  </div>
                  <div className="rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-center text-[11px]">
                    <div className="text-white/60">Skin Token</div>
                    <div className="font-black text-fuchsia-100">{metaData.skinToken}</div>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleShowStages}
                className="mt-5 w-full bg-[linear-gradient(90deg,#34d399,#22d3ee,#3b82f6)] text-white py-4 rounded-2xl font-black text-lg shadow-[0_12px_30px_rgba(56,189,248,0.35)] border border-cyan-100/40"
              >
                Dünya Haritası
              </motion.button>
            </div>
          </motion.div>
          {stagePopupOpen && (
            <>
              <div className="fixed inset-0 z-20 bg-black/50" onClick={() => setStagePopupOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-30 flex items-center justify-center p-4"
              >
                <div className="w-full max-w-sm bg-white/15 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <div className="text-white font-black">Aşamalar</div>
                    <button onClick={() => setStagePopupOpen(false)} className="text-white/70 text-xs font-bold">
                      Kapat
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    {STAGES.map((stage) => (
                      <button
                        key={stage.key}
                        onClick={() => handleSelectStage(stage.key)}
                        className="overflow-hidden rounded-2xl border border-white/20 text-left text-white cursor-pointer"
                      >
                        <div
                          className="h-24 w-full rounded-2xl overflow-hidden"
                          style={{
                            backgroundImage: `url(/stages/${stage.key}.jpg)`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            backgroundSize: 'contain',
                          }}
                        />

                        <div className="px-4 py-3 text-lg font-black">{stage.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
