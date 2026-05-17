import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Linking, BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import FloatingChat from '../components/FloatingChat';
import { useApp } from '../context/AppProvider';
import { DARK, LIGHT, RADIUS, SPACING } from '../constants/theme';

function usePalette(themeMode) {
  return themeMode === 'dark' ? DARK : LIGHT;
}

const CONTENT_TABS = [
  { label: 'All',      value: 'all' },
  { label: 'Articles', value: 'article' },
  { label: 'Research', value: 'research' },
  { label: 'Posts',    value: 'post' },
];

const TYPE_COLOR = {
  article:  '#059669',
  research: '#7C3AED',
  paper:    '#7C3AED',
  post:     '#EA580C',
  news:     '#0891B2',
  tool:     '#0891B2',
  default:  '#0891B2',
};

const TYPE_ICON = {
  article:  'newspaper-outline',
  research: 'document-text-outline',
  paper:    'document-text-outline',
  post:     'chatbubble-outline',
  news:     'newspaper-outline',
  default:  'link-outline',
};

function slugify(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

export default function ExploreScreen({ navigation }) {
  const { themeMode, roadmaps, generateRoadmap, backend } = useApp();
  const colors = usePalette(themeMode);

  const [searchQuery, setSearchQuery]   = useState('');
  const [loadingTopicId, setLoadingTopicId] = useState(null);

  // Topic content (for 'topic-content' level)
  const [topicMetadata, setTopicMetadata]       = useState(null);
  const [topicContent, setTopicContent]         = useState([]);
  const [topicContentTab, setTopicContentTab]   = useState('all');
  const [topicContentLoading, setTopicContentLoading] = useState(false);

  // Search results (for 'search-results' level)
  const [searchResults, setSearchResults]   = useState({ topics: [], items: [] });
  const [searchLoading, setSearchLoading]   = useState(false);

  // Navigation Stack for Drill-Down
  const [stack, setStack] = useState([
    { level: 'root', data: roadmaps || [], title: 'Explore', id: 'root' },
  ]);

  useEffect(() => {
    if (stack.length === 1 && roadmaps && roadmaps.length > 0) {
      setStack([{ level: 'root', data: roadmaps, title: 'Explore', id: 'root' }]);
    }
  }, [roadmaps]);

  useEffect(() => {
    const onBackPress = () => {
      if (stack.length > 1) {
        setStack((prev) => prev.slice(0, -1));
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [stack]);

  const currentView = stack[stack.length - 1];

  const pushStack = (level, data, title, id) =>
    setStack((prev) => [...prev, { level, data, title, id }]);

  const popStack = () => {
    if (stack.length > 1) setStack((s) => s.slice(0, -1));
  };

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchLoading(true);
    try {
      const results = await backend.searchExploreContent(q);
      setSearchResults(results);
      pushStack('search-results', null, `"${q}"`, `search-${q}`);
    } catch (e) {
      console.error('[Explore] search error:', e);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, backend]);

  // ── Topic content fetch ───────────────────────────────────────────────────
  const loadTopicContent = useCallback(async (topicId, topicTitle) => {
    setTopicContent([]);
    setTopicContentTab('all');
    setTopicContentLoading(true);
    setTopicMetadata(null);
    try {
      // Resolve canonical explore_topics.id (roadmap slug often ≠ seeded id)
      let resolvedId = topicId;
      if (backend.resolveExploreTopicId) {
        resolvedId = await backend.resolveExploreTopicId(topicId, topicTitle);
      }

      if (resolvedId && backend.fetchTopic) {
        const meta = await backend.fetchTopic(resolvedId).catch(() => null);
        if (meta) {
          setTopicMetadata({
            title: meta.title,
            diff: meta.difficulty,
            desc: meta.description || meta.short_desc,
            resource: meta.docs_url,
          });
        }
      }

      let items = [];
      if (resolvedId) {
        items = await backend.fetchTopicContent(resolvedId);
      }

      // On-demand crawl (2–5s) when DB has no rows yet — not a background job you must wait hours for
      if (resolvedId && (!items || items.length === 0) && backend.triggerTopicCrawl) {
        try {
          const crawl = await backend.triggerTopicCrawl(resolvedId, topicTitle);
          if (crawl?.ok && crawl.itemsInserted > 0) {
            items = await backend.fetchTopicContent(resolvedId);
          }
        } catch (err) {
          console.log('[Explore] dynamic crawl failed:', err);
        }
      }

      if (!items || items.length === 0) {
        const results = await backend.searchExploreContent(topicTitle);
        items = results.items ?? [];
      }
      setTopicContent(items);
    } catch (e) {
      console.error('[Explore] topic content error:', e);
    } finally {
      setTopicContentLoading(false);
    }
  }, [backend]);

  // ── Subfield / roadmap navigation ─────────────────────────────────────────
  const handleSubfieldClick = async (sub) => {
    let steps = sub.children || [];
    if (steps.length === 0 && sub.fieldId && generateRoadmap) {
      setLoadingTopicId(sub.id);
      try {
        const generated = await generateRoadmap(sub.fieldId, sub.id, sub.title, sub.desc);
        steps = Array.isArray(generated) ? generated : [];
      } finally {
        setLoadingTopicId(null);
      }
    }
    pushStack('roadmap', steps, sub.title, sub.id);
  };

  const handleRoadmapCardPress = (topic) => {
    const stableId = slugify(topic.title);
    pushStack('topic-content', { ...topic, id: stableId }, topic.title, stableId);
    loadTopicContent(stableId, topic.title);
  };

  // ── Content card (shared between topic-content and search-results) ────────
  const renderContentCard = (item) => {
    const type = item.type ?? 'default';
    const color = TYPE_COLOR[type] ?? TYPE_COLOR.default;
    const icon  = TYPE_ICON[type]  ?? TYPE_ICON.default;
    const url   = item.sourceUrl ?? item.source_url ?? '';
    const src   = item.sourceName ?? item.source_name ?? item.category ?? '';
    const time  = item.time ?? item.relative_time ?? '';

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => url && Linking.openURL(url)}
        activeOpacity={0.75}
      >
        <View style={[styles.contentCardBadge, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={[styles.categoryChip, { backgroundColor: `${color}12` }]}>
            <Text style={[styles.categoryChipText, { color }]}>{item.category ?? src}</Text>
          </View>
          <Text style={[styles.contentTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          {Boolean(item.summary) && (
            <Text style={[styles.contentSummary, { color: colors.textSub }]} numberOfLines={2}>
              {item.summary}
            </Text>
          )}
          <Text style={[styles.contentMeta, { color: colors.textMuted }]}>
            {[src, time].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Renderers ─────────────────────────────────────────────────────────────
  const renderRoot = () => (
    <View style={styles.grid}>
      {currentView.data.map((field) => (
        <TouchableOpacity
          key={field.id}
          style={[styles.fieldCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => pushStack('subfield', field.children, field.title, field.id)}
          activeOpacity={0.8}
        >
          <View style={[styles.iconBox, { backgroundColor: `${field.color}20` }]}>
            <Ionicons name={field.icon} size={28} color={field.color} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{field.title}</Text>
          <Text style={[styles.cardDesc, { color: colors.textMuted }]}>{field.desc}</Text>
          {(field.children?.length ?? 0) > 0 && (
            <Text style={[styles.topicCount, { color: colors.primary }]}>
              {field.children.length} topics
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSubfields = () => (
    <View style={styles.list}>
      {currentView.data.map((sub) => (
        <TouchableOpacity
          key={sub.id}
          style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => handleSubfieldClick(sub)}
          activeOpacity={0.8}
          disabled={loadingTopicId === sub.id}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.listTitle, { color: colors.text }]}>{sub.title}</Text>
            <Text style={[styles.cardDesc, { color: colors.textMuted }]}>{sub.desc}</Text>
          </View>
          {loadingTopicId === sub.id ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRoadmap = () => (
    <View style={styles.roadmap}>
      {currentView.data.length === 0 && (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Lesson steps are being prepared. Pull back and try again in a moment.
        </Text>
      )}
      {currentView.data.map((topic, index) => {
        const isLast = index === currentView.data.length - 1;
        const diffColor =
          topic.diff === 'Beginner' ? colors.success
          : topic.diff === 'Intermediate' ? colors.warning
          : colors.error;

        return (
          <View key={topic.id} style={styles.roadmapItem}>
            <View style={styles.roadmapTimeline}>
              <View style={[styles.timelineDot, { borderColor: diffColor, backgroundColor: colors.surface }]} />
              {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
            </View>

            <TouchableOpacity
              style={[styles.roadmapCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => handleRoadmapCardPress(topic)}
            >
              <View style={styles.roadmapHeader}>
                <Text style={[styles.roadmapTitle, { color: colors.text }]}>{topic.title}</Text>
                <View style={[styles.diffBadge, { backgroundColor: `${diffColor}20` }]}>
                  <Text style={[styles.diffText, { color: diffColor }]}>{topic.diff}</Text>
                </View>
              </View>
              <Text style={[styles.cardDesc, { color: colors.textMuted, marginTop: 6 }]}>
                {topic.desc}
              </Text>

              <View style={styles.exploreBtn}>
                <Ionicons name="book-outline" size={15} color={colors.primary} />
                <Text style={[styles.exploreBtnText, { color: colors.primary }]}>
                  Read &amp; Explore
                </Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );

  const renderTopicContent = () => {
    const topic = topicMetadata || currentView.data || {};
    const diffColor =
      topic.diff === 'Beginner' ? colors.success
      : topic.diff === 'Intermediate' ? colors.warning
      : colors.error;

    const filtered =
      topicContentTab === 'all'
        ? topicContent
        : topicContent.filter((i) => {
            const t = i.type ?? '';
            if (topicContentTab === 'research') return t === 'research' || t === 'paper';
            return t === topicContentTab;
          });

    return (
      <View>
        {/* Static zone — topic definition */}
        <View style={[styles.topicStaticCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.diffBadge, { backgroundColor: `${diffColor}20`, alignSelf: 'flex-start' }]}>
            <Text style={[styles.diffText, { color: diffColor }]}>{topic.diff ?? 'General'}</Text>
          </View>
          <Text style={[styles.topicFullDesc, { color: colors.text }]}>{topic.desc}</Text>
          {Boolean(topic.resource) && (
            <TouchableOpacity
              style={styles.docsLink}
              onPress={() => Linking.openURL(topic.resource)}
            >
              <Ionicons name="document-text-outline" size={14} color={colors.primary} />
              <Text style={[styles.docsLinkText, { color: colors.primary }]}>Official Docs</Text>
              <Ionicons name="open-outline" size={13} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Section heading */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>Latest Content</Text>

        {/* Content type tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
          style={{ marginBottom: 16 }}
        >
          {CONTENT_TABS.map((tab) => {
            const active = topicContentTab === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                onPress={() => setTopicContentTab(tab.value)}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.tabText, { color: active ? '#fff' : colors.textSub }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Content list */}
        {topicContentLoading ? (
          <View style={{ alignItems: 'center', marginTop: 40, gap: 12 }}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 18 }}>
              Assembling fresh dynamic research, articles, and community insights...
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            We could not find articles or papers for this topic from our sources right now. Try a broader search from Explore home, or open again later after the daily refresh.
          </Text>
        ) : (
          <View style={styles.contentList}>
            {filtered.map((item) => renderContentCard(item))}
          </View>
        )}
      </View>
    );
  };

  const renderSearchResults = () => {
    const { topics = [], items = [] } = searchResults;
    const hasTopics = topics.length > 0;
    const hasItems  = items.length > 0;

    if (searchLoading) {
      return <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />;
    }

    if (!hasTopics && !hasItems) {
      return (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No results found. Try a different search term.
        </Text>
      );
    }

    return (
      <View>
        {hasTopics && (
          <>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>AI Topics</Text>
            <View style={styles.list}>
              {topics.map((topic) => (
                <TouchableOpacity
                  key={topic.id}
                  style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    pushStack('topic-content', {
                      title: topic.title,
                      diff: topic.difficulty,
                      desc: topic.short_desc,
                      resource: topic.docs_url,
                      id: topic.id,
                    }, topic.title, topic.id);
                    loadTopicContent(topic.id, topic.title);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, { color: colors.text }]}>{topic.title}</Text>
                    <Text style={[styles.cardDesc, { color: colors.textMuted }]}>{topic.short_desc}</Text>
                    <Text style={[styles.fieldTag, { color: colors.primary }]}>{topic.field}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {hasItems && (
          <>
            <Text style={[styles.sectionHeading, { color: colors.text, marginTop: hasTopics ? 24 : 0 }]}>
              Articles &amp; News
            </Text>
            <View style={styles.contentList}>
              {items.map((item) => renderContentCard(item))}
            </View>
          </>
        )}
      </View>
    );
  };

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />

      <View style={styles.header}>
        {stack.length > 1 && (
          <TouchableOpacity onPress={popStack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {currentView.title}
        </Text>
      </View>

      {stack.length === 1 && (
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search topics, articles, papers..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <TouchableOpacity onPress={handleSearch}>
              <Ionicons name="arrow-forward-circle" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {currentView.level === 'root'           && renderRoot()}
        {currentView.level === 'subfield'       && renderSubfields()}
        {currentView.level === 'roadmap'        && renderRoadmap()}
        {currentView.level === 'topic-content'  && renderTopicContent()}
        {currentView.level === 'search-results' && renderSearchResults()}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FloatingChat
        isDark={themeMode === 'dark'}
        pageContext={{ type: 'explore', query: searchQuery }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: SPACING.base,
    marginBottom: 20,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1.5,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  scrollContent: {
    paddingHorizontal: SPACING.base,
  },
  // Root grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fieldCard: {
    width: '48%',
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    minHeight: 180,
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  topicCount: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  // List (subfields / search topics)
  list: {
    gap: 12,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  fieldTag: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  // Roadmap
  roadmap: {
    marginTop: 8,
  },
  roadmapItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  roadmapTimeline: {
    width: 30,
    alignItems: 'center',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    zIndex: 2,
    marginTop: 20,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    position: 'absolute',
    top: 20,
    bottom: -30,
    zIndex: 1,
  },
  roadmapCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    marginLeft: 8,
  },
  roadmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roadmapTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  diffText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },
  exploreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  // Topic content (static zone)
  topicStaticCard: {
    borderRadius: RADIUS.lg,
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
    gap: 12,
  },
  topicFullDesc: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
  },
  docsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },
  docsLinkText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  // Section heading
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  // Tabs
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  tabPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Content cards
  contentList: {
    gap: 10,
  },
  contentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
  },
  contentCardBadge: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginBottom: 6,
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  contentSummary: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  contentMeta: {
    fontSize: 11,
    marginTop: 6,
  },
  // Empty state
  emptyText: {
    fontSize: 14,
    lineHeight: 22,
    paddingVertical: 32,
    textAlign: 'center',
  },
});
