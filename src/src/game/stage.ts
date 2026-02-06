// src/game/stage.ts
import type { StageTheme } from './types';

export function getStageTheme(level: number): StageTheme {
  if (level <= 50) return 'gezegen';
  if (level <= 100) return 'buz';
  if (level <= 150) return 'toprak';
  if (level <= 200) return 'kum';
  return 'volkan';
}

export function getStageRange(stage: StageTheme): { start: number; end: number } {
  switch (stage) {
    case 'gezegen': return { start: 1, end: 50 };
    case 'buz': return { start: 51, end: 100 };
    case 'toprak': return { start: 101, end: 150 };
    case 'kum': return { start: 151, end: 200 };
    case 'volkan': return { start: 201, end: 250 };
  }
}

export function toStageLocalLevel(level: number): number {
  return ((level - 1) % 50) + 1; // 1..50
}
