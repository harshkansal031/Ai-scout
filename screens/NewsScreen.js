import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking, ActivityIndicator, RefreshControl, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import FloatingChat from '../components/FloatingChat';
import * as WebBrowser from 'expo-web-browser';
import { useApp } from '../context/AppProvider';
import { DARK, LIGHT, RADIUS, SPACING } from '../constants/theme';
import { buildArticleImageSource } from '../utils/imageUrl';

const TABS = [
  { label: 'Latest', value: 'all' },
  { label: '🚀 Launches', value: 'launches' },
  { label: '📊 Industry', value: 'industry' },
  { label: '🔬 Research', value: 'research' },
];

function usePalette(themeMode) {
  return themeMode === 'dark' ? DARK : LIGHT;
}

function getDomainLogo(url) {
  try {
    if (!url) return null;
    const cleanUrl = url.replace('https://', '').replace('http://', '');
    const domain = cleanUrl.split('/')[0];
    return `https://logo.clearbit.com/${domain}?size=120`;
  } catch (e) {
    return null;
  }
}

function FeaturedThumbnail({ featured, colors }) {
  const [useFallback, setUseFallback] = React.useState(false);
  const imageUrl = featured.imageUrl || featured.metadata?.imageUrl || featured.metadata?.image_url || featured.metadata?.ogImage;
  const logoUrl = !imageUrl && featured.sourceUrl ? getDomainLogo(featured.sourceUrl) : null;
  const finalUri = imageUrl || logoUrl;

  const imageSource = finalUri && !logoUrl ? buildArticleImageSource(finalUri, featured.sourceUrl) : { uri: finalUri };

  if (finalUri && !useFallback && imageSource) {
    return (
      <Image 
        source={imageSource} 
        style={[
          styles.featuredImage, 
          logoUrl && { resizeMode: 'contain', backgroundColor: '#FFFFFF', padding: 20 }
        ]} 
        onError={() => setUseFallback(true)}
      />
    );
  }

  return (
    <LinearGradient colors={featured.imageGradient ?? ['#0C4A6E', '#075985']} style={styles.featuredImage}>
      <Ionicons name="sparkles-outline" size={22} color="rgba(255,255,255,0.8)" />
    </LinearGradient>
  );
}

function Thumbnail({ item, colors }) {
  const [useFallback, setUseFallback] = React.useState(false);
  const imageUrl = item.imageUrl || item.metadata?.imageUrl || item.metadata?.image_url || item.metadata?.ogImage;
  const logoUrl = !imageUrl && item.sourceUrl ? getDomainLogo(item.sourceUrl) : null;
  const finalUri = imageUrl || logoUrl;

  const imageSource = finalUri && !logoUrl ? buildArticleImageSource(finalUri, item.sourceUrl) : { uri: finalUri };

  if (finalUri && !useFallback && imageSource) {
    return (
      <Image 
        source={imageSource} 
        style={[
          styles.thumbnail, 
          logoUrl && { resizeMode: 'contain', backgroundColor: '#FFFFFF', padding: 8 }
        ]} 
        onError={() => setUseFallback(true)}
      />
    );
  }

  return (
    <LinearGradient colors={item.imageGradient ?? ['#0C4A6E', '#075985']} style={styles.thumbnail}>
      <Ionicons name="newspaper-outline" size={18} color="rgba(255,255,255,0.8)" />
    </LinearGradient>
  );
}

export default function NewsScreen() {
  const { themeMode, feed, refreshFeed, feedType, toggleBookmark, savedItems, trackItemClick } = useApp();
  const colors = usePalette(themeMode);
  const [activeTab, setActiveTab] = useState(feedType);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);

  useEffect(() => {
    refreshFeed(activeTab);
    setVisibleCount(8); // Reset pagination on tab change
  }, [activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshFeed(activeTab, true);
    setVisibleCount(8);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (visibleCount < rest.length) {
      setVisibleCount((prev) => prev + 8);
    }
  };

  const handleOpenUrl = (rawUrl) => {
    if (!rawUrl) return;
    let cleanUrl = rawUrl.trim().replace(/\s+/g, '');
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    // the-decoder.com blocks mobile WebViews/Custom Tabs with a 403 Forbidden page.
    // To bypass Cloudflare, we open it directly in the device's system browser.
    if (cleanUrl.includes('the-decoder.com')) {
      Alert.alert(
        "🛡️ External Website Security",
        "This website (The Decoder) blocks in-app mobile browsers. We will open it in your system browser. If it shows 'Forbidden', simply toggle 'Request Desktop Site' in your browser!",
        [
          { 
            text: "Open Link", 
            onPress: () => Linking.openURL(cleanUrl).catch(e => console.warn("Failed to open URL in system browser:", e))
          },
          { text: "Cancel", style: "cancel" }
        ]
      );
      return;
    }
    
    WebBrowser.openBrowserAsync(cleanUrl, {
      readerMode: false,
      enableBarCollapsing: true,
      dismissButtonStyle: 'close',
      toolbarColor: colors.primary,
    }).catch(err => {
      console.warn("Failed to open URL in WebBrowser:", cleanUrl, err);
      Linking.openURL(cleanUrl).catch(e => console.warn("Linking fallback failed:", e));
    });
  };

  const [featured, ...rest] = feed ?? [];
  const paginatedRest = useMemo(() => rest.slice(0, visibleCount), [rest, visibleCount]);
  const savedIds = useMemo(() => new Set(savedItems.map((item) => item.id)), [savedItems]);

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>News</Text>
      </View>

      <View style={{ marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={[styles.tabPill, { backgroundColor: colors.surface, borderColor: colors.border }, activeTab === tab.value && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              <Text style={[styles.tabText, { color: activeTab === tab.value ? '#FFFFFF' : colors.textSub }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {featured ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (featured.sourceUrl) {
              trackItemClick(featured);
              handleOpenUrl(featured.sourceUrl);
            }
          }}
          style={[styles.featuredCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <FeaturedThumbnail featured={featured} colors={colors} />
          <View style={styles.featuredContent}>
            <View style={[styles.categoryBadge, { backgroundColor: `${featured.categoryColor ?? colors.primary}18` }]}>
              <Text style={[styles.categoryText, { color: featured.categoryColor ?? colors.primary }]}>{featured.category}</Text>
            </View>
            <Text style={[styles.newsTitle, { color: colors.text, fontSize: 18 }]}>{featured.title}</Text>
            <Text style={[styles.summaryText, { color: colors.textSub }]}>{featured.summary}</Text>
            <View style={featured.featuredFooter || styles.featuredFooter}>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{featured.time || featured.sourceName}</Text>
              <TouchableOpacity onPress={() => toggleBookmark(featured)}>
                <Ionicons name={savedIds.has(featured.id) ? 'bookmark' : 'bookmark-outline'} size={20} color={savedIds.has(featured.id) ? colors.primary : colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        if (item.sourceUrl) {
          trackItemClick(item);
          handleOpenUrl(item.sourceUrl);
        }
      }}
      style={[styles.newsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Thumbnail item={item} colors={colors} />
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
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (visibleCount >= rest.length) {
      return (
        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
          <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '500' }}>🎉 You're all caught up!</Text>
        </View>
      );
    }
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      
      <FlatList
        data={paginatedRest}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={3}
        removeClippedSubviews={Platform.OS === 'android'}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      />

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
