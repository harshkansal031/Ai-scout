import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useApp } from '../context/AppProvider';
import AnimatedSplashOverlay from './AnimatedSplashOverlay';

/**
 * Branded animated splash until auth is ready. Does not use expo-splash-screen so
 * Metro bundles reliably when node_modules is missing/out-of-sync (e.g. Expo Go).
 * Native splash from app.json still shows until JS loads, then this overlay matches it.
 */
export default function SplashGate({ children }) {
  const { authLoading } = useApp();
  const [overlayMounted, setOverlayMounted] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (authLoading || !overlayMounted) return;

    const anim = Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 420,
      useNativeDriver: true,
    });

    anim.start(({ finished }) => {
      if (finished) setOverlayMounted(false);
    });

    return () => anim.stop();
  }, [authLoading, overlayMounted, fadeAnim]);

  return (
    <View style={styles.flex}>
      {children}
      {overlayMounted ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]} pointerEvents="auto">
          <AnimatedSplashOverlay />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
