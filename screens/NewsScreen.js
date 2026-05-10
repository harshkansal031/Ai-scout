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
import FloatingChat from '../components/FloatingChat';
import { NEWS_ITEMS } from '../constants/mockData';
import { LIGHT, FONTS, SPACING, RADIUS } from '../constants/theme';

const C = LIGHT;
const { width } = Dimensions.get('window');

const TAB_LABELS = ['Latest', 'Research', 'Papers'];

function ImagePlaceholder({ gradientColors, style }) {
  return (
    <LinearGradient colors={gradientColors} style={style} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Ionicons name="image-outline" size={20} color="rgba(255,255,255,0.3)" />
    </LinearGradient>
  );
}

function NewsCard({ item, onPress }) {
  const [saved, setSaved] = useState(item.saved);
  return (
    <TouchableOpacity onPress={onPress} style={styles.newsCard} activeOpacity={0.85}>
      {/* Thumbnail */}
      <ImagePlaceholder
        gradientColors={item.imageGradient}
        style={styles.thumbnail}
      />
      {/* Content */}
      <View style={styles.newsContent}>
        <View style={styles.categoryRow}>
          <View style={[styles.categoryBadge, { backgroundColor: item.categoryColor + '18' }]}>
            <Text style={[styles.categoryText, { color: item.categoryColor }]}>{item.category}</Text>
          </View>
        </View>
        <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.newsTime}>{item.time}</Text>
      </View>
      {/* Bookmark */}
      <TouchableOpacity onPress={() => setSaved(!saved)} style={styles.bookmarkBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? C.primary : C.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function FeaturedCard({ item, onPress }) {
  const [saved, setSaved] = useState(item.saved);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={[styles.featuredCard, C.cardShadow]}>
      <ImagePlaceholder
        gradientColors={item.imageGradient}
        style={styles.featuredImage}
      />
      <View style={styles.featuredContent}>
        <View style={[styles.categoryBadge, { backgroundColor: item.categoryColor + '18', alignSelf: 'flex-start', marginBottom: 8 }]}>
          <Text style={[styles.categoryText, { color: item.categoryColor }]}>{item.category}</Text>
        </View>
        <Text style={[styles.newsTitle, { fontSize: 18, fontWeight: '800' }]} numberOfLines={2}>{item.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={styles.newsTime}>{item.time}</Text>
          <TouchableOpacity onPress={() => setSaved(!saved)}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? C.primary : C.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function NewsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(0);
  const [searchVisible, setSearchVisible] = useState(false);

  const filteredItems = activeTab === 0
    ? NEWS_ITEMS
    : activeTab === 1
    ? NEWS_ITEMS.filter(n => n.category === 'Research')
    : NEWS_ITEMS.filter(n => n.category === 'Papers');

  const [featured, ...rest] = filteredItems;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>News</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => setSearchVisible(!searchVisible)} style={styles.iconBtn}>
            <Ionicons name="search-outline" size={22} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="options-outline" size={22} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar (expandable) */}
      {searchVisible && (
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={18} color={C.textMuted} />
          <Text style={styles.searchPlaceholder}>Search AI news...</Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TAB_LABELS.map((tab, idx) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(idx)}
            style={[styles.tabPill, activeTab === idx && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Featured card */}
        {featured && (
          <FeaturedCard item={featured} onPress={() => {}} />
        )}

        {/* News list */}
        {rest.map((item) => (
          <NewsCard key={item.id} item={item} onPress={() => {}} />
        ))}

        {/* View all */}
        <TouchableOpacity style={styles.viewAllBtn}>
          <Text style={styles.viewAllText}>View all</Text>
          <Ionicons name="chevron-forward" size={16} color={C.primary} />
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <FloatingChat isDark={false} pageContext={{ type: 'news' }} />
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: SPACING.base,
    marginBottom: 10,
    backgroundColor: LIGHT.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: LIGHT.border,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: LIGHT.textMuted,
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
    backgroundColor: LIGHT.surface,
    borderWidth: 1.5,
    borderColor: LIGHT.border,
  },
  tabPillActive: {
    backgroundColor: LIGHT.primary,
    borderColor: LIGHT.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: LIGHT.textSub,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: SPACING.base,
  },
  featuredCard: {
    backgroundColor: LIGHT.surface,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LIGHT.border,
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
  newsCard: {
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
  thumbnail: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  newsContent: {
    flex: 1,
    gap: 5,
  },
  categoryRow: {
    flexDirection: 'row',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: LIGHT.text,
    lineHeight: 21,
  },
  newsTime: {
    fontSize: 12,
    color: LIGHT.textMuted,
    fontWeight: '500',
  },
  bookmarkBtn: {
    padding: 4,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    backgroundColor: LIGHT.surface,
    borderRadius: RADIUS.lg,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: LIGHT.border,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: LIGHT.primary,
  },
});
