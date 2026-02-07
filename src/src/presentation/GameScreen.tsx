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
import { Coins } from 'lucide-react';
import { gameReducer, createLevel } from '../game/reducer';
import { getGridForRender, canUndo, getProgress } from '../game/selectors';
import { type Direction, MAX_LEVEL } from '../game/types';
import { THEMES, THEME_KEYS, getThemeForLevel, type ThemeKey } from '../themes';
import { useTheme } from '../themes/ThemeProvider';
import { MazeGrid } from './MazeGrid';
import { BuzStage } from './BuzStage';
import { ToprakStage } from './ToprakStage';
import { ResultDialog } from './overlays/ResultDialog';

type ScreenState = 'auth' | 'menu' | 'stages' | 'game';
type StageKey = ThemeKey;
type UserProgress = {
  completedLevels: number[];
  currentLevel: number;
};

type AuthUser = {
  username: string;
};

const AUTH_USER_KEY = 'maze_auth_user';
const PROGRESS_PREFIX = 'maze_progress_user_';
const MAIN_MENU_THEME_KEY: ThemeKey = 'gezegen';

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
  return { completedLevels: [], currentLevel: 1 };
}

function loadUserProgress(username: string): UserProgress {
  const raw = window.localStorage.getItem(PROGRESS_PREFIX + username);
  if (!raw) return defaultProgress();
  try {
    const parsed = JSON.parse(raw) as UserProgress;

    const completedLevels = Array.isArray(parsed.completedLevels)
      ? parsed.completedLevels
          .filter((n) => Number.isFinite(n))
          .map((n) => Math.max(1, Math.min(MAX_LEVEL, n)))
      : [];

    const currentLevel = Number.isFinite(parsed.currentLevel)
      ? Math.max(1, Math.min(MAX_LEVEL, parsed.currentLevel))
      : 1;

    const uniq = Array.from(new Set(completedLevels)).sort((a, b) => a - b);
    return { completedLevels: uniq, currentLevel };
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

export function GameScreen() {
  const { setTheme, themeKey } = useTheme();
  const [state, dispatch] = useReducer(gameReducer, null, () => createLevel(1));
  const [screen, setScreen] = useState<ScreenState>('auth');
  const [stagePopupOpen, setStagePopupOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<StageKey>('gezegen');
  const [paused, setPaused] = useState(false);
  const mazeSlotRef = useRef<HTMLDivElement | null>(null);
  const [mazeScale, setMazeScale] = useState(1);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [usernameInput, setUsernameInput] = useState('');

  const [progressData, setProgressData] = useState<UserProgress>(defaultProgress());

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const grid = useMemo(() => getGridForRender(state), [state]);
  const canUndoMove = useMemo(() => canUndo(state), [state]);
  const progress = useMemo(() => getProgress(state), [state]);
  const isGameActive = screen === 'game' && state.status === 'playing' && !paused;
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
    return { totalWidth, totalHeight, baseWidth, baseHeight };
  }, [grid, currentStage]);

  useEffect(() => {
    if (!mazeSlotRef.current || !mazeSize) return;

    const updateScale = () => {
      if (!mazeSlotRef.current) return;
      const rect = mazeSlotRef.current.getBoundingClientRect();
      const targetWidth = Math.max(mazeSize.totalWidth, mazeSize.baseWidth);
      const targetHeight = Math.max(mazeSize.totalHeight, mazeSize.baseHeight);
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

  // Boot: load logged user (if exists)
  useEffect(() => {
    const existing = loadCurrentUser();
    if (existing) {
      setUser(existing);
      const loaded = loadUserProgress(existing.username);
      setProgressData(loaded);
      dispatch({ type: 'LOAD_LEVEL', level: loaded.currentLevel });
      setScreen('menu');
    } else {
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

    setProgressData((prev) => {
      const completed = new Set(prev.completedLevels);
      completed.add(state.level);

      const nextCurrent = Math.min(MAX_LEVEL, state.level + 1);
      const next: UserProgress = {
        completedLevels: Array.from(completed).sort((a, b) => a - b),
        currentLevel: nextCurrent,
      };

      saveUserProgress(user.username, next);
      return next;
    });
  }, [state.status, state.level, user]);

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
        dispatch({ type: 'MOVE', direction });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameActive, canUndoMove]);

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

    if (direction) dispatch({ type: 'MOVE', direction });
    touchStartRef.current = null;
  };

  const handleRestart = () => dispatch({ type: 'RESTART' });
  const handleRestartLevel = () => {
    setPaused(false);
    dispatch({ type: 'RESTART' });
  };
  const handleNextLevel = () => {
    if (isFinalLevel) return;
    dispatch({ type: 'NEXT_LEVEL' });
  };

  const handlePauseToggle = () => setPaused((prev) => !prev);
  const handleResume = () => setPaused(false);
  const handlePauseMenu = () => {
    setPaused(false);
    handleMenuReturn();
  };

  const movesUsed = state.maxMoves - state.movesLeft;

  const handleShowStages = () => setStagePopupOpen(true);
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

    setPaused(false);
    dispatch({ type: 'LOAD_LEVEL', level });

    setProgressData((prev) => {
      const next = { ...prev, currentLevel: level };
      saveUserProgress(user.username, next);
      return next;
    });

    setScreen('game');
  };

  // Auth actions
  const doLoginOrRegister = () => {
    const username = usernameInput.trim();
    if (!username) return;

    const nextUser: AuthUser = { username };
    setUser(nextUser);
    saveCurrentUser(nextUser);

    const loaded = loadUserProgress(username);
    setProgressData(loaded);

    dispatch({ type: 'LOAD_LEVEL', level: loaded.currentLevel });
    setScreen('menu');
  };

  const doLogout = () => {
    setUser(null);
    saveCurrentUser(null);
    setProgressData(defaultProgress());
    dispatch({ type: 'LOAD_LEVEL', level: 1 });
    setUsernameInput('');
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

  return (
    <div
      className={[
        'min-h-dvh w-full flex flex-col overflow-hidden select-none relative isolate z-0',
        theme.ui.rootBgClass,
      ].join(' ')}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "url('/stages/kum-bg.png') center / cover no-repeat",
          }}
        />
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
              <div className="px-4 py-4 relative z-10">
                <div className="relative z-10 max-w-md mx-auto space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white px-4 py-2 rounded-2xl shadow-2xl relative"
                      style={{ boxShadow: '0 0 25px rgba(124, 58, 237, 0.5)' }}
                    >
                      <div className="text-xs font-bold opacity-80">SEVİYE</div>
                      <div className="text-2xl font-black tabular-nums">{state.level}</div>
                    </motion.div>

                    {state.coins.length > 0 && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-gradient-to-br from-amber-500 to-yellow-600 text-white px-4 py-2 rounded-2xl shadow-2xl relative flex items-center gap-2"
                        style={{ boxShadow: '0 0 25px rgba(245, 158, 11, 0.5)' }}
                      >
                        <Coins className="w-5 h-5" strokeWidth={2.5} />
                        <div className="text-xl font-black tabular-nums">
                          {state.collectedCoins.size}/{state.coins.length}
                        </div>
                      </motion.div>
                    )}

                    <motion.div
                      key={state.movesLeft}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex-1 bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 text-white px-4 py-2 rounded-2xl shadow-2xl relative"
                      style={{ boxShadow: '0 0 30px rgba(251, 191, 36, 0.5)' }}
                    >
                      <div className="text-xs font-bold opacity-80">KALAN HAMLE</div>
                      <div className="text-2xl font-black tabular-nums">{state.movesLeft}</div>
                    </motion.div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePauseToggle}
                        className="bg-white/10 text-white text-sm font-bold px-4 py-2.5 rounded-2xl border border-white/20"
                      >
                        Duraklat
                      </button>
                      <button
                        onClick={handleRestartLevel}
                        className="bg-white/10 text-white text-sm font-bold px-4 py-2.5 rounded-2xl border border-white/20"
                      >
                        Yeniden Başla
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </div>

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
                        theme={currentStage}
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}

          <ResultDialog
            status={state.status}
            level={state.level}
            movesUsed={movesUsed}
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
                  className="fixed inset-0 bg-black/70"
                  style={{ zIndex: 2147483646, position: 'fixed', inset: 0 }}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 flex items-center justify-center p-4"
                  style={{ zIndex: 2147483647, position: 'fixed', inset: 0 }}
                >
                  <div className="w-full max-w-[260px] text-center">
                    <div className="relative rounded-3xl px-5 pt-5 pb-4 bg-gradient-to-b from-fuchsia-600 via-pink-500 to-orange-400 shadow-[0_22px_60px_rgba(0,0,0,0.5)] border border-white/25">
                      <div className="text-white font-black text-xl tracking-tight">Duraklatıldı</div>
                      <div className="text-white/80 text-xs mt-1">Kaldığın yerden devam edebilirsin.</div>

                      <div className="mt-4 grid grid-cols-1 gap-2">
                        <button
                          onClick={handleResume}
                          className="py-2.5 rounded-2xl font-black text-purple-700 bg-white shadow-[0_10px_25px_rgba(0,0,0,0.25)]"
                        >
                          Devam Et
                        </button>
                        <button
                          onClick={handlePauseMenu}
                          className="py-2.5 rounded-2xl font-black text-white bg-white/15 border border-white/30 shadow-[0_8px_20px_rgba(0,0,0,0.22)]"
                        >
                          Menüye Dön
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>,
              document.body
            )}
        </>
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
                            const isUnlocked =
                              actualLevel <= unlockedUntil ||
                              (selectedStageInfo.key === 'buz' && actualLevel === selectedStageInfo.startLevel);
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
                                  onClick={() => {
                                    if (!isUnlocked) return;
                                    handleStartLevel(actualLevel);
                                  }}
                                >
                                  {displayLevel}
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
            className="w-full max-w-sm max-h-[85dvh] bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="text-white/80 text-xs font-bold">
                Kullanıcı: <span className="text-white">{user?.username}</span>
              </div>
              <button onClick={doLogout} className="text-white/70 text-xs font-bold underline underline-offset-4">
                Çıkış
              </button>
            </div>

            <div className="text-center space-y-2 mt-3">
              <div className="text-sm font-bold text-white/80 tracking-[0.2em]">LABİRENT</div>
              <h1 className="text-4xl font-black text-white">MAZE GAME</h1>
              <p className="text-white/80 text-sm">Oyna butonuna tıkla, aşamanı seç.</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleShowStages}
              className="mt-6 w-full bg-gradient-to-r from-cyan-400 to-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-2xl"
            >
              Oyna
            </motion.button>
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
