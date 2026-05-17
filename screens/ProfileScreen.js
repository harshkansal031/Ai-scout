import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import ProgressRing from '../components/ProgressRing';
import { useApp } from '../context/AppProvider';
import { DARK, LIGHT, RADIUS, SPACING } from '../constants/theme';

function usePalette(themeMode) {
  return themeMode === 'dark' ? DARK : LIGHT;
}

export default function ProfileScreen() {
  const {
    themeMode,
    profile,
    savedItems,
    historyItems,
    notificationPreferences,
    updateThemeMode,
    updateNotificationSettings,
    signOut,
  } = useApp();
  const colors = usePalette(themeMode);
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.profileTop}>
            <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{profile?.name?.charAt(0) ?? 'A'}</Text>
            </LinearGradient>
            <View style={{ flex: 1, paddingLeft: 16 }}>
              <Text style={[styles.userName, { color: colors.text }]}>{profile?.name ?? 'AI Scout User'}</Text>
              <View style={[styles.roleBadge, { backgroundColor: `${profile?.roleColor ?? colors.success}20` }]}>
                <Text style={[styles.roleText, { color: profile?.roleColor ?? colors.success }]}>{profile?.role ?? 'Builder'}</Text>
              </View>
            </View>
            <ProgressRing percent={profile?.stats?.progress ?? 0} size={64} strokeWidth={7} color={colors.primary} bgColor={colors.border} textColor={colors.text} />
          </View>

          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            <StatCard value={profile?.stats?.topics ?? 0} label="Topics" colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.7} onPress={() => navigation.navigate('SavedContent')}>
              <StatCard value={savedItems.length} label="Saved" colors={colors} />
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <StatCard value={profile?.stats?.streak ?? 0} label="Streak" colors={colors} />
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon="bookmark-outline"
            label="Saved items & bookmarks"
            colors={colors}
            onPress={() => navigation.navigate('SavedContent')}
          />
          <Divider colors={colors} />
          <SettingRow
            icon="moon-outline"
            label="Dark mode"
            colors={colors}
            toggle
            value={themeMode === 'dark'}
            onValueChange={(enabled) => updateThemeMode(enabled ? 'dark' : 'light')}
          />
          <Divider colors={colors} />
          <SettingRow
            icon="notifications-outline"
            label="Daily topic alerts"
            colors={colors}
            toggle
            value={notificationPreferences.dailyTopic}
            onValueChange={(enabled) => updateNotificationSettings({ dailyTopic: enabled })}
          />
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent history</Text>
          {historyItems.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.historyRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.historyTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.historyMeta, { color: colors.textMuted }]}>{item.completedAt}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
        <View style={{ height: 100 }} />
      </ScrollView>
     </SafeAreaView>
  );
}

function StatCard({ value, label, colors }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function Divider({ colors }) {
  return <View style={[styles.settingRowDivider, { backgroundColor: colors.border }]} />;
}

function SettingRow({ icon, label, colors, toggle, value, onValueChange, onPress }) {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container style={styles.settingRow} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.settingIcon, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[styles.settingLabel, { color: colors.text }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      {toggle ? (
        <Switch value={value} onValueChange={onValueChange} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFFFFF" />
      ) : (
        onPress && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      )}
    </Container>
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
  scrollContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: 8,
  },
  profileCard: {
    borderRadius: RADIUS.xl,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 27,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
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
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  sectionCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 16,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingRowDivider: {
    height: 1,
    marginLeft: 64,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyMeta: {
    fontSize: 12,
    marginTop: 3,
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
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
});
