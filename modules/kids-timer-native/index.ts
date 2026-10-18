import { NativeModule, requireNativeModule } from 'expo-modules-core';

export type Permissions = {
  accessibility: boolean;
  admin: boolean;
};

export type BlockKind = 'timesUp' | 'break' | 'daily';
export type WhenUp = 'block' | 'off';
export type GrownUpMode = '2h' | '4h' | 'midnight' | 'forever';

export type EngineSettings = {
  secret: number;
  dailyMin: number;
  sessionMin: number;
  breakMin: number;
  whenUp: WhenUp;
  counted: string[];
  onboarded: boolean;
};

export type EngineState = {
  now: number;
  settings: EngineSettings;
  sleep: { running: boolean; paused: boolean; remainingMs: number; durationMin: number };
  day: {
    usedMs: number;
    limitMs: number;
    extraMs: number;
    sessionMs: number;
    sessionLimitMs: number;
    breakUntil: number;
    lastApp: string | null;
    lastAppLabel: string | null;
    perApp: { pkg: string; label: string; ms: number }[];
  };
  grownUntil: number;
  grownActive: boolean;
  block: BlockKind | null;
  foreground: string | null;
  week: { key: string; totalMs: number }[];
  events: { t: number; text: string }[];
};

export type InstalledApp = { pkg: string; label: string; icon: string };

type Events = {
  onState(state: EngineState): void;
  onDigit(event: { digit: number }): void;
};

declare class KidsTimerNativeModule extends NativeModule<Events> {
  getState(): EngineState;
  takePendingBlock(): BlockKind | null;
  clearBlock(): void;
  setSettings(patch: Partial<EngineSettings>): void;
  getItem(key: string): string | null;
  setItem(key: string, value: string | null): void;

  startSleep(minutes: number): void;
  pauseSleep(): void;
  resumeSleep(): void;
  adjustSleep(deltaMin: number): void;
  stopSleep(): void;

  setGrownUp(mode: GrownUpMode): void;
  endGrownUp(): void;
  addTime(minutes: number, kind: BlockKind): void;
  skipBreak(): void;
  continueWatching(): boolean;

  goHome(): void;
  backToWatching(): void;
  openApp(pkg: string): boolean;
  getInstalledApps(): Promise<InstalledApp[]>;
  turnScreenOff(): boolean;

  getPermissions(): Permissions;
  openAccessibilitySettings(): boolean;
  requestAdmin(): boolean;
  removeAdmin(): boolean;
}

const KidsTimerNative = requireNativeModule<KidsTimerNativeModule>('KidsTimerNative');

export default KidsTimerNative;
