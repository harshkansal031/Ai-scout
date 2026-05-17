import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FloatingChat from '../components/FloatingChat';
import { useApp } from '../context/AppProvider';
import { DARK, LIGHT, RADIUS, SPACING } from '../constants/theme';

function usePalette(themeMode) {
  return themeMode === 'dark' ? DARK : LIGHT;
}

function EventBrandLogo({ category, getBrandLogo, getCompanyGradients, getCompanyIcon }) {
  const [useFallback, setUseFallback] = React.useState(false);
  const logoUrl = getBrandLogo(category);

  if (logoUrl && !useFallback) {
    return (
      <View style={[styles.brandIconStrip, { backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}>
        <Image
          source={{ uri: logoUrl }}
          style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
          onError={() => setUseFallback(true)}
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={getCompanyGradients(category)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.brandIconStrip}
    >
      <Ionicons name={getCompanyIcon(category)} size={24} color="#FFFFFF" />
    </LinearGradient>
  );
}

export default function UpcomingScreen() {
  const {
    themeMode,
    upcomingEvents,
    fetchUpcomingEvents,
    toggleEventReminder,
    getBrandLogo,
  } = useApp();

  const colors = usePalette(themeMode);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'
  const [refreshing, setRefreshing] = useState(false);
  const [remindingEventId, setRemindingEventId] = useState(null);

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUpcomingEvents();
    setRefreshing(false);
  };

  const getCompanyGradients = (category) => {
    switch (category?.toLowerCase()) {
      case 'google':
        return ['#EA4335', '#4285F4'];
      case 'openai':
        return ['#10A37F', '#1F2937'];
      case 'apple':
        return ['#A2AAAD', '#000000'];
      case 'meta':
        return ['#0081FB', '#0668E1'];
      case 'microsoft':
        return ['#00A4EF', '#7FBA00'];
      case 'nvidia':
        return ['#76B900', '#111111'];
      case 'anthropic':
        return ['#CC9A7E', '#191919'];
      case 'huggingface':
      case 'hugging face':
        return ['#FFD21E', '#FF9D00'];
      case 'tesla':
        return ['#E82127', '#111111'];
      case 'supabase':
        return ['#3ECF8E', '#1C1C1C'];
      case 'github':
        return ['#24292E', '#0F172A'];
      case 'amazon':
      case 'aws':
        return ['#FF9900', '#232F3E'];
      case 'ycombinator':
      case 'yc':
        return ['#FF6600', '#E55B00'];
      case 'mit':
      case 'stanford':
      case 'harvard':
      case 'academia':
        return ['#A31D1D', '#8C1515'];
      default:
        return ['#6366F1', '#4F46E5'];
    }
  };

  const getCompanyIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'google':
        return 'logo-google';
      case 'openai':
        return 'infinite-outline';
      case 'apple':
        return 'logo-apple';
      case 'meta':
        return 'pulse-outline';
      case 'microsoft':
        return 'logo-windows';
      case 'nvidia':
        return 'hardware-chip-outline';
      case 'anthropic':
        return 'sparkles-outline';
      case 'huggingface':
      case 'hugging face':
        return 'happy-outline';
      case 'tesla':
        return 'flash-outline';
      case 'supabase':
        return 'terminal-outline';
      case 'github':
        return 'logo-github';
      case 'amazon':
      case 'aws':
        return 'cloud-outline';
      case 'ycombinator':
      case 'yc':
        return 'trending-up-outline';
      case 'mit':
      case 'stanford':
      case 'harvard':
      case 'academia':
        return 'school-outline';
      default:
        return 'rocket-outline';
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return { monthDay: 'TBD', dayName: 'Upcoming', timeStr: '10:00 AM' };
      }
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      
      return {
        monthDay: `${months[d.getMonth()]} ${d.getDate()}`,
        dayName: days[d.getDay()],
        timeStr: `${hours}:${minutes} ${ampm}`,
      };
    } catch {
      return { monthDay: 'TBD', dayName: 'Upcoming', timeStr: '10:00 AM' };
    }
  };

  const getCountdown = (dateStr) => {
    try {
      const diff = new Date(dateStr) - new Date();
      if (diff <= 0) return null;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);

      if (days > 0) return `${days}d ${hours}h left`;
      if (hours > 0) return `${hours}h ${minutes}m left`;
      return `${minutes}m left`;
    } catch {
      return null;
    }
  };

  // Filter events based on active tab relative to current time
  const now = new Date();
  const filteredEvents = (upcomingEvents ?? []).filter((event) => {
    const eventDate = new Date(event.eventDate);
    if (activeTab === 'upcoming') {
      return eventDate >= now || isNaN(eventDate.getTime());
    } else {
      return eventDate < now;
    }
  });

  const handleToggleReminder = async (eventId) => {
    setRemindingEventId(eventId);
    try {
      await toggleEventReminder(eventId);
    } catch (e) {
      console.warn('Reminder toggle error:', e.message);
    } finally {
      setRemindingEventId(null);
    }
  };

  const renderEventItem = ({ item, index }) => {
    const { monthDay, dayName, timeStr } = formatDate(item.eventDate);
    const countdown = getCountdown(item.eventDate);
    const isGoing = item.badgeStatus === 'Going';

    const isDark = themeMode === 'dark';
    const buttonBg = item.isReminderSet 
      ? (isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(217, 119, 6, 0.08)')
      : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)');

    const buttonBorder = item.isReminderSet
      ? (isDark ? 'rgba(245, 158, 11, 0.5)' : 'rgba(217, 119, 6, 0.35)')
      : colors.border;

    const buttonText = item.isReminderSet
      ? (isDark ? '#F59E0B' : '#D97706')
      : colors.text;

    return (
      <View style={styles.timelineRow}>
        {/* Left timeline date details */}
        <View style={styles.timelineLeft}>
          <Text style={[styles.monthDayText, { color: colors.text }]}>{monthDay}</Text>
          <Text style={[styles.dayNameText, { color: colors.textMuted }]}>{dayName}</Text>
        </View>

        {/* Vertical line with circle node connector */}
        <View style={styles.timelineConnector}>
          <View style={[styles.connectorLine, { backgroundColor: colors.border }]} />
          <View style={[styles.connectorDotActive, { backgroundColor: colors.primary, borderColor: colors.surface }]} />
        </View>

        {/* Right timeline details glassmorphic card */}
        <View style={[styles.timelineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.timeText, { color: colors.primary }]}>{timeStr}</Text>
            {countdown && (
              <View style={[styles.countdownBadge, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="time-outline" size={10} color={colors.primary} />
                <Text style={[styles.countdownText, { color: colors.primary }]}>{countdown}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
              {item.organizer || 'AI Scout Host'}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
              {item.location || 'Virtual Webcast'}
            </Text>
          </View>

          <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
            {/* Attendees / Status Badge */}
            <View style={styles.badgeAttendeesGroup}>
              <View style={[styles.statusBadge, { backgroundColor: isGoing ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
                <Text style={[styles.statusText, { color: isGoing ? '#10B981' : '#F59E0B' }]}>
                  {item.badgeStatus}
                </Text>
              </View>
              <Text style={[styles.attendeeCount, { color: colors.textMuted }]}>
                +{item.attendeesCount?.toLocaleString() ?? '100'} going
              </Text>
            </View>
          </View>

          {/* Email / local notify full horizontal button */}
          {activeTab === 'upcoming' && (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => handleToggleReminder(item.id)}
              style={[
                styles.notifyBtnFull,
                {
                  backgroundColor: buttonBg,
                  borderColor: buttonBorder,
                },
              ]}
            >
              <Ionicons
                name={item.isReminderSet ? 'notifications' : 'notifications-outline'}
                size={14}
                color={buttonText}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.notifyBtnFullText,
                  { color: buttonText },
                ]}
              >
                {item.isReminderSet ? "You'll be notified" : 'Notify Me'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Company Brand Dynamic Logo / Gradient Fallback Strip */}
          <EventBrandLogo 
            category={item.category} 
            getBrandLogo={getBrandLogo} 
            getCompanyGradients={getCompanyGradients} 
            getCompanyIcon={getCompanyIcon} 
          />
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconCircle, { backgroundColor: colors.border }]}>
        <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Events Right Now</Text>
      <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
        {activeTab === 'upcoming'
          ? 'Check back later! All upcoming major AI event timelines and releases will show up here.'
          : "You haven't completed or browsed any past tech events yet."}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Events</Text>
        
        {/* Toggle tabs 'Upcoming' vs 'Past' */}
        <View style={[styles.tabSelectorContainer, { backgroundColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'upcoming' && { backgroundColor: colors.surface },
            ]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'upcoming' ? colors.text : colors.textMuted },
                activeTab === 'upcoming' && { fontWeight: '700' },
              ]}
            >
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'past' && { backgroundColor: colors.surface },
            ]}
            onPress={() => setActiveTab('past')}
          >
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'past' ? colors.text : colors.textMuted },
                activeTab === 'past' && { fontWeight: '700' },
              ]}
            >
              Past
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredEvents}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      />

      <FloatingChat isDark={themeMode === 'dark'} pageContext={{ type: 'upcoming-events' }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  tabSelectorContainer: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    padding: 2,
    width: 170,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: 12,
    paddingBottom: 100,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 150,
  },
  timelineLeft: {
    width: 65,
    paddingTop: 12,
    alignItems: 'flex-start',
  },
  monthDayText: {
    fontSize: 15,
    fontWeight: '800',
  },
  dayNameText: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  timelineConnector: {
    width: 30,
    alignItems: 'center',
    position: 'relative',
  },
  connectorLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
  },
  connectorDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    position: 'absolute',
    top: 16,
  },
  timelineCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    paddingRight: 64, // Leaves space for the floating brand icon strip
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  countdownText: {
    fontSize: 9,
    fontWeight: '700',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 8,
  },
  badgeAttendeesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  attendeeCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  notifyBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    marginTop: 10,
    borderWidth: 1,
  },
  notifyBtnFullText: {
    fontSize: 12,
    fontWeight: '700',
  },
  brandIconStrip: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
