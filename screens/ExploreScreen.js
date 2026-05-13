import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import FloatingChat from '../components/FloatingChat';
import { useApp } from '../context/AppProvider';
import { DARK, LIGHT, RADIUS, SPACING } from '../constants/theme';

const FILTER_CHIPS = ['All', 'Topics', 'Papers', 'Resources', 'Tools'];

function usePalette(themeMode) {
  return themeMode === 'dark' ? DARK : LIGHT;
}

export default function ExploreScreen({ navigation }) {
  const { themeMode, exploreResults, searchExplore, toggleBookmark, savedItems } = useApp();
  const colors = usePalette(themeMode);
  const [searchQuery, setSearchQuery] = useState('rag agents');
  const [activeFilter, setActiveFilter] = useState(0);
  const savedIds = new Set(savedItems.map((item) => item.id));

  useEffect(() => {
    searchExplore(searchQuery);
  }, []);

  const showTopics = activeFilter === 0 || activeFilter === 1;
  const showPapers = activeFilter === 0 || activeFilter === 2;
  const showResources = activeFilter === 0 || activeFilter === 3;
  const showTools = activeFilter === 0 || activeFilter === 4;

  async function handleSearch() {
    await searchExplore(searchQuery || 'ai agents');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Explore</Text>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search topics, papers, tools..."
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch}>
          <Ionicons name="arrow-forward-circle" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow} style={styles.filtersScroll}>
        {FILTER_CHIPS.map((chip, index) => (
          <TouchableOpacity
            key={chip}
            onPress={() => setActiveFilter(index)}
            style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }, activeFilter === index && { backgroundColor: colors.success, borderColor: colors.success }]}
          >
            <Text style={[styles.filterText, { color: activeFilter === index ? '#FFFFFF' : colors.textSub }]}>{chip}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {showTopics ? (
          <Section title="Topics" colors={colors}>
            {exploreResults.topics.map((topic) => (
              <TouchableOpacity key={topic.id} style={[styles.topicCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('Lecture', { topic })}>
                <View style={[styles.topicIconContainer, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="bulb-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.topicTitle, { color: colors.text }]}>{topic.title}</Text>
                  <Text style={[styles.topicMeta, { color: colors.textMuted }]}>{topic.duration ?? 30} min</Text>
                </View>
                <TouchableOpacity style={[styles.beginBtn, { backgroundColor: colors.success }]} onPress={() => navigation.navigate('Lecture', { topic })}>
                  <Text style={styles.beginBtnText}>Begin</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </Section>
        ) : null}

        {showPapers ? (
          <Section title="Papers" colors={colors}>
            {exploreResults.papers.map((paper) => (
              <View key={paper.id} style={[styles.paperCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.arxivBadge}>
                  <Text style={styles.arxivText}>Paper</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paperTitle, { color: colors.text }]}>{paper.title}</Text>
                  <Text style={[styles.topicMeta, { color: colors.textMuted }]}>{paper.sourceName || paper.category}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleBookmark(paper)}>
                  <Ionicons name={savedIds.has(paper.id) ? 'bookmark' : 'bookmark-outline'} size={20} color={savedIds.has(paper.id) ? colors.primary : colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </Section>
        ) : null}

        {showResources ? (
          <Section title="Resources" colors={colors}>
            {exploreResults.resources.map((resource) => (
              <View key={resource.id} style={[styles.paperCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.topicIconContainer, { backgroundColor: colors.warningLight }]}>
                  <Ionicons name="library-outline" size={18} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paperTitle, { color: colors.text }]}>{resource.title}</Text>
                  <Text style={[styles.topicMeta, { color: colors.textMuted }]}>{resource.summary}</Text>
                </View>
              </View>
            ))}
          </Section>
        ) : null}

        {showTools ? (
          <Section title="Tools" colors={colors}>
            {exploreResults.tools.map((tool) => (
              <View key={tool.id} style={[styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.topicIconContainer, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="construct-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.topicTitle, { color: colors.text }]}>{tool.title}</Text>
                  <Text style={[styles.topicMeta, { color: colors.textMuted }]}>{tool.summary}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleBookmark(tool)}>
                  <Ionicons name={savedIds.has(tool.id) ? 'bookmark' : 'bookmark-outline'} size={20} color={savedIds.has(tool.id) ? colors.primary : colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </Section>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FloatingChat isDark={themeMode === 'dark'} pageContext={{ type: 'explore', query: searchQuery }} />
    </SafeAreaView>
  );
}

function Section({ title, colors, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.base,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: SPACING.base,
    marginBottom: 14,
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
  filtersScroll: {
    marginBottom: 16,
  },
  filtersRow: {
    paddingHorizontal: SPACING.base,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: SPACING.base,
  },
  section: {
    marginBottom: 24,
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
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  topicIconContainer: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  topicMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  beginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  beginBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  paperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  arxivBadge: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  arxivText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '800',
  },
  paperTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
});
