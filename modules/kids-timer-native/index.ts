import { EventSubscription, NativeModule, requireNativeModule } from 'expo-modules-core';

export type Permissions = {
  overlay: boolean;
  accessibility: boolean;
};

type Events = {
  onForegroundApp(event: { packageName: string }): void;
};

declare class KidsTimerNativeModule extends NativeModule<Events> {
  getPermissions(): Permissions;
  getForegroundApp(): string | null;
  openOverlaySettings(): boolean;
  openAccessibilitySettings(): boolean;
}

const KidsTimerNative = requireNativeModule<KidsTimerNativeModule>('KidsTimerNative');

export default KidsTimerNative;

export function addForegroundAppListener(
  listener: (packageName: string) => void,
): EventSubscription {
  return KidsTimerNative.addListener('onForegroundApp', (e) => listener(e.packageName));
}
