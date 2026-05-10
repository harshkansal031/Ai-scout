import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import FloatingChat from '../components/FloatingChat';
import ProgressRing from '../components/ProgressRing';
import { SAVED_ITEMS, HISTORY_ITEMS, USER_PROFILE } from '../constants/mockData';
import { LIGHT, FONTS, SPACING, RADIUS } from '../constants/theme';

const C = LIGHT;
const PROFILE_TABS = ['Saved', 'History', 'Downloads'];

function AvatarPlaceholder({ size = 72 }) {
  return (
    <LinearGradient
      colors={['#2563EB', '#1D4ED8']}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.38, fontWeight: '800', color: '#FFFFFF' }}>
        {USER_PROFILE.name.charAt(0)}
      </Text>
    </LinearGradient>
  );
}

function StatCard({ value, label }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SavedItemRow({ item, onUnsave }) {
  return (
    <TouchableOpacity style={styles.itemRow} activeOpacity={0.85}>
      <LinearGradient
        colors={item.imageGradient}
        style={styles.itemThumb}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="book-outline" size={16} color="rgba(255,255,255,0.7)" />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
          <Ionicons name="time-outline" size={11} color={C.textMuted} />
          <Text style={styles.itemMeta}>{item.time}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => onUnsave && onUnsave(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="bookmark" size={20} color={C.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function HistoryItemRow({ item }) {
  return (
    <TouchableOpacity style={styles.itemRow} activeOpacity={0.85}>
      <LinearGradient
        colors={item.imageGradient}
        style={styles.itemThumb}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="checkmark-circle" size={18} color="rgba(255,255,255,0.85)" />
      </LinearGradient>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <View style={[styles.typeBadge, { backgroundColor: C.successBg }]}>
            <Text style={[styles.typeText, { color: C.success }]}>{item.type}</Text>
          </View>
          <Text style={styles.itemMeta}>{item.completedAt}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
    </TouchableOpacity>
  );
}

function SettingRow({ icon, label, value, onPress, toggle, toggleValue, onToggle }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.settingRow} activeOpacity={toggle ? 1 : 0.7}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={18} color={C.primary} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: C.border, true: C.primary }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={C.border}
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {value && <Text style={styles.settingValue}>{value}</Text>}
          <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState(0);
  const [saved, setSaved] = useState(SAVED_ITEMS);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleUnsave = (id) => {
    setSaved(prev => prev.filter(item => item.id !== id));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={22} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatarWrapper}>
              <AvatarPlaceholder size={72} />
              <TouchableOpacity style={styles.editAvatarBtn}>
                <Ionicons name="pencil" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, paddingLeft: 16 }}>
              <Text style={styles.userName}>{USER_PROFILE.name}</Text>
              <View style={[styles.roleBadge, { backgroundColor: USER_PROFILE.roleColor + '20' }]}>
                <Text style={[styles.roleText, { color: USER_PROFILE.roleColor }]}>{USER_PROFILE.role}</Text>
              </View>
            </View>
            <ProgressRing
              percent={USER_PROFILE.stats.progress}
              size={64}
              strokeWidth={7}
              color={C.primary}
              bgColor={C.border}
              textColor={C.text}
              textSubColor={C.textMuted}
            />
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatCard value={USER_PROFILE.stats.topics} label="Topics" />
            <View style={styles.statDivider} />
            <StatCard value={USER_PROFILE.stats.saved} label="Saved" />
            <View style={styles.statDivider} />
            <StatCard value={`${USER_PROFILE.stats.streak}`} label="Day streak" />
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{USER_PROFILE.stats.progress}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabsContainer}>
          {PROFILE_TABS.map((tab, idx) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(idx)}
              style={[styles.tabItem, activeTab === idx && styles.tabItemActive]}
            >
              <Text style={[styles.tabText, activeTab === idx && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 0 && (
          <View>
            {saved.length > 0 ? (
              saved.map(item => (
                <SavedItemRow key={item.id} item={item} onUnsave={handleUnsave} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="bookmark-outline" size={44} color={C.textMuted} />
                <Text style={styles.emptyTitle}>Nothing saved yet</Text>
                <Text style={styles.emptyDesc}>Bookmark topics and papers to find them here.</Text>
                <TouchableOpacity
                  style={styles.exploreBtn}
                  onPress={() => navigation.navigate('Explore')}
                >
                  <Text style={styles.exploreBtnText}>Browse Explore</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === 1 && (
          <View>
            {HISTORY_ITEMS.length > 0 ? (
              HISTORY_ITEMS.map(item => (
                <HistoryItemRow key={item.id} item={item} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={44} color={C.textMuted} />
                <Text style={styles.emptyTitle}>No history yet</Text>
                <Text style={styles.emptyDesc}>Complete topics to build your learning history.</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 2 && (
          <View style={styles.emptyState}>
            <Ionicons name="download-outline" size={44} color={C.textMuted} />
            <Text style={styles.emptyTitle}>No downloads yet</Text>
            <Text style={styles.emptyDesc}>Downloaded content for offline reading will appear here.</Text>
          </View>
        )}

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>Preferences</Text>
          <View style={styles.settingsCard}>
            <SettingRow
              icon="notifications-outline"
              label="Daily reminders"
              toggle
              toggleValue={notifEnabled}
              onToggle={setNotifEnabled}
            />
            <View style={styles.settingRowDivider} />
            <SettingRow
              icon="moon-outline"
              label="Dark mode"
              toggle
              toggleValue={darkModeEnabled}
              onToggle={setDarkModeEnabled}
            />
            <View style={styles.settingRowDivider} />
            <SettingRow
              icon="bar-chart-outline"
              label="Skill level"
              value="Intermediate"
              onPress={() => {}}
            />
            <View style={styles.settingRowDivider} />
            <SettingRow
              icon="language-outline"
              label="Language"
              value="English"
              onPress={() => {}}
            />
          </View>

          <Text style={[styles.settingsSectionTitle, { marginTop: 20 }]}>Account</Text>
          <View style={styles.settingsCard}>
            <SettingRow icon="person-outline" label="Edit profile" onPress={() => {}} />
            <View style={styles.settingRowDivider} />
            <SettingRow icon="shield-outline" label="Privacy" onPress={() => {}} />
            <View style={styles.settingRowDivider} />
            <SettingRow icon="help-circle-outline" label="Help & feedback" onPress={() => {}} />
            <View style={styles.settingRowDivider} />
            <SettingRow icon="information-circle-outline" label="About" value="v1.0.0" onPress={() => {}} />
          </View>

          <TouchableOpacity style={styles.signOutBtn}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <FloatingChat isDark={false} pageContext={{ type: 'profile' }} />
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
  scrollContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: 8,
  },
  profileCard: {
    backgroundColor: LIGHT.surface,
    borderRadius: RADIUS.xl,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: LIGHT.border,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: LIGHT.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: LIGHT.surface,
  },
  userName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: LIGHT.text,
    marginBottom: 6,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: LIGHT.border,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: LIGHT.text,
  },
  statLabel: {
    fontSize: 11,
    color: LIGHT.textMuted,
    marginTop: 3,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: LIGHT.border,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: LIGHT.surface,
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LIGHT.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  tabItemActive: {
    backgroundColor: LIGHT.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: LIGHT.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  itemRow: {
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
  itemThumb: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: LIGHT.text,
  },
  itemMeta: {
    fontSize: 12,
    color: LIGHT.textMuted,
    fontWeight: '500',
  },
  typeBadge: {
    backgroundColor: LIGHT.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  typeText: {
    fontSize: 11,
    color: LIGHT.primary,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: LIGHT.text,
  },
  emptyDesc: {
    fontSize: 14,
    color: LIGHT.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 32,
  },
  exploreBtn: {
    backgroundColor: LIGHT.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    marginTop: 6,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  settingsSection: {
    marginTop: 8,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: LIGHT.text,
    marginBottom: 10,
  },
  settingsCard: {
    backgroundColor: LIGHT.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: LIGHT.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: LIGHT.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: LIGHT.text,
  },
  settingValue: {
    fontSize: 14,
    color: LIGHT.textMuted,
    fontWeight: '500',
  },
  settingRowDivider: {
    height: 1,
    backgroundColor: LIGHT.border,
    marginLeft: 64,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 16,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
});
