import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import type { BlockKind } from '../modules/kids-timer-native';

export type LockReason = 'open' | 'timer' | 'addTime';

export type Route =
  | { name: 'welcome' }
  | { name: 'permOverlay' }
  | { name: 'permA11y' }
  | { name: 'lookAway' }
  | { name: 'secret'; onboarding: boolean }
  | { name: 'apps'; onboarding: boolean }
  | { name: 'allSet' }
  | { name: 'lock'; reason: LockReason; then: Route }
  | { name: 'home' }
  | { name: 'grownUp' }
  | { name: 'grownUpActive' }
  | { name: 'limits' }
  | { name: 'usage' }
  | { name: 'setupCheck' }
  | { name: 'running' }
  | { name: 'block'; kind: BlockKind }
  | { name: 'addTime'; kind: BlockKind }
  | { name: 'skipBreak' };

type Nav = {
  route: Route;
  push(route: Route): void;
  replace(route: Route): void;
  reset(route: Route): void;
  back(): void;
  /** Screens can take over the remote Back button (return true to consume). */
  setBackHandler(handler: (() => boolean) | null): void;
};

const NavContext = createContext<Nav | null>(null);

// A tiny stack router: TV screens are full-page, one at a time.
export function NavProvider({ initial, children }: { initial: Route; children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([initial]);
  const backHandler = useRef<(() => boolean) | null>(null);

  const push = useCallback((r: Route) => setStack((s) => [...s, r]), []);
  const replace = useCallback((r: Route) => setStack((s) => [...s.slice(0, -1), r]), []);
  const reset = useCallback((r: Route) => setStack([r]), []);
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const setBackHandler = useCallback((h: (() => boolean) | null) => {
    backHandler.current = h;
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (backHandler.current?.()) return true;
      if (stack.length > 1) {
        back();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, back]);

  const value = useMemo(
    () => ({ route: stack[stack.length - 1], push, replace, reset, back, setBackHandler }),
    [stack, push, replace, reset, back, setBackHandler],
  );
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): Nav {
  const nav = useContext(NavContext);
  if (!nav) throw new Error('useNav outside NavProvider');
  return nav;
}

/** Override the remote Back button while this screen is shown. */
export function useBack(handler: () => boolean) {
  const { setBackHandler } = useNav();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    setBackHandler(() => ref.current());
    return () => setBackHandler(null);
  }, [setBackHandler]);
}
