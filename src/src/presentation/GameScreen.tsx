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
import type { TouchEvent } from 'react';
import { motion } from 'motion/react';
import { Coins } from 'lucide-react';
import { gameReducer, createLevel } from '../game/reducer';
import { getGridForRender, canUndo, getProgress } from '../game/selectors';
import { type Direction, MAX_LEVEL } from '../game/types';
import { MazeGrid } from './MazeGrid';
import { Controls } from './Controls';
import { ResultDialog } from './overlays/ResultDialog';

type ScreenState = 'auth' | 'menu' | 'stages' | 'game';

type UserProgress = {
  completedLevels: number[];
  currentLevel: number;
};

type AuthUser = {
  username: string;
};

const AUTH_USER_KEY = 'maze_auth_user';
const PROGRESS_PREFIX = 'maze_progress_user_';

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
  const [state, dispatch] = useReducer(gameReducer, null, () => createLevel(1));
  const [screen, setScreen] = useState<ScreenState>('auth');

  const [user, setUser] = useState<AuthUser | null>(null);
  const [usernameInput, setUsernameInput] = useState('');

  const [progressData, setProgressData] = useState<UserProgress>(defaultProgress());

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const grid = useMemo(() => getGridForRender(state), [state]);
  const canUndoMove = useMemo(() => canUndo(state), [state]);
  const progress = useMemo(() => getProgress(state), [state]);
  const isGameActive = screen === 'game' && state.status === 'playing';
  const isFinalLevel = state.level >= MAX_LEVEL;

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

  const handleMove = (direction: Direction) => dispatch({ type: 'MOVE', direction });
  const handleUndo = () => dispatch({ type: 'UNDO' });
  const handleRestart = () => dispatch({ type: 'RESTART' });
  const handleNextLevel = () => {
    if (isFinalLevel) return;
    dispatch({ type: 'NEXT_LEVEL' });
  };

  const movesUsed = state.maxMoves - state.movesLeft;

  const handleShowStages = () => setScreen('stages');
  const handleBackToMenu = () => setScreen('menu');
  const handleMenuReturn = () => setScreen('menu');

  const handleStartLevel = (level: number) => {
    if (!user) return;

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
    setScreen('auth');
  };

  const completedSet = useMemo(() => new Set(progressData.completedLevels), [progressData.completedLevels]);
  const highestCompletedLevel = getHighestCompleted(progressData.completedLevels);
  const unlockedUntil = Math.max(highestCompletedLevel + 1, progressData.currentLevel);

  return (
    <div
      className="min-h-dvh w-full flex flex-col bg-gradient-to-b from-indigo-950 via-purple-950 to-indigo-900 overflow-hidden select-none relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated background stars */}
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
          {/* Header */}
          <div className="px-4 py-4 relative z-10">
            <div className="max-w-md mx-auto space-y-3">
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

                <button
                  onClick={handleMenuReturn}
                  className="bg-white/10 text-white text-xs font-bold px-3 py-2 rounded-xl border border-white/20"
                >
                  Menü
                </button>
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

          <div className="flex-1 flex items-center justify-center p-4 relative z-10">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
              <MazeGrid
                grid={grid}
                playerPos={state.playerPos}
                exitPos={state.exitPos}
                coins={state.coins}
                doors={state.doors}
                collectedCoins={state.collectedCoins}
              />
            </motion.div>
          </div>

          <div className="pb-8 px-4 relative z-10">
            <div className="max-w-md mx-auto">
              <Controls canUndo={canUndoMove} onUndo={handleUndo} onRestart={handleRestart} onMove={handleMove} disabled={state.status !== 'playing'} />
            </div>
          </div>

          <ResultDialog
            status={state.status}
            level={state.level}
            movesUsed={movesUsed}
            isFinalLevel={isFinalLevel}
            onRestart={handleRestart}
            onNextLevel={handleNextLevel}
            onMenu={handleMenuReturn}
          />
        </>
      ) : (
        // MENU + STAGES
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm max-h-[85dvh] bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-2xl overflow-hidden"
          >
            {screen === 'menu' ? (
              <>
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
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-white/80 text-xs font-bold">
                    Kullanıcı: <span className="text-white">{user?.username}</span>
                  </div>
                  <button onClick={doLogout} className="text-white/70 text-xs font-bold underline underline-offset-4">
                    Çıkış
                  </button>
                </div>

                <div className="text-center space-y-2 mt-3">
                  <div className="text-sm font-bold text-white/80 tracking-[0.2em]">AŞAMALAR</div>
                  <h2 className="text-3xl font-black text-white">Seçim</h2>
                  <p className="text-white/80 text-sm">Kullanıcı ilerlemesine göre boyanır.</p>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="relative w-full text-left bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                    <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br from-fuchsia-400/40 to-cyan-300/30 blur-xl" />
                    <div className="absolute -bottom-20 -left-16 w-44 h-44 rounded-full bg-gradient-to-br from-orange-300/20 to-pink-400/30 blur-2xl" />

                    <div className="text-xs font-bold opacity-80">1. AŞAMA</div>
                    <div className="text-2xl font-black">Gezegen Aşaması</div>
                    <div className="text-sm font-semibold opacity-90">Bölüm 1-50</div>

                    <div className="mt-4 max-h-[58dvh] overflow-y-auto pr-1">
                      <div className="relative mx-auto w-full max-w-[260px] overflow-visible">
                        {(() => {
                          const topPadding = 120;
                          const stepY = 90;
                          const stepX = 70;
                          const totalHeight = topPadding + MAX_LEVEL * stepY + 200;

                          return (
                            <div className="relative overflow-visible" style={{ height: totalHeight }}>
                              {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((level) => {
                                const isCompleted = completedSet.has(level);
                                const isInProgress = level === progressData.currentLevel;
                                const isUnlocked = level <= unlockedUntil;
                                const offsetX = level % 2 === 0 ? stepX : -stepX;

                                // ✅ SAME transparency level for ALL circles (including locked)
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

                                // ✅ Numbers are bold for ALL levels; locked is just slightly dimmer
                                const textColor = isUnlocked ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)';

                                return (
                                  <motion.div
                                    key={level}
                                    className="absolute z-10"
                                    style={{
                                      left: `calc(50% + ${offsetX}px)`,
                                      top: `${topPadding + (level - 1) * stepY}px`,
                                    }}
                                    whileHover={{ zIndex: 50 }}
                                  >
                                    <motion.button
                                      type="button"
                                      disabled={!isUnlocked}
                                      className={[
                                        'w-12 h-12 rounded-full',
                                        'flex items-center justify-center',
                                        // ✅ bolder numbers everywhere
                                        'text-[16px] font-black tabular-nums',
                                        'tracking-[0.02em]',
                                        'border backdrop-blur-sm',
                                        '-translate-x-1/2 -translate-y-1/2',
                                        'shadow-lg shadow-cyan-500/10',
                                        'will-change-transform',
                                        isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed',
                                        // ✅ prevent disabled opacity wash-out
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
                                        handleStartLevel(level);
                                      }}
                                    >
                                      {level}
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

                <button onClick={handleBackToMenu} className="mt-4 w-full text-white/80 text-sm font-bold">
                  Geri
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
