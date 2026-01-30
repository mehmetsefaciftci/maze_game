import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, Trophy, Sparkles, User, Flag, Skull, Coins, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Maze layout: 0 = path, 1 = wall, 4 = coin, 5 = enemy spawn
const LEVELS = [
  {
    maze: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 4, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
      [1, 0, 1, 4, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 4, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
      [1, 5, 0, 0, 0, 4, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    start: { x: 1, y: 1 },
    end: { x: 8, y: 8 },
    enemies: [
      { start: {x: 1, y: 7}, path: [{x: 1, y: 7}, {x: 2, y: 7}, {x: 3, y: 7}, {x: 3, y: 6}, {x: 3, y: 5}, {x: 2, y: 5}, {x: 1, y: 5}, {x: 1, y: 6}] }
    ],
    teleportCost: 5
  },
  {
    maze: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 4, 0, 1, 0, 0, 0, 4, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 5, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 4, 1],
      [1, 0, 0, 4, 0, 5, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 4, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    start: { x: 1, y: 1 },
    end: { x: 10, y: 9 },
    enemies: [
      { start: {x: 8, y: 3}, path: [{x: 8, y: 3}, {x: 8, y: 4}, {x: 8, y: 5}, {x: 7, y: 5}, {x: 6, y: 5}, {x: 6, y: 4}, {x: 6, y: 3}, {x: 7, y: 3}] },
      { start: {x: 5, y: 5}, path: [{x: 5, y: 5}, {x: 6, y: 5}, {x: 7, y: 5}, {x: 7, y: 6}, {x: 7, y: 7}, {x: 6, y: 7}, {x: 5, y: 7}, {x: 5, y: 6}] }
    ],
    teleportCost: 8
  }
];

type Position = { x: number; y: number };

export default function App() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [playerPos, setPlayerPos] = useState<Position>(LEVELS[0].start);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [collectedCoins, setCollectedCoins] = useState<Set<string>>(new Set());
  const [totalCoins, setTotalCoins] = useState(0);
  const [teleportCharges, setTeleportCharges] = useState(0);
  const [enemyPositions, setEnemyPositions] = useState<{pos: Position, pathIndex: number}[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const level = LEVELS[currentLevel];
  const MAZE = level.maze;

  // Count total coins in level
  const totalCoinsInLevel = MAZE.flat().filter(cell => cell === 4).length;
  const coinsCollectedInLevel = Array.from(collectedCoins).filter(key => {
    const [x, y] = key.split('-').map(Number);
    return MAZE[y]?.[x] === 4;
  }).length;

  // Initialize enemy positions
  useEffect(() => {
    const initialPositions = level.enemies.map(enemy => ({
      pos: enemy.start,
      pathIndex: 0
    }));
    setEnemyPositions(initialPositions);
  }, [currentLevel]);

  // Move enemies step by step
  useEffect(() => {
    const interval = setInterval(() => {
      if (won || gameOver) return;
      
      setEnemyPositions(prevPositions => 
        prevPositions.map((enemyState, index) => {
          const enemy = level.enemies[index];
          const nextIndex = (enemyState.pathIndex + 1) % enemy.path.length;
          return {
            pos: enemy.path[nextIndex],
            pathIndex: nextIndex
          };
        })
      );
    }, 800); // Move every 800ms for smooth step-by-step movement

    return () => clearInterval(interval);
  }, [won, gameOver, currentLevel]);

  // Check collision with enemies
  useEffect(() => {
    const collision = enemyPositions.some(
      enemy => enemy.pos.x === playerPos.x && enemy.pos.y === playerPos.y
    );
    if (collision && !gameOver && !won) {
      setGameOver(true);
    }
  }, [playerPos, enemyPositions, gameOver, won]);

  // Check win condition - must collect all coins first
  useEffect(() => {
    if (playerPos.x === level.end.x && playerPos.y === level.end.y && coinsCollectedInLevel === totalCoinsInLevel) {
      setWon(true);
    }
  }, [playerPos, coinsCollectedInLevel, totalCoinsInLevel]);

  const movePlayer = (dx: number, dy: number) => {
    if (won || gameOver) return;

    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;

    if (
      newY >= 0 &&
      newY < MAZE.length &&
      newX >= 0 &&
      newX < MAZE[0].length
    ) {
      const cell = MAZE[newY][newX];
      
      // Check if it's a wall
      if (cell === 1) return;
      
      // Check if it's a coin
      if (cell === 4) {
        const coinKey = `${newX}-${newY}`;
        if (!collectedCoins.has(coinKey)) {
          setCollectedCoins(new Set([...collectedCoins, coinKey]));
          setTotalCoins(totalCoins + 1);
        }
      }
      
      setPlayerPos({ x: newX, y: newY });
      setMoves(moves + 1);
    }
  };

  const useTeleport = () => {
    if (teleportCharges > 0 && !won && !gameOver) {
      // Teleport to a safe position near the goal
      const teleportPos = { 
        x: level.end.x - 1, 
        y: level.end.y - 1 
      };
      
      // Check if teleport position is valid
      if (MAZE[teleportPos.y][teleportPos.x] !== 1) {
        setPlayerPos(teleportPos);
        setTeleportCharges(teleportCharges - 1);
        setMoves(moves + 1);
      }
    }
  };

  const buyTeleport = () => {
    if (totalCoins >= level.teleportCost) {
      setTotalCoins(totalCoins - level.teleportCost);
      setTeleportCharges(teleportCharges + 1);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (won || gameOver) return;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        movePlayer(0, -1);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        movePlayer(0, 1);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        movePlayer(-1, 0);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        movePlayer(1, 0);
        break;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || won || gameOver) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const minSwipeDistance = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        movePlayer(deltaX > 0 ? 1 : -1, 0);
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        movePlayer(0, deltaY > 0 ? 1 : -1);
      }
    }

    touchStartRef.current = null;
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [playerPos, moves, won, gameOver]);

  const resetGame = () => {
    setPlayerPos(level.start);
    setMoves(0);
    setWon(false);
    setGameOver(false);
    setCollectedCoins(new Set());
    const initialPositions = level.enemies.map(enemy => ({
      pos: enemy.start,
      pathIndex: 0
    }));
    setEnemyPositions(initialPositions);
  };

  const nextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      setCurrentLevel(currentLevel + 1);
      setPlayerPos(LEVELS[currentLevel + 1].start);
      setMoves(0);
      setWon(false);
      setGameOver(false);
      setCollectedCoins(new Set());
      const initialPositions = LEVELS[currentLevel + 1].enemies.map(enemy => ({
        pos: enemy.start,
        pathIndex: 0
      }));
      setEnemyPositions(initialPositions);
    } else {
      // Game completed
      resetGame();
      setCurrentLevel(0);
      setTotalCoins(0);
      setTeleportCharges(0);
    }
  };

  return (
    <div className="h-dvh w-full flex flex-col bg-gradient-to-b from-indigo-950 via-purple-950 to-indigo-900 overflow-hidden select-none relative">
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

      {/* Header */}
      <div className="px-4 py-4 relative z-10">
        <div className="flex items-center justify-between max-w-md mx-auto gap-2">
          {/* Moves */}
          <motion.div 
            key={moves}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 text-white px-4 py-2 rounded-2xl shadow-2xl relative"
            style={{
              boxShadow: '0 0 30px rgba(251, 191, 36, 0.5), 0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <div className="text-2xl font-black tabular-nums">{moves}</div>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent rounded-2xl"></div>
          </motion.div>

          {/* Coins Progress */}
          <motion.div 
            key={`${coinsCollectedInLevel}-${totalCoinsInLevel}`}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white px-4 py-2 rounded-2xl shadow-2xl relative flex items-center gap-2"
            style={{
              boxShadow: '0 0 25px rgba(251, 191, 36, 0.5), 0 4px 15px rgba(0,0,0,0.3)',
            }}
          >
            <Coins className="w-5 h-5" />
            <div className="text-xl font-black tabular-nums">{coinsCollectedInLevel}/{totalCoinsInLevel}</div>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent rounded-2xl"></div>
          </motion.div>

          {/* Total Coins */}
          <motion.div 
            key={totalCoins}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white px-3 py-2 rounded-2xl shadow-2xl relative flex items-center gap-1"
            style={{
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.5), 0 4px 15px rgba(0,0,0,0.3)',
            }}
          >
            <Coins className="w-4 h-4" />
            <div className="text-xl font-black tabular-nums">{totalCoins}</div>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent rounded-2xl"></div>
          </motion.div>

          {/* Teleport Shop */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={buyTeleport}
            disabled={totalCoins < level.teleportCost}
            className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white px-3 py-2 rounded-2xl shadow-2xl relative disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            style={{
              boxShadow: '0 0 25px rgba(124, 58, 237, 0.4), 0 4px 15px rgba(0,0,0,0.3)',
            }}
          >
            <Zap className="w-4 h-4" fill="currentColor" />
            <span className="text-xs font-black">{level.teleportCost}</span>
            {teleportCharges > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-indigo-950">
                {teleportCharges}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-2xl"></div>
          </motion.button>

          {/* Reset */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetGame}
            className="bg-gradient-to-br from-pink-600 to-red-600 text-white p-2.5 rounded-2xl shadow-2xl relative"
            style={{
              boxShadow: '0 0 25px rgba(236, 72, 153, 0.4), 0 4px 15px rgba(0,0,0,0.3)',
            }}
            aria-label="Reset"
          >
            <RotateCcw className="w-5 h-5" />
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-2xl"></div>
          </motion.button>
        </div>

        {/* Level indicator and Teleport usage button */}
        <div className="flex items-center justify-between max-w-md mx-auto mt-3 gap-2">
          <div className="text-white/80 text-sm font-black">
            SEVİYE {currentLevel + 1} / {LEVELS.length}
          </div>
          
          {teleportCharges > 0 && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={useTeleport}
              className="bg-gradient-to-br from-violet-500 to-purple-600 text-white px-4 py-1.5 rounded-xl shadow-xl relative flex items-center gap-2"
              style={{
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)',
              }}
            >
              <Zap className="w-4 h-4" fill="currentColor" />
              <span className="text-sm font-black">IŞINLAN</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent rounded-xl"></div>
            </motion.button>
          )}
        </div>
      </div>

      {/* Main Game Area */}
      <div 
        className="flex-1 flex items-center justify-center p-4 relative z-10"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {/* Glow effect behind maze */}
          <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-3xl scale-110"></div>
          
          <div className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-sm rounded-3xl p-3 shadow-2xl relative border-2 border-purple-500/30">
            <div 
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${MAZE[0].length}, 1fr)` }}
            >
              {MAZE.map((row, y) =>
                row.map((cell, x) => {
                  const isPlayer = playerPos.x === x && playerPos.y === y;
                  const isGoal = level.end.x === x && level.end.y === y;
                  const isWall = cell === 1;
                  const isCoin = cell === 4;
                  const isEnemy = enemyPositions.some(enemy => enemy.pos.x === x && enemy.pos.y === y);
                  const coinKey = `${x}-${y}`;
                  const coinCollected = collectedCoins.has(coinKey);

                  return (
                    <motion.div
                      key={`${x}-${y}`}
                      initial={{ scale: 0, rotateY: 180 }}
                      animate={{ scale: 1, rotateY: 0 }}
                      transition={{ delay: (x + y) * 0.005, type: "spring" }}
                      className={`relative w-6 h-6 sm:w-7 sm:h-7 transition-all duration-150 ${
                        isWall
                          ? 'bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-lg shadow-lg border-2 border-purple-400/50'
                          : 'bg-gradient-to-br from-indigo-950/50 to-purple-950/50 rounded-lg border border-purple-800/30'
                      }`}
                      style={isWall ? {
                        boxShadow: 'inset 0 -2px 8px rgba(0,0,0,0.4), inset 0 2px 8px rgba(255,255,255,0.2), 0 0 15px rgba(168, 85, 247, 0.3)',
                      } : {}}
                    >
                      {/* Coin */}
                      {isCoin && !coinCollected && (
                        <motion.div
                          animate={{ 
                            rotateY: [0, 360],
                            y: [-1, 1, -1]
                          }}
                          transition={{ 
                            rotateY: { duration: 2, repeat: Infinity, ease: "linear" },
                            y: { duration: 1.5, repeat: Infinity }
                          }}
                          className="size-full flex items-center justify-center"
                        >
                          <div
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center border-2 border-yellow-200"
                            style={{
                              boxShadow: '0 0 12px rgba(251, 191, 36, 0.8)',
                            }}
                          >
                            <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                          </div>
                        </motion.div>
                      )}

                      {/* Enemy */}
                      {isEnemy && (
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                          }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="size-full flex items-center justify-center"
                        >
                          <div
                            className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center border-2 border-red-300"
                            style={{
                              boxShadow: '0 0 15px rgba(239, 68, 68, 0.9)',
                            }}
                          >
                            <Skull className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" strokeWidth={3} />
                          </div>
                        </motion.div>
                      )}

                      {/* Player */}
                      <AnimatePresence>
                        {isPlayer && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className="size-full flex items-center justify-center"
                          >
                            <motion.div 
                              animate={{ 
                                y: [-1, 1, -1],
                              }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                              className="relative w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 rounded-full flex items-center justify-center border-2 border-cyan-200"
                              style={{
                                boxShadow: '0 0 20px rgba(34, 211, 238, 0.8), inset 0 2px 4px rgba(255,255,255,0.4)',
                              }}
                            >
                              <User className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" strokeWidth={3} />
                              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full"></div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Goal */}
                      {isGoal && !isPlayer && (
                        <motion.div 
                          animate={{ 
                            y: [-1, 1, -1],
                          }}
                          transition={{ 
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="size-full flex items-center justify-center"
                        >
                          <div
                            className={`relative w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 ${
                              coinsCollectedInLevel === totalCoinsInLevel 
                                ? 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 border-green-200' 
                                : 'bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700 border-gray-400'
                            }`}
                            style={{
                              boxShadow: coinsCollectedInLevel === totalCoinsInLevel 
                                ? '0 0 20px rgba(52, 211, 153, 0.8), inset 0 2px 4px rgba(255,255,255,0.4)'
                                : '0 0 10px rgba(107, 114, 128, 0.5), inset 0 2px 4px rgba(255,255,255,0.2)',
                            }}
                          >
                            <Flag className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" strokeWidth={3} fill="white" />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full"></div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gradient-to-br from-red-600 via-orange-600 to-red-700 rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl relative overflow-hidden"
              style={{
                boxShadow: '0 0 60px rgba(239, 68, 68, 0.8), 0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-white"
                style={{
                  boxShadow: '0 0 40px rgba(239, 68, 68, 0.8)',
                }}
              >
                <Skull className="w-12 h-12 text-white" strokeWidth={3} />
              </motion.div>

              <h2 className="text-5xl font-black text-white mb-6 drop-shadow-lg" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                Oyun Bitti!
              </h2>
              
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGame}
                className="w-full bg-white text-red-600 py-4 rounded-2xl font-black text-lg shadow-2xl transition-all"
                style={{
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                }}
              >
                Tekrar Dene
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory Modal */}
      <AnimatePresence>
        {won && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl relative overflow-hidden"
              style={{
                boxShadow: '0 0 60px rgba(168, 85, 247, 0.8), 0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              {/* Animated particles */}
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                  initial={{ x: '50%', y: '50%', scale: 0 }}
                  animate={{
                    x: `${50 + (Math.random() - 0.5) * 200}%`,
                    y: `${50 + (Math.random() - 0.5) * 200}%`,
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}

              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative w-24 h-24 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-white"
                style={{
                  boxShadow: '0 0 40px rgba(250, 204, 21, 0.8)',
                }}
              >
                <Trophy className="w-12 h-12 text-white" strokeWidth={3} />
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-4 border-yellow-200"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <h2 className="text-5xl font-black text-white mb-3 drop-shadow-lg" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                  Tebrikler!
                </h2>
                
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                  className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 my-6 border-2 border-white/30"
                >
                  <div className="text-sm text-white/90 mb-1 flex items-center justify-center gap-2 font-bold">
                    <Sparkles className="w-4 h-4" />
                    HAMLE
                  </div>
                  <motion.div 
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-6xl font-black text-white tabular-nums drop-shadow-2xl"
                  >
                    {moves}
                  </motion.div>
                </motion.div>
                
                <div className="flex gap-2">
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetGame}
                    className="flex-1 bg-white/20 backdrop-blur-sm text-white py-4 rounded-2xl font-black text-lg shadow-2xl transition-all border-2 border-white/30"
                  >
                    Tekrar Oyna
                  </motion.button>
                  
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={nextLevel}
                    className="flex-1 bg-white text-purple-600 py-4 rounded-2xl font-black text-lg shadow-2xl transition-all"
                    style={{
                      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    }}
                  >
                    {currentLevel < LEVELS.length - 1 ? 'Sonraki Seviye' : 'Baştan Başla'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Classic Control Buttons */}
      <div className="pb-8 px-4 relative z-10">
        <div className="max-w-md mx-auto">
          <div className="flex flex-col items-center gap-3">
            {/* Up button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => movePlayer(0, -1)}
              className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center transition-all touch-manipulation disabled:opacity-30 shadow-2xl border-3 border-cyan-300/50"
              disabled={won || gameOver}
              style={{
                boxShadow: '0 0 25px rgba(34, 211, 238, 0.6), inset 0 3px 10px rgba(255,255,255,0.3)',
              }}
              aria-label="Up"
            >
              <ChevronUp className="w-9 h-9 text-white drop-shadow-lg" strokeWidth={4} />
            </motion.button>

            {/* Left, Down, Right buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => movePlayer(-1, 0)}
                className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center transition-all touch-manipulation disabled:opacity-30 shadow-2xl border-3 border-cyan-300/50"
                disabled={won || gameOver}
                style={{
                  boxShadow: '0 0 25px rgba(34, 211, 238, 0.6), inset 0 3px 10px rgba(255,255,255,0.3)',
                }}
                aria-label="Left"
              >
                <ChevronLeft className="w-9 h-9 text-white drop-shadow-lg" strokeWidth={4} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => movePlayer(0, 1)}
                className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center transition-all touch-manipulation disabled:opacity-30 shadow-2xl border-3 border-cyan-300/50"
                disabled={won || gameOver}
                style={{
                  boxShadow: '0 0 25px rgba(34, 211, 238, 0.6), inset 0 3px 10px rgba(255,255,255,0.3)',
                }}
                aria-label="Down"
              >
                <ChevronDown className="w-9 h-9 text-white drop-shadow-lg" strokeWidth={4} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => movePlayer(1, 0)}
                className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center transition-all touch-manipulation disabled:opacity-30 shadow-2xl border-3 border-cyan-300/50"
                disabled={won || gameOver}
                style={{
                  boxShadow: '0 0 25px rgba(34, 211, 238, 0.6), inset 0 3px 10px rgba(255,255,255,0.3)',
                }}
                aria-label="Right"
              >
                <ChevronRight className="w-9 h-9 text-white drop-shadow-lg" strokeWidth={4} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
