# 🎮 Labirent Oyunu

Profesyonel mimari ile geliştirilmiş, mobil-uyumlu hamle limitli labirent oyunu.

## 🏗️ Mimari

### Game Core (Domain Layer)
- **Pure TypeScript** - Framework bağımsız oyun mantığı
- **Deterministic** - Aynı seed → aynı labirent
- **Immutable State** - Reducer pattern ile state yönetimi
- **Undo Support** - History tabanlı geri alma

### Presentation Layer
- **React Components** - UI bileşenleri
- **Motion Animations** - Smooth geçişler
- **Responsive Design** - Mobil-first yaklaşım
- **Touch/Swipe** - Mobil kontroller

### Dosya Yapısı
```
src/
├── game/                    # Pure TS - Game Logic
│   ├── types.ts            # Type definitions
│   ├── generator.ts        # Maze generation (Recursive Backtracker)
│   ├── reducer.ts          # State management
│   ├── selectors.ts        # Memoized selectors
│   └── utils/seed.ts       # Seeded RNG
│
├── presentation/           # React UI Components
│   ├── GameScreen.tsx      # Main screen
│   ├── MazeGrid.tsx        # Grid renderer (memoized)
│   ├── Controls.tsx        # Game controls
│   └── overlays/
│       └── ResultDialog.tsx # Win/Lose overlay
│
└── __tests__/              # Unit tests
    ├── generator.test.ts
    └── reducer.test.ts
```

## 🚀 Nasıl Çalıştırırım?

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. Development Server
```bash
npm run dev
```

### 3. Build
```bash
npm run build
```

### 4. Test (Opsiyonel - vitest gerekli)
```bash
npm run test
```

## 🎯 Özellikler

### ✅ Oyun Mekanikleri
- ✨ Procedural maze generation (deterministic)
- 🎲 Seeded random - aynı seed aynı labirent
- 📊 Level progression - zorluk artar
- ↩️ Undo system - history tabanlı
- 🎮 Multiple controls:
  - ⌨️ Keyboard (WASD / Arrow keys)
  - 📱 Touch/Swipe
  - 🎮 On-screen D-pad

### 📈 Zorluk Sistemi
- Grid size artar (4→5→6...)
- Hamle limiti sıkılaşır
- Complexity değeri artar

### 🎨 UI/UX
- Gradient backgrounds
- Animated stars
- Smooth transitions
- Progress bar
- Win/Lose dialogs

## 🧪 Test Coverage

### Generator Tests
✅ Same seed → same maze  
✅ Different seeds → different mazes  
✅ Always solvable path  
✅ Grid size scales with level  

### Reducer Tests
✅ Initial state correct  
✅ Valid moves work  
✅ Walls block movement  
✅ Undo restores state  
✅ Win condition  
✅ Lose condition  

## 🔧 Teknolojiler

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite 6** - Build tool
- **Motion** - Animations
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 📝 Notlar

### Performance
- Grid cells memoized (React.memo)
- Selectors memoized (useMemo)
- Pure functions - predictable re-renders

### Scalability
- Game logic tamamen ayrı (framework independent)
- Pure functions - easy to test
- Type-safe - compile-time errors

### Code Quality
- TypeScript strict mode
- Clean architecture (separation of concerns)
- No unnecessary abstractions
- Readable and maintainable

## 🎮 Oyun Kontrolleri

### Keyboard
- `Arrow Keys` / `WASD` - Hareket
- `Z` - Geri Al (Undo)
- `R` - Yeniden Başla

### Mobil
- **Swipe** - Hareket
- **D-pad buttons** - Alternatif kontrol
- **Action buttons** - Geri Al / Yeniden

## 🏆 Kazanma/Kaybetme

- ✅ **Kazandın**: Hedefe (yeşil bayrak) ulaş
- ❌ **Kaybettin**: Hamle hakkın bitti

## 🔄 Next Steps (İsterseniz eklenebilir)

- [ ] LocalStorage - progress kaydetme
- [ ] Sound effects
- [ ] Achievements system
- [ ] Leaderboard
- [ ] Custom level editor
- [ ] Multiplayer race mode

---

**Geliştirici Notu**: Kod temiz, test edilebilir ve scalable. Unity kullanılmadı - saf TypeScript ile game engine yazıldı.
