import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import ProgressRing from '../components/ProgressRing';
import WeekDots from '../components/WeekDots';
import FloatingChat from '../components/FloatingChat';
import { useApp } from '../context/AppProvider';
import { DARK, FONTS, LIGHT, RADIUS, SPACING } from '../constants/theme';

function usePalette(themeMode) {
  return themeMode === 'dark' ? DARK : LIGHT;
}

function AIScoutLogo({ colors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
        <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>AI</Text>
      </View>
      <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>Scout</Text>
    </View>
  );
}

function TodayTopicCard({ topic, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={{ borderRadius: RADIUS.xl, overflow: 'hidden' }}>
      <LinearGradient colors={['#2563EB', '#1E40AF', '#1D4ED8']} style={styles.topicCard}>
        <View style={styles.topicDecor1} />
        <View style={styles.topicDecor2} />
        <View style={styles.topicContent}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <View style={styles.topicPill}>
              <Text style={styles.topicPillText}>Today's Topic</Text>
            </View>
            <Text style={styles.topicTitle}>{topic?.title}</Text>
            <View style={styles.topicMetaRow}>
              <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.82)" />
              <Text style={styles.topicMetaText}>{topic?.duration ?? 30} min</Text>
            </View>
          </View>
          <View style={styles.botVisual}>
            <View style={styles.botCircle}>
              <Ionicons name="hardware-chip" size={28} color="#2563EB" />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function TodayScreen({ navigation }) {
  const { themeMode, todayTopic, progress, continueLearning, historyItems, dataLoading, backendKind } = useApp();
  const colors = usePalette(themeMode);

  if (dataLoading && !todayTopic) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />

      <View style={[styles.header, { backgroundColor: colors.bg }]}>
        <AIScoutLogo colors={colors} />
        <View style={styles.headerActions}>
          <View style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="radio-outline" size={16} color={colors.primary} />
          </View>
          <View style={[styles.backendBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.backendBadgeText, { color: colors.textSub }]}>
              {backendKind === 'supabase' ? 'Live' : 'Local'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.todayRow}>
          <View>
            <Text style={[styles.todayTitle, { color: colors.text }]}>Today</Text>
            <Text style={{ fontSize: 14, color: colors.textSub, marginTop: 2 }}>Your daily AI topic</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={{ fontSize: 14 }}>🔥</Text>
            <Text style={styles.streakText}>{progress?.streak ?? 0} day streak</Text>
          </View>
        </View>

        <TodayTopicCard topic={todayTopic} onPress={() => navigation.navigate('Lecture', { topic: todayTopic })} />

        <TouchableOpacity style={styles.startBtn} onPress={() => navigation.navigate('Lecture', { topic: todayTopic })} activeOpacity={0.88}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.startBtnGrad}>
            <Text style={styles.startBtnText}>Start Lesson</Text>
            <Ionicons name="play" size={16} color="#FFF" style={{ marginLeft: 6 }} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your progress</Text>
        </View>

        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ProgressRing percent={progress?.weeklyPercent ?? 0} size={88} strokeWidth={9} color={colors.primary} bgColor={colors.border} textColor={colors.text} />
          <View style={{ flex: 1, paddingLeft: 16 }}>
            <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase' }}>This week</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 4 }}>
              {progress?.topicsCompleted ?? 0}{' '}
              <Text style={{ fontSize: 14, color: colors.textSub, fontWeight: '500' }}>
                of {progress?.topicsTotal ?? 0} topics
              </Text>
            </Text>
            <WeekDots days={progress?.weekDays ?? []} activeColor={colors.primary} inactiveColor={colors.border} textColor={colors.textMuted} />
          </View>
        </View>

        {continueLearning && continueLearning.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Continue learning</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {continueLearning.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => navigation.navigate('Lecture', { topic: { ...todayTopic, title: item.title, id: item.id } })}
                  style={[styles.squareCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={[styles.continueIcon, { backgroundColor: `${item.iconBg}20`, alignSelf: 'flex-start' }]}>
                    <View style={[styles.continueIconInner, { backgroundColor: item.iconBg }]}>
                      <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                    </View>
                  </View>
                  <View style={{ marginTop: 12, flex: 1, justifyContent: 'flex-end' }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }} numberOfLines={2}>{item.title}</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>{item.timeLeft}</Text>
                    <View style={[styles.progressBar, { backgroundColor: colors.border, marginTop: 8 }]}>
                      <View style={[styles.progressFill, { width: `${(item.progress ?? 0) * 100}%`, backgroundColor: item.iconBg }]} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {historyItems && historyItems.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Past topics</Text>
            </View>
            {historyItems.map((item) => (
              <TouchableOpacity
                key={item.id || item.history_id}
                onPress={() => navigation.navigate('Lecture', { topic: { id: item.id, title: item.title } })}
                style={[styles.continueCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.continueIcon, { backgroundColor: `${colors.success}20` }]}>
                  <View style={[styles.continueIconInner, { backgroundColor: colors.success }]}>
                    <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{item.title}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 3 }}>Completed {item.completed_at}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FloatingChat isDark={themeMode === 'dark'} pageContext={{ type: 'today', topic: todayTopic }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  backendBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  backendBadgeText: {
    fontSize: 12,
    fontWeight: '700',
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
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
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
  topicPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  topicPillText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
    fontWeight: '600',
  },
  topicTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  topicMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  topicMetaText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  botVisual: {
    width: 80,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: 24,
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
  },
  progressCard: {
    borderRadius: RADIUS.lg,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  squareCard: {
    width: 150,
    height: 150,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  continueCard: {
    borderRadius: RADIUS.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
    borderWidth: 1,
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
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
