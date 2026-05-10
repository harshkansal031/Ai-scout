import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ProgressRing from '../components/ProgressRing';
import WeekDots from '../components/WeekDots';
import FloatingChat from '../components/FloatingChat';
import { DAILY_TOPIC, PROGRESS, CONTINUE_LEARNING } from '../constants/mockData';
import { LIGHT, FONTS, SPACING, RADIUS } from '../constants/theme';

const { width } = Dimensions.get('window');
const C = LIGHT;

function AIScoutLogo() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{
        backgroundColor: C.primary,
        borderRadius: 8,
        paddingHorizontal: 7,
        paddingVertical: 3,
      }}>
        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13, letterSpacing: -0.3 }}>AI</Text>
      </View>
      <Text style={{ fontSize: 18, fontWeight: '800', color: C.text, letterSpacing: -0.5 }}>Scout</Text>
    </View>
  );
}

function StreakBadge({ streak }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#FFF7ED',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: '#FED7AA',
    }}>
      <Text style={{ fontSize: 14 }}>🔥</Text>
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#D97706' }}>{streak} day streak</Text>
    </View>
  );
}

function TodayTopicCard({ topic, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={{ borderRadius: RADIUS.xl, overflow: 'hidden', ...C.cardShadow }}>
      <LinearGradient
        colors={['#2563EB', '#1E40AF', '#1D4ED8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topicCard}
      >
        {/* Background decoration */}
        <View style={styles.topicDecor1} />
        <View style={styles.topicDecor2} />

        <View style={styles.topicContent}>
          <View>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: RADIUS.full,
              paddingHorizontal: 12,
              paddingVertical: 4,
              alignSelf: 'flex-start',
              marginBottom: 10,
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 12, fontWeight: '600' }}>Today's Topic</Text>
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800', letterSpacing: -0.5, lineHeight: 34 }}>
              {topic.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
              <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '500' }}>{topic.duration} min</Text>
            </View>
          </View>

          {/* AI Bot Illustration */}
          <View style={styles.illustrationContainer}>
            <View style={styles.illustrationBot}>
              <View style={styles.botBody}>
                <Ionicons name="hardware-chip" size={28} color="#2563EB" />
              </View>
              <View style={styles.botGlow} />
            </View>
            {/* Floating orbs */}
            <View style={[styles.orb, { top: 0, right: 10, width: 12, height: 12, backgroundColor: 'rgba(255,255,255,0.3)' }]} />
            <View style={[styles.orb, { top: 20, right: -5, width: 8, height: 8, backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={[styles.orb, { bottom: 5, right: 20, width: 10, height: 10, backgroundColor: 'rgba(255,255,255,0.25)' }]} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function ContinueLearningCard({ item, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.continueCard, C.shadow]} activeOpacity={0.85}>
      <View style={[styles.continueIcon, { backgroundColor: item.iconBg + '20' }]}>
        <View style={[styles.continueIconInner, { backgroundColor: item.iconBg }]}>
          <Text style={{ fontSize: 16 }}>{item.icon}</Text>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 3 }}>{item.title}</Text>
        <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: '500' }}>{item.timeLeft}</Text>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.progress * 100}%`, backgroundColor: item.iconBg }]} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TouchableOpacity style={[styles.botCircle, { borderColor: C.border }]}>
          <Ionicons name="hardware-chip-outline" size={16} color={C.primary} />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function TodayScreen({ navigation }) {
  const [notifCount] = useState(2);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <AIScoutLogo />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="search-outline" size={22} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { position: 'relative' }]}>
            <Ionicons name="notifications-outline" size={22} color={C.text} />
            {notifCount > 0 && (
              <View style={styles.notifDot}>
                <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '700' }}>{notifCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Today Heading + Streak */}
        <View style={styles.todayRow}>
          <View>
            <Text style={styles.todayTitle}>Today</Text>
            <Text style={{ fontSize: 14, color: C.textSub, fontWeight: '400', marginTop: 2 }}>Your daily AI topic</Text>
          </View>
          <StreakBadge streak={PROGRESS.streak} />
        </View>

        {/* Today's Topic Card */}
        <TodayTopicCard
          topic={DAILY_TOPIC}
          onPress={() => navigation.navigate('Lecture', { topic: DAILY_TOPIC })}
        />

        {/* Start Lesson Button */}
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => navigation.navigate('Lecture', { topic: DAILY_TOPIC })}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={[C.primary, C.primaryDark]}
            style={styles.startBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.startBtnText}>Start Lesson</Text>
            <Ionicons name="play" size={16} color="#FFF" style={{ marginLeft: 6 }} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Progress Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your progress</Text>
          <TouchableOpacity>
            <Text style={{ fontSize: 14, color: C.primary, fontWeight: '600' }}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.progressCard, C.shadow]}>
          <ProgressRing
            percent={PROGRESS.weeklyPercent}
            size={88}
            strokeWidth={9}
            color={C.primary}
            bgColor={C.border}
            textColor={C.text}
          />
          <View style={{ flex: 1, paddingLeft: 16 }}>
            <Text style={{ fontSize: 11, color: C.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>This week</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: C.text, marginTop: 4 }}>
              {PROGRESS.topicsCompleted} <Text style={{ fontSize: 14, color: C.textSub, fontWeight: '500' }}>of {PROGRESS.topicsTotal} topics</Text>
            </Text>
            <WeekDots days={PROGRESS.weekDays} activeColor={C.primary} inactiveColor={C.border} textColor={C.textMuted} />
          </View>
        </View>

        {/* Continue Learning */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Continue learning</Text>
        </View>

        {CONTINUE_LEARNING.map((item) => (
          <ContinueLearningCard
            key={item.id}
            item={item}
            onPress={() => navigation.navigate('Lecture', { topic: { ...DAILY_TOPIC, title: item.title, id: item.id } })}
          />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FloatingChat isDark={false} pageContext={{ type: 'today', topic: DAILY_TOPIC }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: 12,
    backgroundColor: LIGHT.bg,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LIGHT.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: LIGHT.border,
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: LIGHT.bg,
  },
  scrollContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: 8,
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  todayTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: LIGHT.text,
    letterSpacing: -0.5,
  },
  topicCard: {
    borderRadius: RADIUS.xl,
    padding: 22,
    marginBottom: 14,
    minHeight: 160,
  },
  topicDecor1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  topicDecor2: {
    position: 'absolute',
    bottom: -30,
    left: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  topicContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  illustrationContainer: {
    width: 80,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  illustrationBot: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  botBody: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  botGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  orb: {
    position: 'absolute',
    borderRadius: 100,
  },
  startBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: LIGHT.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  startBtnGrad: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: LIGHT.text,
    letterSpacing: -0.3,
  },
  progressCard: {
    backgroundColor: LIGHT.surface,
    borderRadius: RADIUS.lg,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: LIGHT.border,
  },
  continueCard: {
    backgroundColor: LIGHT.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: LIGHT.border,
  },
  continueIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueIconInner: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: LIGHT.border,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  botCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: LIGHT.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
