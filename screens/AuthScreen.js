import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppProvider';
import { DARK, FONTS, LIGHT, RADIUS, SPACING } from '../constants/theme';

const TABS = ['Sign In', 'Sign Up'];

export default function AuthScreen() {
  const { signIn, signUp, authLoading, error, backendKind } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  async function handleSubmit() {
    setLocalError('');
    if (!email.trim() || !password.trim() || (activeTab === 1 && !name.trim())) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    try {
      if (activeTab === 0) {
        await signIn(email.trim(), password);
      } else {
        await signUp({ name: name.trim(), email: email.trim(), password });
      }
    } catch (submitError) {
      setLocalError(submitError.message || 'Authentication failed.');
    }
  }

  function useDemoAccount() {
    setActiveTab(0);
    setName('Alex Builder');
    setEmail('alex@aiscout.dev');
    setPassword('password123');
    setLocalError('');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <LinearGradient
          colors={['#080B14', '#10172A', '#0F1D3F']}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.logoCircle}>
            <Image 
              source={require('../constants/chatbot-icon.png')} 
              style={{ width: 44, height: 44, resizeMode: 'contain' }} 
            />
          </View>
          <Text style={styles.heroTitle}>AI Scout</Text>
          <Text style={styles.heroSubtitle}>
            Daily AI learning, live research, saved reading, and a grounded mobile assistant.
          </Text>
          <View style={styles.backendBadge}>
            <Text style={styles.backendText}>
              {backendKind === 'supabase' ? 'Supabase connected' : 'Local dev backend active'}
            </Text>
          </View>
        </LinearGradient>

        <View style={[styles.card, { flexGrow: 1 }]}>
          <View style={styles.tabRow}>
            {TABS.map((tab, index) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(index)}
                style={[styles.tab, activeTab === index && styles.tabActive]}
              >
                <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 1 && (
            <InputField icon="person-outline" placeholder="Name" value={name} onChangeText={setName} />
          )}
          <InputField icon="mail-outline" placeholder="Email" value={email} onChangeText={setEmail} />
          <InputField
            icon="lock-closed-outline"
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {(localError || error) ? <Text style={styles.errorText}>{localError || error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitButton, authLoading && { opacity: 0.65 }]}
            onPress={handleSubmit}
            disabled={authLoading}
          >
            <Text style={styles.submitText}>{authLoading ? 'Working...' : TABS[activeTab]}</Text>
          </TouchableOpacity>

          {backendKind !== 'supabase' ? (
            <View style={styles.localModeBox}>
              <Text style={styles.helperText}>
                Local mode uses an on-device dev backend so the full app can be tested before Supabase keys are added.
              </Text>
              <Text style={styles.demoTitle}>Demo account</Text>
              <Text style={styles.demoText}>Email: alex@aiscout.dev</Text>
              <Text style={styles.demoText}>Password: password123</Text>
              <TouchableOpacity style={styles.demoButton} onPress={useDemoAccount}>
                <Text style={styles.demoButtonText}>Use demo account</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InputField({ icon, ...props }) {
  return (
    <View style={styles.inputRow}>
      <Ionicons name={icon} size={18} color={LIGHT.textMuted} />
      <TextInput
        {...props}
        style={styles.input}
        autoCapitalize="none"
        placeholderTextColor={LIGHT.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DARK.bg,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'space-between',
  },
  hero: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.xl,
  },
  logoCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.78)',
    maxWidth: 320,
  },
  backendBadge: {
    marginTop: 18,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  backendText: {
    color: '#DBEAFE',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: LIGHT.bgAlt,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.xl,
    minHeight: 420,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: LIGHT.surface,
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: LIGHT.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: LIGHT.primary,
  },
  tabText: {
    fontSize: FONTS.sizes.base,
    fontWeight: '600',
    color: LIGHT.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: LIGHT.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: LIGHT.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: LIGHT.text,
    padding: 0,
  },
  submitButton: {
    backgroundColor: LIGHT.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  helperText: {
    color: LIGHT.textSub,
    fontSize: 13,
    lineHeight: 19,
  },
  localModeBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: LIGHT.surface,
    borderWidth: 1,
    borderColor: LIGHT.border,
    gap: 6,
  },
  demoTitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
    color: LIGHT.text,
  },
  demoText: {
    fontSize: 13,
    color: LIGHT.textSub,
  },
  demoButton: {
    marginTop: 8,
    backgroundColor: LIGHT.primaryLight,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  demoButtonText: {
    color: LIGHT.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
});
