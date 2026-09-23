/**
 * Lifecycle wiring tests (audit item): NetInfo → onlineManager and
 * AppState → focusManager. Each test builds a fresh wiring instance from
 * `createQueryLifecycle()`, so no module-scope state leaks between tests.
 * The mocks verify the *contract* — online state follows network
 * reachability, focus follows app state — and teardown detaches listeners.
 */
import { focusManager, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { AppState, type AppStateStatus } from 'react-native';
import { createQueryLifecycle } from './queryLifecycle';

type LifecycleState = { isConnected: boolean | null; isInternetReachable: boolean | null };

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn() },
}));

type NetInfoCallback = (state: LifecycleState) => void;

let netInfoListener: NetInfoCallback | null = null;
let netInfoUnsub: jest.Mock;
let appStateHandler: ((status: AppStateStatus) => void) | null = null;
let appStateRemove: jest.Mock;
let appStateSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();

  netInfoListener = null;
  appStateHandler = null;

  (NetInfo.addEventListener as jest.Mock).mockImplementation((cb: NetInfoCallback) => {
    netInfoListener = cb;
    netInfoUnsub = jest.fn(() => {
      netInfoListener = null; // real unsubscribe detaches the listener
    });
    return netInfoUnsub;
  });

  appStateSpy = jest.spyOn(AppState, 'addEventListener').mockImplementation(
    (_event: string, handler: (status: AppStateStatus) => void) => {
      appStateHandler = handler;
      appStateRemove = jest.fn(() => {
        appStateHandler = null; // real unsubscribe detaches the handler
      });
      return { remove: appStateRemove } as never;
    },
  );
});

afterEach(() => {
  appStateSpy.mockRestore();
  // Reset the shared managers so other suites start from the defaults.
  onlineManager.setOnline(true);
  focusManager.setFocused(true);
});

describe('createQueryLifecycle', () => {
  it('subscribes to NetInfo and AppState exactly once', () => {
    const wire = createQueryLifecycle();
    const unsub = wire();
    expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
    expect(AppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    unsub();
  });

  it('is idempotent: repeated wire() calls reuse the same subscription', () => {
    const wire = createQueryLifecycle();
    const first = wire();
    const second = wire();
    expect(second).toBe(first);
    expect(NetInfo.addEventListener).toHaveBeenCalledTimes(1);
    first();
  });

  it('marks the manager offline when the network drops', () => {
    const wire = createQueryLifecycle();
    const unsub = wire();
    onlineManager.setOnline(true);
    netInfoListener!({ isConnected: false, isInternetReachable: null });
    expect(onlineManager.isOnline()).toBe(false);
    unsub();
  });

  it('marks the manager offline when the network is up but unreachable', () => {
    const wire = createQueryLifecycle();
    const unsub = wire();
    // Captive-portal case: Wi-Fi associated but no internet — exactly where a
    // retry storm would otherwise begin.
    netInfoListener!({ isConnected: true, isInternetReachable: false });
    expect(onlineManager.isOnline()).toBe(false);
    unsub();
  });

  it('marks the manager online when connectivity returns', () => {
    const wire = createQueryLifecycle();
    const unsub = wire();
    netInfoListener!({ isConnected: false, isInternetReachable: null });
    expect(onlineManager.isOnline()).toBe(false);
    netInfoListener!({ isConnected: true, isInternetReachable: true });
    expect(onlineManager.isOnline()).toBe(true);
    unsub();
  });

  it('treats unknown reachability as online while connected', () => {
    const wire = createQueryLifecycle();
    const unsub = wire();
    // Some platforms report isInternetReachable: null — do not false-positive
    // an offline state for a connected device.
    netInfoListener!({ isConnected: true, isInternetReachable: null });
    expect(onlineManager.isOnline()).toBe(true);
    unsub();
  });

  it('unfocuses on background/inactive and refocuses on active', () => {
    const wire = createQueryLifecycle();
    const unsub = wire();
    expect(focusManager.isFocused()).toBe(true);

    appStateHandler!('background');
    expect(focusManager.isFocused()).toBe(false);

    appStateHandler!('inactive');
    expect(focusManager.isFocused()).toBe(false);

    appStateHandler!('active');
    expect(focusManager.isFocused()).toBe(true);
    unsub();
  });

  it('unsubscribes cleanly: listeners detach and later events are ignored', () => {
    const wire = createQueryLifecycle();
    const unsub = wire();
    unsub();
    expect(netInfoUnsub).toHaveBeenCalled();
    expect(appStateRemove).toHaveBeenCalled();

    // Late events after teardown must not flip the managers. The mock's
    // unsubscribe detaches the listener, so nothing remains to receive them.
    expect(netInfoListener).toBeNull();
    expect(appStateHandler).toBeNull();
  });

  it('can re-wire after teardown (HMR scenario)', () => {
    const wire = createQueryLifecycle();
    const first = wire();
    first();
    const second = wire();
    expect(NetInfo.addEventListener).toHaveBeenCalledTimes(2);
    second();
  });
});
