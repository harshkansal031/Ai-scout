import {
  CHAT_SUGGESTIONS,
  CONTINUE_LEARNING,
  DAILY_TOPIC,
  EXPLORE_PAPERS,
  EXPLORE_TOOLS,
  EXPLORE_TOPICS,
  HISTORY_ITEMS,
  NEWS_ITEMS,
  PROGRESS,
  SAVED_ITEMS,
  USER_PROFILE,
} from '../constants/mockData.js';
import { buildCitationLabel, groupExploreResults, normalizeContentItem, normalizeTopic } from './mappers.js';

const listeners = new Set();
const DEMO_USER = {
  id: 'local-demo-user',
  email: 'alex@aiscout.dev',
  password: 'password123',
  name: 'Alex Builder',
};

function createDemoProfile() {
  return {
    id: DEMO_USER.id,
    email: DEMO_USER.email,
    name: DEMO_USER.name,
    role: USER_PROFILE.role,
    roleColor: USER_PROFILE.roleColor,
    skillLevel: 'Intermediate',
    interests: ['RAG', 'Agents', 'LLMs'],
    themeMode: 'light',
    stats: { ...USER_PROFILE.stats },
  };
}

function createDemoProgress() {
  return {
    weeklyPercent: PROGRESS.weeklyPercent,
    topicsCompleted: PROGRESS.topicsCompleted,
    topicsTotal: PROGRESS.topicsTotal,
    weekDays: PROGRESS.weekDays,
    streak: PROGRESS.streak,
    completedTopicIds: HISTORY_ITEMS.map((item) => item.id),
    history: HISTORY_ITEMS,
  };
}

function createSeedState() {
  const dailyTopic = normalizeTopic(DAILY_TOPIC);
  const topicItems = EXPLORE_TOPICS.map((topic) => ({
    ...normalizeTopic(topic),
    type: 'topic',
    source_name: 'AI Scout',
    source_url: '',
    summary: `Study ${topic.title} in a focused lesson.`,
  }));

  const paperItems = EXPLORE_PAPERS.map((paper) => ({
    id: paper.id,
    type: 'paper',
    category: 'Papers',
    title: paper.title,
    summary: `${paper.source} ${paper.year}`,
    source_name: paper.source,
    source_url: '',
    published_at: `${paper.year}-01-01`,
    tags: ['paper'],
    saved: paper.saved,
  }));

  const toolItems = EXPLORE_TOOLS.map((tool) => ({
    id: tool.id,
    type: 'tool',
    category: 'Tools',
    title: tool.name,
    summary: tool.description,
    source_name: 'AI Scout',
    source_url: '',
    tags: ['tool'],
  }));

  const newsItems = NEWS_ITEMS.map((item) => ({
    id: item.id,
    type: item.category.toLowerCase() === 'papers' ? 'paper' : item.category.toLowerCase() === 'research' ? 'research' : 'news',
    category: item.category,
    title: item.title,
    summary: `${item.category} highlight for builders.`,
    source_name: item.category,
    source_url: '',
    time: item.time,
    tags: [item.category.toLowerCase()],
    saved: item.saved,
    imageGradient: item.imageGradient,
    categoryColor: item.categoryColor,
  }));

  const savedContent = SAVED_ITEMS.map((item) => ({
    id: item.id,
    type: item.type.toLowerCase(),
    category: item.type,
    title: item.title,
    summary: `${item.time} focused study item.`,
    source_name: 'AI Scout',
    source_url: '',
    time: item.time,
    imageGradient: item.imageGradient,
  }));

  const demoProfile = createDemoProfile();
  const demoProgress = createDemoProgress();

  return {
    users: [DEMO_USER],
    session: null,
    profiles: {
      [DEMO_USER.id]: demoProfile,
    },
    notificationPreferences: {
      [DEMO_USER.id]: { dailyTopic: true, breakingNews: true, papers: true },
    },
    deviceTokens: {},
    bookmarks: {
      [DEMO_USER.id]: [],
    },
    progress: {
      [DEMO_USER.id]: demoProgress,
    },
    chatSessions: {
      [DEMO_USER.id]: [],
    },
    dailyTopics: [dailyTopic],
    contentItems: [...newsItems, ...paperItems, ...toolItems, ...savedContent],
    continueLearning: CONTINUE_LEARNING,
    historyTemplates: HISTORY_ITEMS,
    chatSuggestions: CHAT_SUGGESTIONS,
    exploreTopics: topicItems,
    progressTemplate: PROGRESS,
    defaultProfile: USER_PROFILE,
  };
}

function migrateState(state) {
  const nextState = {
    ...state,
    users: state.users ?? [],
    profiles: state.profiles ?? {},
    notificationPreferences: state.notificationPreferences ?? {},
    deviceTokens: state.deviceTokens ?? {},
    bookmarks: state.bookmarks ?? {},
    progress: state.progress ?? {},
    chatSessions: state.chatSessions ?? {},
  };

  const hasDemoUser = nextState.users.some(
    (user) => user.email?.toLowerCase() === DEMO_USER.email,
  );

  if (!hasDemoUser) {
    nextState.users = [...nextState.users, DEMO_USER];
  }

  if (!nextState.profiles[DEMO_USER.id]) {
    nextState.profiles[DEMO_USER.id] = createDemoProfile();
  }

  if (!nextState.progress[DEMO_USER.id]) {
    nextState.progress[DEMO_USER.id] = createDemoProgress();
  }

  if (!nextState.notificationPreferences[DEMO_USER.id]) {
    nextState.notificationPreferences[DEMO_USER.id] = {
      dailyTopic: true,
      breakingNews: true,
      papers: true,
    };
  }

  if (!nextState.bookmarks[DEMO_USER.id]) {
    nextState.bookmarks[DEMO_USER.id] = [];
  }

  if (!nextState.chatSessions[DEMO_USER.id]) {
    nextState.chatSessions[DEMO_USER.id] = [];
  }

  return nextState;
}

function buildUserProfile(state, userId, email, name) {
  const existing = state.profiles[userId];
  if (existing) return existing;
  return {
    id: userId,
    email,
    name: name ?? state.defaultProfile.name,
    role: state.defaultProfile.role,
    roleColor: state.defaultProfile.roleColor,
    skillLevel: 'Intermediate',
    interests: ['RAG', 'Agents', 'LLMs'],
    themeMode: 'light',
    stats: { ...state.defaultProfile.stats },
  };
}

function buildDefaultProgress(state, userId) {
  if (state.progress[userId]) return state.progress[userId];
  return {
    weeklyPercent: state.progressTemplate.weeklyPercent,
    topicsCompleted: state.progressTemplate.topicsCompleted,
    topicsTotal: state.progressTemplate.topicsTotal,
    weekDays: state.progressTemplate.weekDays,
    streak: state.progressTemplate.streak,
    completedTopicIds: state.historyTemplates.map((item) => item.id),
    history: state.historyTemplates,
  };
}

function createSession(user) {
  return { user: { id: user.id, email: user.email } };
}

function matchesSearch(item, query) {
  const haystack = [item.title, item.summary, item.category, item.source_name, ...(item.tags ?? [])].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function computeSavedItems(state, userId) {
  const bookmarkList = state.bookmarks[userId] ?? [];
  return bookmarkList
    .map((bookmark) => {
      if (bookmark.contentType === 'topic') {
        const topic = (state.dailyTopics ?? []).find((t) => t.id === bookmark.contentId) 
                   || (state.exploreTopics ?? []).find((t) => t.id === bookmark.contentId);
        if (!topic) return null;
        return {
          id: topic.id,
          type: 'Topic',
          category: 'Topic',
          categoryColor: '#059669',
          title: topic.title,
          summary: topic.description || topic.short_desc || '',
          time: '35 min',
          saved: true,
          imageGradient: ['#059669', '#10B981'],
          metadata: { difficulty: topic.difficulty },
        };
      } else {
        const item = (state.contentItems ?? []).find((i) => i.id === bookmark.contentId);
        if (!item) return null;
        return {
          ...normalizeContentItem(item),
          type: capitalize(item.type ?? item.category ?? 'Item'),
          time: item.time ?? item.metadata?.duration ?? '15 min',
        };
      }
    })
    .filter(Boolean);
}

function computeHistory(state, userId) {
  return (buildDefaultProgress(state, userId).history ?? []).map((item) => ({ ...item, time: item.time ?? '20 min' }));
}

function personalizeChatReply(message, pageContext, state) {
  const lower = message.toLowerCase();
  if (lower.includes('rag')) {
    return {
      answer: 'RAG combines retrieval with generation so the model answers using fresh context instead of only its training memory. In Scout, that means today’s topic, papers, and saved resources can all be used as grounded context.',
      citations: [buildCitationLabel(state.dailyTopics[0])],
    };
  }
  if (lower.includes('bookmark')) {
    return {
      answer: 'Bookmarks are saved per user so you can return to topics, news, and papers later. The Saved tab reflects those items immediately after the mutation succeeds.',
      citations: ['AI Scout Saved Library'],
    };
  }
  if (pageContext?.type === 'news') {
    return {
      answer: 'This news feed is grouped into latest coverage, research, and papers. The backend can refresh it from feeds and deduplicate repeated stories before showing them here.',
      citations: ['AI Scout News Feed'],
    };
  }
  if (pageContext?.type === 'explore' && pageContext?.query) {
    return {
      answer: `For "${pageContext.query}", the explore backend groups topics, papers, tools, and related news so you can scan the field instead of reading a single list.`,
      citations: ['AI Scout Explore Search'],
    };
  }
  return {
    answer: `I can help with ${pageContext?.type ?? 'this screen'}. Try asking for a simpler explanation, practical takeaway, or the most useful next resource.`,
    citations: ['AI Scout Assistant'],
  };
}

function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function createLocalBackend(storage) {
  const readState = async () => {
    const raw = await storage.getItem();
    if (!raw) {
      const seed = createSeedState();
      await storage.setItem(seed);
      return seed;
    }
    const migrated = migrateState(raw);
    await storage.setItem(migrated);
    return migrated;
  };

  const writeState = async (state) => {
    await storage.setItem(state);
  };

  const emit = (event, session) => {
    listeners.forEach((listener) => listener(event, session));
  };

  return {
    kind: 'local',
    isConfigured: true,
    async getSession() {
      const state = await readState();
      return state.session;
    },
    onAuthStateChange(callback) {
      listeners.add(callback);
      return { unsubscribe() { listeners.delete(callback); } };
    },
    async signUp({ email, password, name }) {
      const state = await readState();
      const existing = state.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
      if (existing) throw new Error('An account with this email already exists.');
      const user = { id: `local-${Date.now()}`, email, password, name: name || email.split('@')[0] };
      state.users.push(user);
      state.profiles[user.id] = buildUserProfile(state, user.id, user.email, user.name);
      state.progress[user.id] = buildDefaultProgress(state, user.id);
      state.notificationPreferences[user.id] = { dailyTopic: true, breakingNews: true, papers: true };
      state.bookmarks[user.id] = [];
      state.chatSessions[user.id] = [];
      state.session = createSession(user);
      await writeState(state);
      emit('SIGNED_IN', state.session);
      return state.session;
    },
    async signIn({ email, password }) {
      const state = await readState();
      const normalizedEmail = email.toLowerCase();
      let user = state.users.find((entry) => entry.email.toLowerCase() === normalizedEmail && entry.password === password);

      if (!user && normalizedEmail === DEMO_USER.email && password === DEMO_USER.password) {
        state.users.push(DEMO_USER);
        state.profiles[DEMO_USER.id] = state.profiles[DEMO_USER.id] ?? createDemoProfile();
        state.progress[DEMO_USER.id] = state.progress[DEMO_USER.id] ?? createDemoProgress();
        state.notificationPreferences[DEMO_USER.id] = state.notificationPreferences[DEMO_USER.id] ?? {
          dailyTopic: true,
          breakingNews: true,
          papers: true,
        };
        state.bookmarks[DEMO_USER.id] = state.bookmarks[DEMO_USER.id] ?? [];
        state.chatSessions[DEMO_USER.id] = state.chatSessions[DEMO_USER.id] ?? [];
        user = DEMO_USER;
      }

      if (!user) throw new Error('Invalid email or password.');
      state.session = createSession(user);
      if (!state.profiles[user.id]) state.profiles[user.id] = buildUserProfile(state, user.id, user.email, user.name);
      if (!state.progress[user.id]) state.progress[user.id] = buildDefaultProgress(state, user.id);
      await writeState(state);
      emit('SIGNED_IN', state.session);
      return state.session;
    },
    async signOut() {
      const state = await readState();
      state.session = null;
      await writeState(state);
      emit('SIGNED_OUT', null);
    },
    async getBootstrapData(userId) {
      const state = await readState();
      return {
        profile: buildUserProfile(state, userId, state.session?.user?.email, undefined),
        progress: buildDefaultProgress(state, userId),
        todayTopic: state.dailyTopics[0],
        continueLearning: state.continueLearning,
        savedItems: computeSavedItems(state, userId),
        historyItems: computeHistory(state, userId),
        notificationPreferences: state.notificationPreferences[userId] ?? { dailyTopic: true, breakingNews: true, papers: true },
        chatSuggestions: state.chatSuggestions,
      };
    },
    async fetchDailyTopic() {
      const state = await readState();
      return state.dailyTopics[0];
    },
    async fetchFeed(type = 'news') {
      const state = await readState();
      const normalized = state.contentItems.map(normalizeContentItem).filter(Boolean);
      if (type === 'papers') return normalized.filter((item) => item.type === 'paper' || item.category === 'Papers');
      if (type === 'tools') return normalized.filter((item) => item.type === 'tool' || item.category === 'Tools');
      return normalized.filter((item) => item.type === 'news' || item.type === 'research' || item.type === 'paper');
    },
    async searchExplore(query) {
      const state = await readState();
      const topicResults = state.exploreTopics.filter((topic) => matchesSearch({ title: topic.title, summary: topic.summary ?? topic.tag, category: 'topic', tags: [topic.tag] }, query));
      const contentResults = state.contentItems.filter((item) => matchesSearch(item, query));
      return { query, ...groupExploreResults([...topicResults.map((topic) => ({ ...topic, type: 'topic' })), ...contentResults]) };
    },
    async toggleBookmark(userId, item) {
      const state = await readState();
      const current = state.bookmarks[userId] ?? [];
      const existing = current.find((bookmark) => bookmark.contentId === item.id);
      if (existing) state.bookmarks[userId] = current.filter((bookmark) => bookmark.contentId !== item.id);
      else {
        state.bookmarks[userId] = [...current, { id: `bookmark-${Date.now()}`, userId, contentType: item.type ?? 'topic', contentId: item.id, createdAt: new Date().toISOString() }];
      }
      await writeState(state);
      return computeSavedItems(state, userId);
    },
    async markTopicComplete(userId, topicId) {
      const state = await readState();
      const progress = buildDefaultProgress(state, userId);
      if (!progress.completedTopicIds.includes(topicId)) {
        progress.completedTopicIds.push(topicId);
        progress.topicsCompleted += 1;
        progress.weeklyPercent = Math.min(100, progress.weeklyPercent + 8);
        progress.history = [{ id: topicId, title: state.dailyTopics.find((topic) => topic.id === topicId)?.title ?? 'Completed Topic', type: 'Topic', time: '35 min', completedAt: 'Just now', imageGradient: ['#1E3A5F', '#2563EB'] }, ...progress.history];
        
        // Update weekDays array (Monday-based: 0=Mon, ..., 6=Sun)
        const day = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const mondayIndex = day === 0 ? 6 : day - 1;
        if (!progress.weekDays || !Array.isArray(progress.weekDays)) {
          progress.weekDays = [false, false, false, false, false, false, false];
        } else {
          // Clone to prevent direct mutation references
          progress.weekDays = [...progress.weekDays];
        }
        progress.weekDays[mondayIndex] = true;
      }
      state.progress[userId] = progress;
      await writeState(state);
      return progress;
    },
    async updateProfile(userId, patch) {
      const state = await readState();
      const current = buildUserProfile(state, userId, state.session?.user?.email, undefined);
      state.profiles[userId] = { ...current, ...patch, stats: current.stats };
      await writeState(state);
      return state.profiles[userId];
    },
    async updateNotificationPreferences(userId, patch) {
      const state = await readState();
      state.notificationPreferences[userId] = { ...(state.notificationPreferences[userId] ?? {}), ...patch };
      await writeState(state);
      return state.notificationPreferences[userId];
    },
    async registerDeviceToken(userId, token) {
      const state = await readState();
      state.deviceTokens[userId] = token;
      await writeState(state);
      return token;
    },
    async searchExploreContent(query) {
      const state = await readState();
      const q = String(query ?? '').toLowerCase();
      const matchingItems = state.contentItems.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.summary?.toLowerCase().includes(q) ||
          item.source_name?.toLowerCase().includes(q),
      );
      return {
        topics: [],
        items: matchingItems.slice(0, 20).map((item) => normalizeContentItem(item)).filter(Boolean),
      };
    },

    async fetchTopicContent(topicId) {
      const state = await readState();
      // Simple mock: return some items from contentItems to simulate precomputed topic_content
      const matchingItems = state.contentItems.filter(
        (item) =>
          item.title?.toLowerCase().includes(topicId.replace(/-/g, ' ')) ||
          item.summary?.toLowerCase().includes(topicId.replace(/-/g, ' '))
      );
      // If we don't have matches, return a subset of items as fallback
      const finalItems = matchingItems.length > 0 ? matchingItems : state.contentItems.slice(0, 5);
      return finalItems.map((item) => normalizeContentItem(item)).filter(Boolean);
    },

    async fetchTopic(topicId) {
      return {
        id: topicId,
        title: topicId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        difficulty: 'Intermediate',
        description: `${topicId.replace(/-/g, ' ')} is an important concept in AI. This mock description is provided in offline demo mode.`,
        docs_url: 'https://example.com/docs',
      };
    },

    async triggerTopicCrawl(_topicId, _topicTitle) {
      return { ok: true, itemsInserted: 3 };
    },

    async resolveExploreTopicId(topicId) {
      return topicId;
    },

    async sendChatMessage(userId, { message, pageContext }) {
      const state = await readState();
      const response = personalizeChatReply(message, pageContext, state);
      const userSessions = state.chatSessions[userId] ?? [];
      const sessionId = pageContext?.type ? `${pageContext.type}-${pageContext?.topic?.id ?? pageContext?.query ?? 'default'}` : 'general';
      const existing = userSessions.find((session) => session.id === sessionId);
      const nextSession = existing ?? { id: sessionId, messages: [] };
      nextSession.messages.push({ role: 'user', text: message, createdAt: new Date().toISOString() }, { role: 'assistant', text: response.answer, citations: response.citations, createdAt: new Date().toISOString() });
      const otherSessions = userSessions.filter((session) => session.id !== sessionId);
      state.chatSessions[userId] = [nextSession, ...otherSessions];
      await writeState(state);
      return { answer: response.answer, citations: response.citations, sessionId };
    },

    async fetchUpcomingEvents(userId) {
      const state = await readState();
      state.eventReminders = state.eventReminders ?? {};
      const userReminders = state.eventReminders[userId] ?? [];
      const mockEvents = [
        {
          id: 'mock-event-1',
          title: 'Google I/O 2026 — The Gemini 4.0 Era',
          description: 'Join Google developers worldwide to discover the latest products, APIs, and open-source updates in consumer AI and workspace models.',
          eventDate: '2026-05-19T10:00:00.000Z',
          location: 'Shoreline Amphitheatre, Mountain View, CA',
          organizer: 'By Google Developer Relations',
          category: 'Google',
          badgeStatus: 'Going',
          attendeesCount: 14532,
          isReminderSet: userReminders.includes('mock-event-1'),
        },
        {
          id: 'mock-event-2',
          title: 'OpenAI DevDay & Spring Update',
          description: 'Exclusive preview of OpenAI GPT-5.5-preview and advanced voice agents rolling out in the developer API dashboard.',
          eventDate: '2026-05-22T17:00:00.000Z',
          location: 'San Francisco, CA (Virtual Broadcast)',
          organizer: 'By OpenAI Developer Relations',
          category: 'OpenAI',
          badgeStatus: 'Pending',
          attendeesCount: 8243,
          isReminderSet: userReminders.includes('mock-event-2'),
        },
        {
          id: 'mock-event-3',
          title: 'Apple WWDC 2026 — Siri Re-imagined',
          description: 'Unveiling iOS 20 and macOS 17 with Apple Intelligence 2.0 fully integrated with on-device LLMs and secure cloud compute.',
          eventDate: '2026-06-08T10:00:00.000Z',
          location: 'Apple Park, Cupertino, CA',
          organizer: 'By Apple Software Engineering',
          category: 'Apple',
          badgeStatus: 'Pending',
          attendeesCount: 24502,
          isReminderSet: userReminders.includes('mock-event-3'),
        },
        {
          id: 'mock-event-4',
          title: 'Meta Llama 4 Open Source Launch',
          description: 'Technical deep-dive into Meta\'s largest open-weights 405B MoE foundation models and agentic tool-use features.',
          eventDate: '2026-06-15T13:00:00.000Z',
          location: 'Meta HQ, Menlo Park, CA',
          organizer: 'By Meta AI Research (FAIR)',
          category: 'Meta',
          badgeStatus: 'Going',
          attendeesCount: 5120,
          isReminderSet: userReminders.includes('mock-event-4'),
        }
      ];
      return mockEvents;
    },

    async toggleEventReminder(userId, eventId) {
      if (!userId) throw new Error('User must be logged in to set reminders.');
      const state = await readState();
      state.eventReminders = state.eventReminders ?? {};
      const current = state.eventReminders[userId] ?? [];
      const existing = current.includes(eventId);
      
      if (existing) {
        state.eventReminders[userId] = current.filter(id => id !== eventId);
      } else {
        state.eventReminders[userId] = [...current, eventId];
      }
      
      await writeState(state);
      return !existing;
    },
  };
}
