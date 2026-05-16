import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import RAGDiagram from '../components/RAGDiagram';
import FloatingChat from '../components/FloatingChat';
import { useApp } from '../context/AppProvider';
import { DARK, LIGHT, RADIUS, SPACING } from '../constants/theme';

const TABS = ['Learn', 'Examples', 'Builder takeaway'];

function usePalette(themeMode) {
  return themeMode === 'dark' ? DARK : LIGHT;
}

export default function LectureScreen({ route, navigation }) {
  const { themeMode, markTopicComplete, toggleBookmark, savedItems } = useApp();
  const colors = usePalette(themeMode);
  const [activeTab, setActiveTab] = useState(0);
  const topic = route?.params?.topic ?? {};
  const isSaved = useMemo(() => savedItems.some((item) => item.id === topic.id), [savedItems, topic.id]);

  const whatYoullLearn = topic.whatYoullLearn ?? [
    'What the topic solves in production AI workflows',
    'How it changes system architecture decisions',
    'What builders should implement first',
  ];

  const resources = topic.resources ?? [];
  const actionSteps = [
    'Understand the problem space and target workflow.',
    'Choose the right data, tools, or retrieval source.',
    'Prototype a thin end-to-end version.',
    'Measure quality with real user questions.',
    'Iterate on latency, grounding, and reliability.',
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />

      <View style={[styles.header, { backgroundColor: colors.bg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Today's Topic</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => toggleBookmark({ ...topic, type: 'topic' })} style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={20} color={isSaved ? colors.primary : colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.topicTag, { backgroundColor: colors.successLight, borderColor: `${colors.success}40` }]}>
          <Text style={[styles.topicTagText, { color: colors.success }]}>{topic.tag || topic.title}</Text>
        </View>

        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>{topic.title}</Text>
          <View style={[styles.durationBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.durationText, { color: colors.textMuted }]}>{topic.duration ?? 35} min</Text>
          </View>
        </View>

        <RAGDiagram />

        <View style={[styles.tabsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {TABS.map((tab, idx) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(idx)} style={[styles.tabItem, activeTab === idx && { backgroundColor: colors.primary }]}>
              <Text style={[styles.tabText, { color: activeTab === idx ? '#FFFFFF' : colors.textMuted }]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 0 ? (
          <>
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionCardTitle, { color: colors.text }]}>What you'll learn</Text>
              <View style={{ marginTop: 12 }}>
                {whatYoullLearn.map((item, index) => (
                  <View key={`${item}-${index}`} style={styles.checkRow}>
                    <View style={[styles.checkCircle, { backgroundColor: colors.successLight }]}>
                      <Ionicons name="checkmark" size={14} color={colors.success} />
                    </View>
                    <Text style={[styles.checkText, { color: colors.text }]}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Resources</Text>
            {resources.map((resource, index) => (
              <TouchableOpacity
                key={`${resource.title}-${index}`}
                activeOpacity={0.7}
                onPress={() => resource.url && Linking.openURL(resource.url)}
                style={[styles.resourceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.resourceIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="link-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{resource.title}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{resource.time || resource.duration_label || 'Link'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        ) : null}

        {activeTab === 1 ? (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionCardTitle, { color: colors.text }]}>Examples</Text>
            <View style={{ gap: 12, marginTop: 12 }}>
              {[
                'Customer support grounded in product docs.',
                'Research assistants that cite papers.',
                'Internal copilots connected to private company knowledge.',
              ].map((example) => (
                <View key={example} style={[styles.exampleCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 14, color: colors.textSub, lineHeight: 21 }}>{example}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {activeTab === 2 ? (
          <>
            <View style={[styles.takeawayCard, { borderColor: colors.warningLight }]}>
              <Text style={styles.takeawayText}>{topic.builderTakeaway || 'Use this pattern when your product needs current, private, or traceable knowledge.'}</Text>
            </View>
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionCardTitle, { color: colors.text }]}>Action steps</Text>
              <View style={{ marginTop: 12, gap: 10 }}>
                {actionSteps.map((step, index) => (
                  <View key={step} style={styles.stepRow}>
                    <View style={[styles.stepCircle, { backgroundColor: colors.primaryLight }]}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>{index + 1}</Text>
                    </View>
                    <Text style={{ flex: 1, color: colors.textSub, lineHeight: 22 }}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}

        <TouchableOpacity style={[styles.completeBtn, { backgroundColor: colors.success }]} onPress={() => markTopicComplete(topic.id)}>
          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          <Text style={styles.completeBtnText}>Mark as Complete</Text>
        </TouchableOpacity>
        <View style={{ height: 100 }} />
      </ScrollView>

      <FloatingChat isDark={themeMode === 'dark'} pageContext={{ type: 'lecture', topic }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
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
  scrollContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: 8,
  },
  topicTag: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    marginBottom: 10,
  },
  topicTagText: {
    fontSize: 13,
    fontWeight: '700',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionCard: {
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.md,
    marginBottom: 8,
    borderWidth: 1,
  },
  resourceIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exampleCard: {
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  takeawayCard: {
    backgroundColor: '#1A1800',
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  takeawayText: {
    color: '#F5D76E',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  completeBtn: {
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  completeBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
