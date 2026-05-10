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
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import RAGDiagram from '../components/RAGDiagram';
import FloatingChat from '../components/FloatingChat';
import { DARK, FONTS, SPACING, RADIUS } from '../constants/theme';

const { width } = Dimensions.get('window');
const C = DARK;

const TABS = ['Learn', 'Examples', 'Builder takeaway'];

function CheckItem({ text }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <View style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: C.successLight,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Ionicons name="checkmark" size={14} color={C.success} />
      </View>
      <Text style={{ fontSize: 15, color: C.text, flex: 1, lineHeight: 22 }}>{text}</Text>
    </View>
  );
}

function ResourceCard({ resource }) {
  const icons = { article: 'document-text-outline', video: 'play-circle-outline', tool: 'construct-outline' };
  return (
    <TouchableOpacity style={[styles.resourceCard, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
      <View style={styles.resourceIcon}>
        <Ionicons name={icons[resource.type] || 'link-outline'} size={18} color={C.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: C.text }}>{resource.title}</Text>
        <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{resource.time}</Text>
      </View>
      <Ionicons name="arrow-forward" size={18} color={C.textMuted} />
    </TouchableOpacity>
  );
}

export default function LectureScreen({ route, navigation }) {
  const topic = route?.params?.topic || {};
  const [activeTab, setActiveTab] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const whatYoullLearn = topic.whatYoullLearn || [
    'What are RAG Agents',
    'How RAG improves AI outputs',
    'Build a RAG agent step by step',
  ];

  const builderTakeaway = topic.builderTakeaway || 'Use RAG when your AI needs fresh or private information.';

  const resources = topic.resources || [
    { type: 'article', title: 'RAG Paper by Meta', time: '20 min' },
    { type: 'video', title: 'Build RAG with LangChain', time: '45 min' },
    { type: 'tool', title: 'LlamaIndex Quickstart', time: '15 min' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Today's Topic</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => setBookmarked(!bookmarked)} style={styles.iconBtn}>
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={bookmarked ? C.primary : C.text}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Topic Tag */}
        <View style={styles.tagRow}>
          <View style={styles.topicTag}>
            <Text style={styles.topicTagText}>{topic.tag || 'RAG Agents'}</Text>
          </View>
        </View>

        {/* Title + Duration */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{topic.title || 'RAG Agents'}</Text>
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={14} color={C.textMuted} />
            <Text style={styles.durationText}>{topic.duration || 35} min</Text>
          </View>
        </View>

        {/* RAG Diagram */}
        <RAGDiagram onPlay={() => setIsPlaying(!isPlaying)} />

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {TABS.map((tab, idx) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(idx)}
              style={[styles.tabItem, activeTab === idx && styles.tabItemActive]}
            >
              <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 0 && (
          <View>
            {/* What you'll learn */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>What you'll learn</Text>
              <View style={{ marginTop: 12 }}>
                {whatYoullLearn.map((item, idx) => (
                  <CheckItem key={idx} text={item} />
                ))}
              </View>
            </View>

            {/* Resources */}
            <View style={{ marginTop: 8 }}>
              <Text style={styles.sectionTitle}>Resources</Text>
              {resources.map((r, idx) => (
                <ResourceCard key={idx} resource={r} />
              ))}
            </View>
          </View>
        )}

        {activeTab === 1 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionCardTitle}>Examples</Text>
            <View style={{ gap: 14, marginTop: 12 }}>
              {[
                { title: 'Customer Support Bot', desc: 'Use RAG to ground responses in your product documentation and FAQs.' },
                { title: 'Research Assistant', desc: 'Query academic papers and return cited, accurate summaries.' },
                { title: 'Code Helper', desc: 'Retrieve from your codebase to generate context-aware suggestions.' },
              ].map((ex, i) => (
                <View key={i} style={{ padding: 14, backgroundColor: C.surfaceAlt, borderRadius: RADIUS.md, borderWidth: 1, borderColor: C.border }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 4 }}>{ex.title}</Text>
                  <Text style={{ fontSize: 13, color: C.textSub, lineHeight: 20 }}>{ex.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 2 && (
          <View>
            {/* Builder Takeaway */}
            <View style={[styles.builderTakeaway]}>
              <View style={styles.builderIcon}>
                <Text style={{ fontSize: 18 }}>💡</Text>
              </View>
              <Text style={styles.builderText}>{builderTakeaway}</Text>
            </View>

            {/* Action Steps */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>Action steps</Text>
              <View style={{ marginTop: 12, gap: 10 }}>
                {[
                  'Pick a knowledge source (docs, PDFs, web pages)',
                  'Chunk and embed your content',
                  'Choose a vector DB (Chroma, Pinecone, or Qdrant)',
                  'Connect a retriever + LLM (LangChain or LlamaIndex)',
                  'Test with real queries and measure accuracy',
                ].map((step, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                    <View style={{
                      width: 24, height: 24, borderRadius: 12,
                      backgroundColor: C.primaryLight,
                      alignItems: 'center', justifyContent: 'center', marginTop: 1,
                    }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: C.primary }}>{i + 1}</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: C.textSub, flex: 1, lineHeight: 22 }}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Bottom Info Row */}
        <View style={styles.bottomInfoRow}>
          <View style={styles.infoBadge}>
            <Ionicons name="time-outline" size={13} color={C.textMuted} />
            <Text style={styles.infoBadgeText}>{topic.duration || 35} min</Text>
          </View>
          <View style={[styles.infoBadge, { backgroundColor: C.surfaceAlt }]}>
            <Ionicons name="bar-chart-outline" size={13} color={C.textMuted} />
            <Text style={styles.infoBadgeText}>{topic.difficulty || 'Intermediate'}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.chatCircle}>
            <Ionicons name="hardware-chip-outline" size={18} color={C.primary} />
          </TouchableOpacity>
        </View>

        {/* Mark Complete Button */}
        <TouchableOpacity style={styles.completeBtn} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700', marginLeft: 8 }}>Mark as Complete</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <FloatingChat isDark={true} pageContext={{ type: 'lecture', topic }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: 12,
    backgroundColor: DARK.bg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DARK.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: DARK.text,
    textAlign: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: DARK.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: 8,
  },
  tagRow: {
    marginBottom: 10,
  },
  topicTag: {
    backgroundColor: DARK.successLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: DARK.success + '40',
  },
  topicTagText: {
    color: DARK.success,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: DARK.text,
    letterSpacing: -0.5,
    flex: 1,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DARK.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: DARK.border,
  },
  durationText: {
    fontSize: 13,
    color: DARK.textMuted,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: DARK.surface,
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: DARK.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  tabItemActive: {
    backgroundColor: DARK.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  sectionCard: {
    backgroundColor: DARK.surface,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: DARK.border,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK.text,
    marginBottom: 10,
    marginTop: 4,
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
    backgroundColor: DARK.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  builderTakeaway: {
    backgroundColor: '#1A1800',
    borderRadius: RADIUS.lg,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3D3000',
  },
  builderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2D2200',
    alignItems: 'center',
    justifyContent: 'center',
  },
  builderText: {
    flex: 1,
    fontSize: 15,
    color: '#F5D76E',
    lineHeight: 22,
    fontWeight: '500',
  },
  bottomInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: DARK.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: DARK.border,
  },
  infoBadgeText: {
    fontSize: 13,
    color: DARK.textMuted,
    fontWeight: '600',
  },
  chatCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: DARK.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: DARK.primary + '60',
  },
  completeBtn: {
    backgroundColor: DARK.success,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
