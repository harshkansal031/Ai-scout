import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import FloatingChat from '../components/FloatingChat';
import { EXPLORE_TOPICS, EXPLORE_PAPERS, EXPLORE_TOOLS } from '../constants/mockData';
import { DARK, FONTS, SPACING, RADIUS } from '../constants/theme';

const C = DARK;
const { width } = Dimensions.get('window');

const FILTER_CHIPS = ['All', 'Topics', 'Papers', 'Courses', 'Tools'];

function TopicResultCard({ item, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.topicCard} activeOpacity={0.85}>
      <View style={[styles.topicIconContainer, { backgroundColor: item.iconBg }]}>
        <Text style={{ fontSize: 22 }}>{item.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <Text style={styles.topicTitle}>{item.title}</Text>
          {item.tag && (
            <View style={styles.greenTag}>
              <Text style={styles.greenTagText}>{item.tag}</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="time-outline" size={13} color={C.textMuted} />
          <Text style={styles.topicTime}>{item.duration} min</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.beginBtn}>
        <Text style={styles.beginBtnText}>Begin</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function PaperCard({ paper, onPress }) {
  const [saved, setSaved] = useState(paper.saved);
  return (
    <TouchableOpacity onPress={onPress} style={styles.paperCard} activeOpacity={0.85}>
      <View style={styles.arxivBadge}>
        <Text style={styles.arxivText}>arXiv</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.paperTitle} numberOfLines={2}>{paper.title}</Text>
        <Text style={styles.paperYear}>arXiv · {paper.year}</Text>
      </View>
      <TouchableOpacity onPress={() => setSaved(!saved)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? C.primary : C.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function ToolCard({ tool, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.toolCard} activeOpacity={0.85}>
      <View style={[styles.toolIcon, { backgroundColor: tool.iconBg }]}>
        <Text style={{ fontSize: 22 }}>{tool.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.toolName}>{tool.name}</Text>
        <Text style={styles.toolDesc}>{tool.description}</Text>
      </View>
      <TouchableOpacity style={styles.toolChatBtn}>
        <Ionicons name="hardware-chip-outline" size={16} color={C.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function ExploreScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('rag agents');
  const [activeFilter, setActiveFilter] = useState(0);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const inputRef = useRef(null);

  const showTopics = activeFilter === 0 || activeFilter === 1;
  const showPapers = activeFilter === 0 || activeFilter === 2;
  const showCourses = activeFilter === 0 || activeFilter === 3;
  const showTools = activeFilter === 0 || activeFilter === 4;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
        <Ionicons name="search-outline" size={20} color={C.textMuted} />
        <TextInput
          ref={inputRef}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder="Search topics, papers, tools..."
          placeholderTextColor={C.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={C.textMuted} />
          </TouchableOpacity>
        )}
        <View style={styles.searchDivider} />
        <TouchableOpacity>
          <Ionicons name="options-outline" size={20} color={C.textSub} />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        style={styles.filtersScroll}
      >
        {FILTER_CHIPS.map((chip, idx) => (
          <TouchableOpacity
            key={chip}
            onPress={() => setActiveFilter(idx)}
            style={[styles.filterChip, activeFilter === idx && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, activeFilter === idx && styles.filterTextActive]}>{chip}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Topics Section */}
        {showTopics && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Topics</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            {EXPLORE_TOPICS.map(item => (
              <TopicResultCard key={item.id} item={item} onPress={() => navigation.navigate('Today', {
                screen: 'Lecture',
                params: { topic: { title: item.title, duration: item.duration, tag: item.tag || item.title } }
              })} />
            ))}
          </View>
        )}

        {/* Papers Section */}
        {showPapers && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Papers</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            {EXPLORE_PAPERS.map(paper => (
              <PaperCard key={paper.id} paper={paper} onPress={() => {}} />
            ))}
          </View>
        )}

        {/* Courses Section */}
        {showCourses && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Courses</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            {[
              { id: 'c1', icon: '🎓', iconBg: '#1E2B4A', title: 'RAG Fundamentals', provider: 'DeepLearning.AI', duration: '2h' },
              { id: 'c2', icon: '🧠', iconBg: '#1A1B2E', title: 'LangChain for LLM Apps', provider: 'Coursera', duration: '3h' },
            ].map(c => (
              <TouchableOpacity key={c.id} style={styles.topicCard}>
                <View style={[styles.topicIconContainer, { backgroundColor: c.iconBg }]}>
                  <Text style={{ fontSize: 22 }}>{c.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topicTitle}>{c.title}</Text>
                  <Text style={styles.topicTime}>{c.provider} · {c.duration}</Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color={C.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tools Section */}
        {showTools && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tools</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            {EXPLORE_TOOLS.map(tool => (
              <ToolCard key={tool.id} tool={tool} onPress={() => {}} />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FloatingChat isDark={true} pageContext={{ type: 'explore', query: searchQuery }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.base,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: DARK.bg,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: DARK.text,
    letterSpacing: -0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: SPACING.base,
    marginBottom: 14,
    backgroundColor: DARK.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: DARK.border,
  },
  searchBarFocused: {
    borderColor: DARK.primary,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: DARK.text,
    padding: 0,
  },
  searchDivider: {
    width: 1,
    height: 20,
    backgroundColor: DARK.border,
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
    backgroundColor: DARK.surface,
    borderWidth: 1.5,
    borderColor: DARK.border,
  },
  filterChipActive: {
    backgroundColor: DARK.success,
    borderColor: DARK.success,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK.textSub,
  },
  filterTextActive: {
    color: '#FFFFFF',
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
    color: DARK.text,
  },
  viewAllText: {
    fontSize: 14,
    color: DARK.primary,
    fontWeight: '600',
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: DARK.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: DARK.border,
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
    color: DARK.text,
    marginBottom: 2,
  },
  topicTime: {
    fontSize: 12,
    color: DARK.textMuted,
    fontWeight: '500',
  },
  greenTag: {
    backgroundColor: DARK.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  greenTagText: {
    fontSize: 10,
    color: DARK.success,
    fontWeight: '700',
  },
  beginBtn: {
    backgroundColor: DARK.success,
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
    backgroundColor: DARK.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: DARK.border,
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
    letterSpacing: 0.5,
  },
  paperTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  paperYear: {
    fontSize: 12,
    color: DARK.textMuted,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: DARK.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: DARK.border,
  },
  toolIcon: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolName: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK.text,
    marginBottom: 2,
  },
  toolDesc: {
    fontSize: 13,
    color: DARK.textMuted,
  },
  toolChatBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: DARK.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: DARK.primary + '50',
  },
});
