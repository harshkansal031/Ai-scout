import React, { useState, useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Linking, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import FloatingChat from '../components/FloatingChat';
import { useApp } from '../context/AppProvider';
import { DARK, LIGHT, RADIUS, SPACING } from '../constants/theme';

function usePalette(themeMode) {
  return themeMode === 'dark' ? DARK : LIGHT;
}

export default function ExploreScreen({ navigation }) {
  const { themeMode, roadmaps, generateRoadmap } = useApp();
  const colors = usePalette(themeMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingTopicId, setLoadingTopicId] = useState(null);
  
  // Navigation Stack for Drill-Down
  const [stack, setStack] = useState([{ level: 'root', data: roadmaps || [], title: 'Explore AI', id: 'root' }]);

  // Sync stack when roadmaps load dynamically
  useEffect(() => {
    if (stack.length === 1 && roadmaps && roadmaps.length > 0) {
      setStack([{ level: 'root', data: roadmaps, title: 'Explore AI', id: 'root' }]);
    }
  }, [roadmaps]);

  useEffect(() => {
    const onBackPress = () => {
      if (stack.length > 1) {
        setStack(prev => prev.slice(0, -1));
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [stack]);

  const currentView = stack[stack.length - 1];

  const pushStack = (level, data, title, id) => {
    setStack([...stack, { level, data, title, id }]);
  };

  const popStack = () => {
    if (stack.length > 1) {
      setStack(stack.slice(0, -1));
    }
  };

  const handleSearch = () => {
    console.log("Super Search triggered:", searchQuery);
  };

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
        <Text style={[styles.emptyRoadmap, { color: colors.textMuted }]}>
          Lesson steps are being prepared. Pull back and try again in a moment.
        </Text>
      )}
      {currentView.data.map((topic, index) => {
        const isLast = index === currentView.data.length - 1;
        const diffColor = topic.diff === 'Beginner' ? colors.success : (topic.diff === 'Intermediate' ? colors.warning : colors.error);
        
        return (
          <View key={topic.id} style={styles.roadmapItem}>
            <View style={styles.roadmapTimeline}>
              <View style={[styles.timelineDot, { borderColor: diffColor, backgroundColor: colors.surface }]} />
              {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
            </View>
            <TouchableOpacity 
              style={[styles.roadmapCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => topic.resource && Linking.openURL(topic.resource)}
            >
              <View style={styles.roadmapHeader}>
                <Text style={[styles.roadmapTitle, { color: colors.text }]}>{topic.title}</Text>
                <View style={[styles.diffBadge, { backgroundColor: `${diffColor}20` }]}>
                  <Text style={[styles.diffText, { color: diffColor }]}>{topic.diff}</Text>
                </View>
              </View>
              <Text style={[styles.cardDesc, { color: colors.textMuted, marginTop: 6 }]}>{topic.desc}</Text>
              
              <View style={styles.resourceBtn}>
                <Ionicons name="logo-youtube" size={16} color="#FF0000" />
                <Text style={[styles.resourceText, { color: colors.primary }]}>Study Resource</Text>
              </View>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );

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
            placeholder="Ask anything about AI..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={handleSearch}>
            <Ionicons name="arrow-forward-circle" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {currentView.level === 'root' && renderRoot()}
        {currentView.level === 'subfield' && renderSubfields()}
        {currentView.level === 'roadmap' && renderRoadmap()}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FloatingChat isDark={themeMode === 'dark'} pageContext={{ type: 'explore', query: searchQuery }} />
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
    height: 180,
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
  resourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },
  resourceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  topicCount: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyRoadmap: {
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
});
