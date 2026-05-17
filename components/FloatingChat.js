import React, { useCallback, useRef, useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CHAT_SUGGESTIONS } from '../constants/mockData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppProvider';
 
function CustomRobotIcon({ size = 'medium' }) {
  const isSmall = size === 'small';
  const dimension = isSmall ? 22 : 100;
  
  return (
    <Image
      source={require('../constants/chatbot-icon.png')}
      style={{
        width: dimension,
        height: dimension,
        resizeMode: 'contain',
      }}
    />
  );
}

function ChatMessage({ role, text }) {
  const isUser = role === 'user';
  return (
    <View style={[styles.msgRow, isUser ? styles.userRow : styles.botRow]}>
      {!isUser ? (
        <View style={styles.botAvatar}>
          <CustomRobotIcon size="small" />
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
  const hoverAnim = useRef(new Animated.Value(0)).current;
  const wiggleAnim = useRef(new Animated.Value(0)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current; // Clockwise/anticlockwise slow rocking
  const scrollRef = useRef(null);
  const insets = useSafeAreaInsets();
  const activeStream = useRef(null);

  // 1. Idle Floating & Slow Clockwise/Anticlockwise Rocking Loop
  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(hoverAnim, {
          toValue: -6,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(hoverAnim, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    );

    const tilt = Animated.loop(
      Animated.sequence([
        Animated.timing(tiltAnim, {
          toValue: 1, // Clockwise tilt
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(tiltAnim, {
          toValue: -1, // Anticlockwise tilt
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(tiltAnim, {
          toValue: 0, // Center
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    float.start();
    tilt.start();

    return () => {
      float.stop();
      tilt.stop();
    };
  }, []);

  // 2. Active Talking Wiggle Animation Loop when bot isTyping
  useEffect(() => {
    let wiggleLoop = null;
    if (isTyping) {
      wiggleLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(wiggleAnim, {
            toValue: -4,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(wiggleAnim, {
            toValue: 4,
            duration: 240,
            useNativeDriver: true,
          }),
          Animated.timing(wiggleAnim, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
          }),
        ])
      );
      wiggleLoop.start();
    } else {
      wiggleAnim.setValue(0);
    }
    return () => {
      if (wiggleLoop) wiggleLoop.stop();
    };
  }, [isTyping]);

  useEffect(() => {
    return () => {
      if (activeStream.current) clearInterval(activeStream.current);
    };
  }, []);

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

    if (activeStream.current) {
      clearInterval(activeStream.current);
      activeStream.current = null;
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
      const fullAnswer = `${reply.answer}${citationLine}`;
      
      setIsTyping(false);

      // Streaming setup: split into words and spaces to preserve formatting
      const tokens = fullAnswer.match(/([^\s]+|\s+)/g) || [fullAnswer];
      let tokenIndex = 0;
      const botMsgId = `${Date.now()}-reply`;

      // Insert blank message shell for bot
      setMessages((prev) => [...prev, { id: botMsgId, role: 'bot', text: '' }]);

      // Stream tokens word-by-word
      const intervalId = setInterval(() => {
        if (tokenIndex < tokens.length) {
          tokenIndex++;
          const nextText = tokens.slice(0, tokenIndex).join('');
          setMessages((prev) =>
            prev.map((msg) => (msg.id === botMsgId ? { ...msg, text: nextText } : msg))
          );
          scrollRef.current?.scrollToEnd({ animated: false });
        } else {
          clearInterval(intervalId);
          activeStream.current = null;
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
        }
      }, 22);

      activeStream.current = intervalId;
    } catch (error) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-reply`,
          role: 'bot',
          text: error.message || 'The assistant is temporarily unavailable.',
        },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    }
  }, [input, pageContext, sendChatMessage, useContext]);

  const rotateVal = isTyping
    ? wiggleAnim.interpolate({
        inputRange: [-4, 4],
        outputRange: ['-6deg', '6deg'],
      })
    : tiltAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: ['-6deg', '6deg'],
      });

  return (
    <>
      <Animated.View
        style={[
          styles.fabContainer,
          {
            bottom: 15 + insets.bottom,
            transform: [
              { scale: scaleAnim },
              { translateY: hoverAnim },
              { rotate: rotateVal },
            ],
          },
        ]}
      >
        <TouchableOpacity onPress={handleOpen} style={[styles.fab, isDark ? styles.fabDark : styles.fabLight]}>
          <View style={styles.fabInner}>
            <CustomRobotIcon />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kvAware}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <View style={styles.sheetIcon}>
                  <CustomRobotIcon size="small" />
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
                    <CustomRobotIcon size="small" />
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
    right: 8,
    zIndex: 100,
  },
  fab: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLight: {
    backgroundColor: 'transparent',
  },
  fabDark: {
    backgroundColor: 'transparent',
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
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
    maxHeight: 330,
  },
  messagesContent: {
    paddingTop: 12,
    paddingBottom: 40,
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
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
  robotHead: {
    width: 28,
    height: 22,
    borderRadius: 7,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  robotEarLeft: {
    position: 'absolute',
    left: -2,
    width: 2,
    height: 6,
    borderTopLeftRadius: 1.5,
    borderBottomLeftRadius: 1.5,
    backgroundColor: '#94A3B8',
  },
  robotEarRight: {
    position: 'absolute',
    right: -2,
    width: 2,
    height: 6,
    borderTopRightRadius: 1.5,
    borderBottomRightRadius: 1.5,
    backgroundColor: '#94A3B8',
  },
  robotFaceScreen: {
    width: 20,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 1.5,
  },
  robotEyesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 12,
    marginBottom: 0.5,
  },
  robotEye: {
    width: 4,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#38BDF8',
  },
  robotMouth: {
    width: 3,
    height: 2,
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
    backgroundColor: '#38BDF8',
  },
});
