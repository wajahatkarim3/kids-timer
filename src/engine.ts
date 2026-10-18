import { useEffect, useState } from 'react';
import KidsTimerNative, { EngineState } from '../modules/kids-timer-native';

export { KidsTimerNative as native };

// Live engine state. The native engine pushes a snapshot every second.
export function useEngine(): EngineState {
  const [state, setState] = useState<EngineState>(() => KidsTimerNative.getState());

  useEffect(() => {
    const sub = KidsTimerNative.addListener('onState', setState);
    setState(KidsTimerNative.getState());
    return () => sub.remove();
  }, []);

  return state;
}
