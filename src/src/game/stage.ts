// src/game/stage.ts
import type { StageTheme } from './types';
import { THEMES, getThemeForLevel } from '../themes';

export function getStageTheme(level: number): StageTheme {
  return getThemeForLevel(level);
}

export function getStageRange(stage: StageTheme): { start: number; end: number } {
  return THEMES[stage].levelRange;
}

export function toStageLocalLevel(level: number): number {
  const stage = getStageTheme(level);
  const range = getStageRange(stage);
  return level - range.start + 1;
}
