import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import FloatingChat from '../components/FloatingChat';
import { useApp } from '../context/AppProvider';
import { DARK, LIGHT, RADIUS, SPACING } from '../constants/theme';

function usePalette(themeMode) {
  return themeMode === 'dark' ? DARK : LIGHT;
}

export default function SavedScreen({ navigation }) {
  const { themeMode, savedItems, toggleBookmark } = useApp();
  const colors = usePalette(themeMode);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Saved</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <StatCard value={savedItems.length} label="Saved" colors={colors} />
          <StatCard value="Live" label="Sync" colors={colors} />
          <StatCard value="Ready" label="Status" colors={colors} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>All saved</Text>
        </View>

        {savedItems.length ? (
          savedItems.map((item) => (
            <View key={item.id} style={[styles.savedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <LinearGradient colors={item.imageGradient ?? ['#1E2B4A', '#1E3A5F']} style={styles.savedThumb}>
                <Ionicons name="book-outline" size={18} color="rgba(255,255,255,0.6)" />
              </LinearGradient>
              <View style={styles.savedInfo}>
                <Text style={[styles.savedTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                <Text style={[styles.timeText, { color: colors.textMuted }]}>{item.type || item.category}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleBookmark(item)}>
                <Ionicons name="bookmark" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing saved yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>Bookmark topics, papers, and tools to find them here.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Explore')} style={[styles.exploreBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.exploreBtnText}>Browse Explore</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FloatingChat isDark={themeMode === 'dark'} pageContext={{ type: 'saved' }} />
    </SafeAreaView>
  );
}

function StatCard({ value, label, colors }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  savedThumb: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedInfo: {
    flex: 1,
  },
  savedTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
  },
  exploreBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    marginTop: 8,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
