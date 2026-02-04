# Maze Game — Full Project Documentation

This document consolidates product summary, user guide, technical documentation, and developer guide in one place.

**Contents**
1. Project Summary
2. Feature Overview
3. User Guide
4. Technical Architecture
5. Key Components
6. Game Data and Flow
7. Assets and Theming
8. Developer Guide
9. Testing Notes
10. Roadmap Ideas

**1. Project Summary**
Maze Game is a web-based puzzle game where the player slides through a maze to reach the exit while collecting coins and unlocking doors. The game includes a stage system, per-user progress storage, and a specialized ice-themed gameplay view for the Ice stage.

**2. Feature Overview**
- Deterministic maze generation with a single-solution path
- Sliding movement with wall/door collision
- Coins and doors tied by color for gating
- Move limit calculation based on solution length and level
- User login with local progress per username
- Stage selection with 5 stages and 50 levels each
- Ice stage with a fully custom in-level theme
- Pause overlay with resume and menu options

**3. User Guide**
- Start the game by entering a username and pressing **Giriş / Kayıt**.
- From the main menu, press **Oyna** to open stage selection.
- Choose a stage and then a level to play.
- Use keyboard or touch controls to move:
  - Keyboard: Arrow keys or WASD
  - Touch: Swipe in the desired direction
- Collect coins to unlock same-colored doors.
- Reach the exit within the move limit to win.
- Use **Duraklat** to pause and either resume or return to menu.

**4. Technical Architecture**
- Frontend: React + TypeScript
- Styling: Tailwind CSS classes inline in components
- Animations: `motion/react`
- Icons: `lucide-react`
- Build tooling: Vite

**5. Key Components**
- `src/src/presentation/GameScreen.tsx`
  - App-level screen controller
  - Auth, menu, stage selection, and gameplay states
  - Progress persistence (localStorage)
  - Pause overlay for in-game view
- `src/src/presentation/MazeGrid.tsx`
  - Renders the maze grid and all in-maze entities
  - Uses absolute overlays for player, exit, coins, doors
- `src/src/presentation/IceMaze.tsx`
  - Dedicated ice stage in-level screen
  - Uses background and frame assets to match ice theme
- `src/src/game/generator.ts`
  - Maze generation and special levels
  - Coin and door placement
  - BFS path calculation
- `src/src/game/reducer.ts`
  - State updates for moves, win/lose, undo, restart
- `src/src/game/types.ts`
  - Core game types and `MAX_LEVEL`

**6. Game Data and Flow**
- Levels are deterministic and derived from seed.
- `MAX_LEVEL = 250` supports 5 stages, each 50 levels.
- Stage boundaries:
  - Stage 1: 1–50 (Gezegen)
  - Stage 2: 51–100 (Buz)
  - Stage 3: 101–150 (Toprak)
  - Stage 4: 151–200 (Kum)
  - Stage 5: 201–250 (Volkan)
- Progress is stored per user:
  - `completedLevels: number[]`
  - `currentLevel: number`

**7. Assets and Theming**
- Base UI theme remains consistent for all menus and non-ice stages.
- Ice stage has a fully custom in-level presentation.
- Ice assets location:
  - `public/ice/ice_bg.png`
  - `public/ice/ice_left.png`
  - `public/ice/ice_top.png`
  - `public/ice/ice_frame.png`
- Ice stage layout is applied only when the current level is within 51–100.

**8. Developer Guide**
- Install dependencies:
  - `npm install`
- Run the app:
  - `npm run dev`
- Build:
  - `npm run build`

**9. Testing Notes**
- Unit tests exist for generator and reducer logic:
  - `src/src/__tests__/generator.test.ts`
  - `src/src/__tests__/reducer.test.ts`
- There is no automated UI snapshot testing configured.

**10. Roadmap Ideas**
- Add a proper “pause” state to lock movement beyond UI overlay.
- Add mobile-friendly on-screen controls for non-swipe users.
- Create additional stage-specific in-level themes.
- Add sound effects and ambient music.
