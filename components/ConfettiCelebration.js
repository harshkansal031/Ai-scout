import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ConfettiCelebration({ visible, streakCount, topicTitle, onClose, colors }) {
  const cardScale = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Generate 40 confetti particles
  const particles = useRef(
    Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      animY: new Animated.Value(-50),
      animX: new Animated.Value(0),
      animRotate: new Animated.Value(0),
      size: Math.random() * 8 + 6,
      // Curated glowing neon color palette
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'][i % 6],
      left: Math.random() * SCREEN_WIDTH,
      drift: (Math.random() - 0.5) * 120,
      duration: Math.random() * 1200 + 1800,
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // 1. Fade in overlay and bounce the streak card
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();

      // 2. Animate all confetti particles falling down
      particles.forEach((p) => {
        p.animY.setValue(-50);
        p.animX.setValue(0);
        p.animRotate.setValue(0);

        Animated.parallel([
          Animated.timing(p.animY, {
            toValue: SCREEN_HEIGHT + 50,
            duration: p.duration,
            useNativeDriver: true,
          }),
          Animated.timing(p.animX, {
            toValue: p.drift,
            duration: p.duration,
            useNativeDriver: true,
          }),
          Animated.timing(p.animRotate, {
            toValue: Math.random() * 720,
            duration: p.duration,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Fade out
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      {/* Fall Confetti Particles */}
      {particles.map((p) => (
        <Animated.View
          key={p.id}
          style={[
            styles.particle,
            {
              left: p.left,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.id % 2 === 0 ? p.size / 2 : 2, // circles and squares
              transform: [
                { translateY: p.animY },
                { translateX: p.animX },
                { rotate: p.animRotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  })
                },
              ],
            },
          ]}
        />
      ))}

      {/* Streak Celebration Card */}
      <Animated.View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, transform: [{ scale: cardScale }] }]}>
        <View style={styles.badgeWrapper}>
          <Text style={styles.fireEmoji}>🔥</Text>
          <View style={styles.glowRing} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {streakCount || 1} Day Streak!
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.textSub }]}>
          Awesome job! You completed today's learning milestone.
        </Text>

        <View style={[styles.topicBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Ionicons name="trophy-outline" size={16} color="#F59E0B" />
          <Text style={[styles.topicTitle, { color: colors.text }]} numberOfLines={2}>
            {topicTitle}
          </Text>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.9}>
          <Text style={styles.closeBtnText}>Continue Learning</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 11, 20, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    paddingHorizontal: SPACING.base,
  },
  particle: {
    position: 'absolute',
    top: 0,
    opacity: 0.85,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  badgeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    height: 90,
    marginBottom: 16,
  },
  fireEmoji: {
    fontSize: 54,
    zIndex: 2,
  },
  glowRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    transform: [{ scale: 1.1 }],
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  topicBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    width: '100%',
    marginBottom: 24,
  },
  topicTitle: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  closeBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  closeBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 15,
  },
});
