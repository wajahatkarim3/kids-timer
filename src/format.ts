// Small formatting helpers shared by screens.

/** 29:57 or 1:05:00 */
export function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${String(m).padStart(2, '0')}:${ss}`;
}

/** 4:58 (no leading zero on minutes) */
export function shortClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** 2 h, 1 h 30 min, 45 min */
export function minutesLabel(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function msToMin(ms: number): number {
  return Math.floor(ms / 60000);
}

/** 1:39 AM */
export function timeOfDay(t: number): string {
  const d = new Date(t);
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "2026-10-19" -> "Mon" (local date) */
export function weekday(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return DAYS[new Date(y, m - 1, d).getDay()];
}

/** Grown-up mode "until" value from the engine; Long.MAX means "until turned off". */
export function isForever(until: number): boolean {
  return until > 8e15;
}
