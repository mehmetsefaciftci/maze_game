import { GameScreen } from './src/presentation/GameScreen';
import { ThemeProvider } from './src/themes/ThemeProvider';

export default function App() {
  return (
    <ThemeProvider>
      <GameScreen />
    </ThemeProvider>
  );
}
