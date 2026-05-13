import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import FloatingChat from '../components/FloatingChat';
import { useApp } from '../context/AppProvider';
import { DARK, LIGHT, RADIUS, SPACING } from '../constants/theme';

const TABS = [
  { label: 'Latest', value: 'news' },
  { label: 'Research', value: 'papers' },
  { label: 'Tools', value: 'tools' },
];

function usePalette(themeMode) {
  return themeMode === 'dark' ? DARK : LIGHT;
}

export default function NewsScreen() {
  const { themeMode, feed, refreshFeed, feedType, toggleBookmark, savedItems } = useApp();
  const colors = usePalette(themeMode);
  const [activeTab, setActiveTab] = useState(feedType);

  useEffect(() => {
    refreshFeed(activeTab);
  }, [activeTab]);

  const [featured, ...rest] = feed ?? [];
  const savedIds = useMemo(() => new Set(savedItems.map((item) => item.id)), [savedItems]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>News</Text>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="refresh-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            onPress={() => setActiveTab(tab.value)}
            style={[styles.tabPill, { backgroundColor: colors.surface, borderColor: colors.border }, activeTab === tab.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab.value ? '#FFFFFF' : colors.textSub }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {featured ? (
          <TouchableOpacity activeOpacity={0.9} style={[styles.featuredCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <LinearGradient colors={featured.imageGradient ?? ['#0C4A6E', '#075985']} style={styles.featuredImage}>
              <Ionicons name="sparkles-outline" size={22} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
            <View style={styles.featuredContent}>
              <View style={[styles.categoryBadge, { backgroundColor: `${featured.categoryColor ?? colors.primary}18` }]}>
                <Text style={[styles.categoryText, { color: featured.categoryColor ?? colors.primary }]}>{featured.category}</Text>
              </View>
              <Text style={[styles.newsTitle, { color: colors.text, fontSize: 18 }]}>{featured.title}</Text>
              <Text style={[styles.summaryText, { color: colors.textSub }]}>{featured.summary}</Text>
              <View style={styles.featuredFooter}>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{featured.time || featured.sourceName}</Text>
                <TouchableOpacity onPress={() => toggleBookmark(featured)}>
                  <Ionicons name={savedIds.has(featured.id) ? 'bookmark' : 'bookmark-outline'} size={20} color={savedIds.has(featured.id) ? colors.primary : colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ) : null}

        {rest.map((item) => (
          <View key={item.id} style={[styles.newsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <LinearGradient colors={item.imageGradient ?? ['#0C4A6E', '#075985']} style={styles.thumbnail}>
              <Ionicons name="newspaper-outline" size={18} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <View style={[styles.categoryBadge, { backgroundColor: `${item.categoryColor ?? colors.primary}18`, alignSelf: 'flex-start' }]}>
                <Text style={[styles.categoryText, { color: item.categoryColor ?? colors.primary }]}>{item.category}</Text>
              </View>
              <Text style={[styles.newsTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
              <Text style={[styles.summaryText, { color: colors.textSub }]} numberOfLines={2}>{item.summary}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{item.time || item.sourceName}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleBookmark(item)}>
              <Ionicons name={savedIds.has(item.id) ? 'bookmark' : 'bookmark-outline'} size={20} color={savedIds.has(item.id) ? colors.primary : colors.textMuted} />
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FloatingChat isDark={themeMode === 'dark'} pageContext={{ type: 'news' }} />
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
    fontSize: 28,
    fontWeight: '800',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    gap: 8,
    marginBottom: 16,
  },
  tabPill: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: SPACING.base,
  },
  featuredCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
  },
  featuredImage: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredContent: {
    padding: 16,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  newsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  thumbnail: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 6,
  },
});
