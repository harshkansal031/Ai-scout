import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CHAT_SUGGESTIONS } from '../constants/mockData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ChatMessage({ role, text }) {
  const isUser = role === 'user';
  return (
    <View style={[
      styles.msgRow,
      isUser ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
    ]}>
      {!isUser && (
        <View style={styles.botAvatar}>
          <Ionicons name="hardware-chip-outline" size={14} color="#2563EB" />
        </View>
      )}
      <View style={[styles.msgBubble, isUser ? styles.userBubble : styles.botBubble]}>
        <Text style={[styles.msgText, isUser ? styles.userText : styles.botText]}>{text}</Text>
      </View>
    </View>
  );
}

export default function FloatingChat({ isDark = false, pageContext = null }) {
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState([
    { id: '0', role: 'bot', text: 'Hi Alex! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef(null);
  const insets = useSafeAreaInsets();

  const handleOpen = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    setVisible(true);
  };

  const sendMessage = useCallback((text = input.trim()) => {
    if (!text) return;
    const newMsg = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = getAIReply(text, pageContext);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', text: reply }]);
      setIsTyping(false);
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 1200);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [input, pageContext]);

  const getAIReply = (question, ctx) => {
    const q = question.toLowerCase();
    if (q.includes('rag')) return 'RAG (Retrieval-Augmented Generation) combines a retriever and a generator. The retriever finds relevant documents from a knowledge base, then feeds them as context to the LLM so it can answer accurately. Great for keeping answers grounded in real data!';
    if (q.includes('fine-tun')) return 'Fine-tuning bakes knowledge into model weights — great for style and format. RAG retrieves knowledge at runtime — better for fresh or private data. Most production systems use RAG for factual accuracy.';
    if (q.includes('build') || q.includes('agent')) return 'To build a RAG agent: 1) Chunk your documents, 2) Embed them with an embedding model, 3) Store in a vector DB (Pinecone, Qdrant, Chroma), 4) At query time, embed the question, retrieve top-k chunks, 5) Pass chunks as context to your LLM. LlamaIndex makes this easy!';
    if (q.includes('tool')) return 'Top RAG tools: LlamaIndex (best for RAG pipelines), LangChain (flexible chains), Haystack (production-ready), and Chroma/Pinecone for vector storage. LlamaIndex is my top pick for getting started quickly.';
    return `Great question about "${question}"! For the current topic of RAG Agents, this relates to how retrieval systems augment LLM capabilities. Would you like me to explain a specific aspect in more detail?`;
  };

  return (
    <>
      {/* Floating Button */}
      <Animated.View style={[styles.fabContainer, { transform: [{ scale: scaleAnim }], bottom: 90 + insets.bottom }]}>
        <TouchableOpacity onPress={handleOpen} style={[styles.fab, isDark ? styles.fabDark : styles.fabLight]}>
          <View style={styles.fabInner}>
            <Ionicons name="hardware-chip-outline" size={22} color="#FFFFFF" />
            <View style={styles.fabDot} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kvAware}
        >
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleRow}>
                <View style={styles.sheetIcon}>
                  <Ionicons name="hardware-chip-outline" size={16} color="#2563EB" />
                </View>
                <Text style={styles.sheetTitle}>Ask AI</Text>
              </View>
              <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollRef}
              style={styles.messages}
              contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 16, gap: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {messages.map(m => <ChatMessage key={m.id} role={m.role} text={m.text} />)}
              {isTyping && (
                <View style={[styles.msgRow, { justifyContent: 'flex-start' }]}>
                  <View style={styles.botAvatar}>
                    <Ionicons name="hardware-chip-outline" size={14} color="#2563EB" />
                  </View>
                  <View style={[styles.msgBubble, styles.botBubble]}>
                    <Text style={[styles.msgText, styles.botText]}>Thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Suggestions */}
            {messages.length <= 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.suggestScroll}
                contentContainerStyle={styles.suggestContainer}
              >
                {CHAT_SUGGESTIONS.map(s => (
                  <TouchableOpacity key={s.id} onPress={() => sendMessage(s.text)} style={styles.suggestChip}>
                    <Text style={styles.suggestText}>{s.text}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Input */}
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Ask anything..."
                placeholderTextColor="#94A3B8"
                style={styles.input}
                onSubmitEditing={() => sendMessage()}
                returnKeyType="send"
                multiline={false}
              />
              <TouchableOpacity
                onPress={() => sendMessage()}
                style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
                disabled={!input.trim()}
              >
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
    maxHeight: 520,
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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: {
    maxHeight: 240,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 4,
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
    maxHeight: 44,
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
});
