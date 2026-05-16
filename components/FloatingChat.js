import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CHAT_SUGGESTIONS } from '../constants/mockData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppProvider';

function ChatMessage({ role, text }) {
  const isUser = role === 'user';
  return (
    <View style={[styles.msgRow, isUser ? styles.userRow : styles.botRow]}>
      {!isUser ? (
        <View style={styles.botAvatar}>
          <Ionicons name="hardware-chip-outline" size={14} color="#2563EB" />
        </View>
      ) : null}
      <View style={[styles.msgBubble, isUser ? styles.userBubble : styles.botBubble]}>
        <Text style={[styles.msgText, isUser ? styles.userText : styles.botText]}>{text}</Text>
      </View>
    </View>
  );
}

export default function FloatingChat({ isDark = false, pageContext = null }) {
  const { sendChatMessage } = useApp();
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState([{ id: '0', role: 'bot', text: 'Hi Alex! What would you like to understand better?' }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [useContext, setUseContext] = useState(!!pageContext);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef(null);
  const insets = useSafeAreaInsets();

  const handleOpen = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    setVisible(true);
  };

  const handleSend = useCallback(async (rawText = input.trim()) => {
    if (!rawText) {
      return;
    }

    const userMessage = { id: `${Date.now()}`, role: 'user', text: rawText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);

    try {
      const activeContext = useContext ? pageContext : null;
      const reply = await sendChatMessage(rawText, activeContext);
      const citationLine = reply.citations?.length ? `\n\nSources: ${reply.citations.join(' | ')}` : '';
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-reply`,
          role: 'bot',
          text: `${reply.answer}${citationLine}`,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-reply`,
          role: 'bot',
          text: error.message || 'The assistant is temporarily unavailable.',
        },
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [input, pageContext, sendChatMessage]);

  return (
    <>
      <Animated.View style={[styles.fabContainer, { transform: [{ scale: scaleAnim }], bottom: 90 + insets.bottom }]}>
        <TouchableOpacity onPress={handleOpen} style={[styles.fab, isDark ? styles.fabDark : styles.fabLight]}>
          <View style={styles.fabInner}>
            <Ionicons name="hardware-chip-outline" size={22} color="#FFFFFF" />
            <View style={styles.fabDot} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kvAware}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <View style={styles.sheetIcon}>
                  <Ionicons name="hardware-chip-outline" size={16} color="#2563EB" />
                </View>
                <View style={styles.titleTextWrapper}>
                  <Text style={styles.sheetTitle}>Ask AI</Text>
                  {pageContext ? (
                    <View style={styles.contextToggleRow}>
                      <Text style={styles.sheetSubtitle}>{pageContext.type === 'lecture' ? 'Topic Context' : `Context: ${pageContext.type}`}</Text>
                      <Switch
                        value={useContext}
                        onValueChange={setUseContext}
                        style={{ transform: [{ scaleX: 0.6 }, { scaleY: 0.6 }] }}
                        trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                        thumbColor={useContext ? '#2563EB' : '#F8FAFC'}
                      />
                    </View>
                  ) : (
                    <Text style={styles.sheetSubtitle}>General assistant</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={scrollRef}
              style={styles.messages}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message) => (
                <ChatMessage key={message.id} role={message.role} text={message.text} />
              ))}
              {isTyping ? (
                <View style={[styles.msgRow, styles.botRow]}>
                  <View style={styles.botAvatar}>
                    <Ionicons name="hardware-chip-outline" size={14} color="#2563EB" />
                  </View>
                  <View style={[styles.msgBubble, styles.botBubble]}>
                    <Text style={[styles.msgText, styles.botText]}>Thinking...</Text>
                  </View>
                </View>
              ) : null}
            </ScrollView>

            {messages.length <= 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestScroll} contentContainerStyle={styles.suggestContainer}>
                {CHAT_SUGGESTIONS.map((suggestion) => (
                  <TouchableOpacity key={suggestion.id} onPress={() => handleSend(suggestion.text)} style={styles.suggestChip}>
                    <Text style={styles.suggestText}>{suggestion.text}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}

            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask anything..."
                placeholderTextColor="#94A3B8"
                style={styles.input}
                onSubmitEditing={() => handleSend()}
                returnKeyType="send"
              />
              <TouchableOpacity onPress={() => handleSend()} style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} disabled={!input.trim()}>
                <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fabLight: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
  },
  fabDark: {
    backgroundColor: '#1D4ED8',
    shadowColor: '#3B82F6',
  },
  fabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fabDot: {
    position: 'absolute',
    top: -12,
    right: -14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  kvAware: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: 540,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  titleTextWrapper: {
    flexDirection: 'column',
  },
  contextToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -2,
    marginLeft: -4,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: {
    maxHeight: 260,
  },
  messagesContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  botBubble: {
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  botText: {
    color: '#0F172A',
  },
  userText: {
    color: '#FFFFFF',
  },
  suggestScroll: {
    maxHeight: 48,
  },
  suggestContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
    flexDirection: 'row',
  },
  suggestChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  suggestText: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
