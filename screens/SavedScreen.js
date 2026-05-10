import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import FloatingChat from '../components/FloatingChat';
import { SAVED_ITEMS } from '../constants/mockData';
import { LIGHT, FONTS, SPACING, RADIUS } from '../constants/theme';

const C = LIGHT;

function SavedCard({ item, onUnsave }) {
  return (
    <TouchableOpacity style={styles.savedCard} activeOpacity={0.85}>
      <LinearGradient
        colors={item.imageGradient}
        style={styles.savedThumb}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="book-outline" size={18} color="rgba(255,255,255,0.6)" />
      </LinearGradient>
      <View style={styles.savedInfo}>
        <Text style={styles.savedTitle} numberOfLines={2}>{item.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="time-outline" size={12} color={C.textMuted} />
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={() => onUnsave(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="bookmark" size={22} color={C.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function SavedScreen({ navigation }) {
  const [saved, setSaved] = useState(SAVED_ITEMS);

  const handleUnsave = (id) => {
    setSaved(prev => prev.filter(item => item.id !== id));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={22} color={C.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{saved.length}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Collections</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>2h</Text>
            <Text style={styles.statLabel}>Read time</Text>
          </View>
        </View>

        {/* Saved Items */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All saved</Text>
          <TouchableOpacity>
            <Ionicons name="filter-outline" size={20} color={C.textSub} />
          </TouchableOpacity>
        </View>

        {saved.length > 0 ? (
          saved.map((item) => (
            <SavedCard key={item.id} item={item} onUnsave={handleUnsave} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={48} color={C.textMuted} />
            <Text style={styles.emptyTitle}>Nothing saved yet</Text>
            <Text style={styles.emptyDesc}>Bookmark topics, papers, and tools to find them here.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Explore')} style={styles.exploreBtn}>
              <Text style={styles.exploreBtnText}>Browse Explore</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FloatingChat isDark={false} pageContext={{ type: 'saved' }} />
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
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: LIGHT.text,
    letterSpacing: -0.5,
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
    backgroundColor: LIGHT.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LIGHT.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: LIGHT.text,
  },
  statLabel: {
    fontSize: 12,
    color: LIGHT.textMuted,
    marginTop: 3,
    fontWeight: '500',
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
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: LIGHT.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: LIGHT.border,
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
    color: LIGHT.text,
    lineHeight: 21,
  },
  typeBadge: {
    backgroundColor: LIGHT.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  typeText: {
    fontSize: 11,
    color: LIGHT.primary,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    color: LIGHT.textMuted,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: LIGHT.text,
  },
  emptyDesc: {
    fontSize: 14,
    color: LIGHT.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
  },
  exploreBtn: {
    backgroundColor: LIGHT.primary,
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
