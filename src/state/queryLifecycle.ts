/**
 * TanStack Query React Native lifecycle wiring (audit item).
 *
 * TanStack Query's RN guidance: hook the platform's network state up to
 * `onlineManager` and foreground/background transitions up to `focusManager`
 * so that
 *
 *   • school Wi-Fi drops   → queries pause instead of retry-storming offline,
 *   • connection returns   → stale queries refetch in the background,
 *   • app backgrounds      → refocus refreshes stop,
 *   • app returns active   → stale critical data refetches.
 *
 * `createQueryLifecycle()` builds a wire function with its own subscription
 * state (tests build fresh instances); `wireQueryLifecycle()` is the app
 * singleton — idempotent, and its unsubscribe keeps HMR teardown clean.
 */
import { AppState, type AppStateStatus } from 'react-native';
import { focusManager, onlineManager } from '@tanstack/react-query';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

/**
 * Build the wiring. Returns an idempotent `wire()` whose result is an
 * unsubscribe function (calling it detaches both listeners).
 */
export function createQueryLifecycle(): () => () => void {
  let unsubscribe: (() => void) | null = null;

  return function wire(): () => void {
    if (unsubscribe) return unsubscribe;

    // Network state → onlineManager: Query pauses refetches while offline and
    // refreshes stale queries when connectivity returns. `isInternetReachable
    // !== false` also covers the captive-portal case (associated Wi-Fi, no
    // internet) — the point where a retry storm would otherwise begin.
    const unsubNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      onlineManager.setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    // App foreground/background → focusManager: backgrounded apps stop
    // refocus-driven refreshes; returning to active refetches stale queries.
    const appStateSub = AppState.addEventListener('change', (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    });

    unsubscribe = () => {
      unsubNetInfo();
      appStateSub.remove();
      unsubscribe = null;
    };
    return unsubscribe;
  };
}

/** App singleton: wire once for the app's lifetime (root layout useEffect). */
const wireSingleton = createQueryLifecycle();

export function wireQueryLifecycle(): () => void {
  return wireSingleton();
}
