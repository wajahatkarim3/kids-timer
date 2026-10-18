import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import KidsTimerNative, { Permissions } from '../../modules/kids-timer-native';

// Live permission state. Re-reads when the app comes back from system settings
// and polls while open, since settings can change without leaving the app.
export function usePermissions(pollMs = 2000): Permissions {
  const [perms, setPerms] = useState<Permissions>(() => KidsTimerNative.getPermissions());

  useEffect(() => {
    const refresh = () => {
      const next = KidsTimerNative.getPermissions();
      setPerms((prev) =>
        prev.overlay === next.overlay && prev.accessibility === next.accessibility ? prev : next,
      );
    };
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    const id = setInterval(refresh, pollMs);
    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, [pollMs]);

  return perms;
}
