import React, { createContext, useContext, useRef } from 'react';
import { BlurTargetView, BlurView } from 'expo-blur';
import { Platform, StyleSheet, type StyleProp, type View, type ViewStyle } from 'react-native';

const BlurTargetContext = createContext<React.RefObject<View | null> | null>(null);

/** Provides the screen content Android's native blur effect samples. */
export function NativeBlurBackdrop({ children }: { children: React.ReactNode }) {
  const target = useRef<View>(null);
  return (
    <BlurTargetView ref={target} style={styles.target}>
      <BlurTargetContext.Provider value={target}>{children}</BlurTargetContext.Provider>
    </BlurTargetView>
  );
}

/** Translucent native material for app chrome; keep sensitive text on opaque surfaces. */
export function GlassSurface({ style }: { style?: StyleProp<ViewStyle> }) {
  const blurTarget = useContext(BlurTargetContext);
  return (
    <BlurView
      pointerEvents="none"
      intensity={64}
      tint="light"
      blurTarget={Platform.OS === 'android' ? blurTarget ?? undefined : undefined}
      blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined}
      style={[styles.surface, style]}
    />
  );
}

const styles = StyleSheet.create({
  target: { flex: 1 },
  surface: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.9)',
  },
});
