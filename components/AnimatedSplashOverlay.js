import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { DARK } from '../constants/theme';

/**
 * Launch overlay: same robot asset + float/tilt motion as FloatingChat FAB idle loop.
 */
export default function AnimatedSplashOverlay() {
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(hoverAnim, {
          toValue: -6,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(hoverAnim, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    );

    const tilt = Animated.loop(
      Animated.sequence([
        Animated.timing(tiltAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(tiltAnim, {
          toValue: -1,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(tiltAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    float.start();
    tilt.start();

    return () => {
      float.stop();
      tilt.stop();
    };
  }, [hoverAnim, tiltAnim]);

  const tiltRotate = tiltAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-8deg', '8deg'],
  });

  return (
    <View style={styles.root}>
      <Animated.View
        style={{
          alignItems: 'center',
          transform: [{ translateY: hoverAnim }, { rotate: tiltRotate }],
        }}
      >
        <Image
          source={require('../constants/chatbot-icon.png')}
          style={{ width: 100, height: 100, resizeMode: 'contain' }}
        />
      </Animated.View>
      <Text style={styles.wordmark}>
        Scout <Text style={styles.ai}>AI</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DARK.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    zIndex: 9999,
    elevation: 9999,
  },
  wordmark: {
    fontSize: 28,
    fontWeight: '800',
    color: DARK.text,
    letterSpacing: 0.3,
  },
  ai: {
    color: DARK.primary,
  },
});
