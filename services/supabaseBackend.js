import { getSupabaseClient } from '../lib/supabase.js';
import { isSupabaseConfigured } from '../lib/env.js';
import { groupExploreResults, normalizeContentItem, normalizeTopic } from './mappers.js';

const CHAT_FUNCTION = 'chat';
const EXPLORE_FUNCTION = 'explore-search';

function getClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return client;
}

function mapProfile(profile, prefs) {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role ?? 'Builder',
    roleColor: profile.role_color ?? '#059669',
    skillLevel: profile.skill_level ?? 'Intermediate',
    interests: profile.interests ?? [],
    themeMode: prefs?.theme_mode ?? 'light',
    stats: {
      topics: profile.topics_count ?? 0,
      saved: profile.saved_count ?? 0,
      streak: profile.streak_count ?? 0,
      progress: profile.progress_percent ?? 0,
    },
  };
}

export const supabaseBackend = {
  kind: 'supabase',
  isConfigured: isSupabaseConfigured,

  async getSession() {
    const supabase = getClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }
    return data.session;
  },

  onAuthStateChange(callback) {
    const supabase = getClient();
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });

    return {
      unsubscribe() {
        data.subscription.unsubscribe();
      },
    };
  },

  async signUp({ email, password, name }) {
    const supabase = getClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) {
      throw error;
    }
    return data.session;
  },

  async signIn({ email, password }) {
    const supabase = getClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
    return data.session;
  },

  async signOut() {
    const supabase = getClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  },

  async getBootstrapData(userId) {
    const supabase = getClient();
    const [
      profileResult,
      preferenceResult,
      progressResult,
      topicResult,
      bookmarksResult,
      historyResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_preferences').select('*').eq('user_id', userId).single(),
      supabase.from('user_progress').select('*').eq('user_id', userId).single(),
      supabase.from('daily_topics').select('*, resources(*)').eq('is_published', true).order('publish_date', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('bookmarks_view').select('*').eq('user_id', userId),
      supabase.from('progress_history_view').select('*').eq('user_id', userId).order('completed_at', { ascending: false }).limit(20),
    ]);

    if (profileResult.error) {
      throw profileResult.error;
    }
    if (preferenceResult.error && preferenceResult.error.code !== 'PGRST116') {
      throw preferenceResult.error;
    }
    if (progressResult.error && progressResult.error.code !== 'PGRST116') {
      throw progressResult.error;
    }
    if (topicResult.error) {
      throw topicResult.error;
    }
    if (bookmarksResult.error) {
      throw bookmarksResult.error;
    }
    if (historyResult.error) {
      throw historyResult.error;
    }

    return {
      profile: mapProfile(profileResult.data, preferenceResult.data),
      progress: progressResult.data
        ? {
            weeklyPercent: progressResult.data.weekly_percent,
            topicsCompleted: progressResult.data.topics_completed,
            topicsTotal: progressResult.data.topics_total,
            weekDays: progressResult.data.week_days ?? [],
            streak: progressResult.data.streak,
            completedTopicIds: progressResult.data.completed_topic_ids ?? [],
            history: historyResult.data ?? [],
          }
        : null,
      todayTopic: normalizeTopic(topicResult.data),
      continueLearning: progressResult.data?.continue_learning ?? [],
      savedItems: (bookmarksResult.data ?? []).map(normalizeContentItem),
      historyItems: historyResult.data ?? [],
      notificationPreferences: preferenceResult.data?.notification_preferences ?? {
        dailyTopic: true,
        breakingNews: true,
        papers: true,
      },
      chatSuggestions: [],
    };
  },

  async fetchDailyTopic() {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('daily_topics')
      .select('*, resources(*)')
      .eq('is_published', true)
      .order('publish_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return normalizeTopic(data);
  },

  async fetchFeed(type = 'news') {
    const supabase = getClient();
    const query = supabase
      .from('content_items')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(50);

    if (type === 'papers') {
      query.in('type', ['paper', 'research']);
    } else if (type === 'tools') {
      query.eq('type', 'tool');
    } else {
      query.in('type', ['news', 'research', 'paper']);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return (data ?? []).map(normalizeContentItem);
  },

  async searchExplore(query) {
    const supabase = getClient();
    const { data, error } = await supabase.functions.invoke(EXPLORE_FUNCTION, {
      body: { query },
    });
    if (error) {
      throw error;
    }

    return {
      query,
      ...groupExploreResults(data?.items ?? []),
    };
  },

  async toggleBookmark(userId, item) {
    const supabase = getClient();
    const { data: existing, error: existingError } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('content_id', item.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing?.id) {
      const { error } = await supabase.from('bookmarks').delete().eq('id', existing.id);
      if (error) {
        throw error;
      }
    } else {
      const { error } = await supabase.from('bookmarks').insert({
        user_id: userId,
        content_id: item.id,
        content_type: item.type ?? 'topic',
      });
      if (error) {
        throw error;
      }
    }

    const { data, error } = await supabase.from('bookmarks_view').select('*').eq('user_id', userId);
    if (error) {
      throw error;
    }

    return (data ?? []).map(normalizeContentItem);
  },

  async markTopicComplete(userId, topicId) {
    const supabase = getClient();
    const { error } = await supabase.rpc('mark_topic_complete', {
      p_user_id: userId,
      p_topic_id: topicId,
    });
    if (error) {
      throw error;
    }

    const { data, error: progressError } = await supabase.from('user_progress').select('*').eq('user_id', userId).single();
    if (progressError) {
      throw progressError;
    }

    return {
      weeklyPercent: data.weekly_percent,
      topicsCompleted: data.topics_completed,
      topicsTotal: data.topics_total,
      weekDays: data.week_days ?? [],
      streak: data.streak,
      completedTopicIds: data.completed_topic_ids ?? [],
      history: [],
    };
  },

  async updateProfile(userId, patch) {
    const supabase = getClient();
    const profilePatch = {};
    const prefPatch = {};

    if (patch.name) profilePatch.name = patch.name;
    if (patch.skillLevel) profilePatch.skill_level = patch.skillLevel;
    if (patch.interests) profilePatch.interests = patch.interests;
    if (patch.themeMode) prefPatch.theme_mode = patch.themeMode;

    if (Object.keys(profilePatch).length) {
      const { error } = await supabase.from('profiles').update(profilePatch).eq('id', userId);
      if (error) {
        throw error;
      }
    }

    if (Object.keys(prefPatch).length) {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ user_id: userId, ...prefPatch }, { onConflict: 'user_id' });
      if (error) {
        throw error;
      }
    }

    const bootstrap = await this.getBootstrapData(userId);
    return bootstrap.profile;
  },

  async updateNotificationPreferences(userId, patch) {
    const supabase = getClient();
    const { data: existing, error: existingError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    const nextPreferences = {
      ...(existing?.notification_preferences ?? {}),
      ...patch,
    };

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        theme_mode: existing?.theme_mode ?? 'light',
        notification_preferences: nextPreferences,
      }, { onConflict: 'user_id' });

    if (error) {
      throw error;
    }

    return nextPreferences;
  },

  async registerDeviceToken(userId, token) {
    const supabase = getClient();
    const { error } = await supabase
      .from('device_tokens')
      .upsert({ user_id: userId, token }, { onConflict: 'user_id,token' });

    if (error) {
      throw error;
    }

    return token;
  },

  async sendChatMessage(userId, { message, pageContext }) {
    const supabase = getClient();
    const { data, error } = await supabase.functions.invoke(CHAT_FUNCTION, {
      body: {
        message,
        page_context_type: pageContext?.type ?? 'general',
        page_context_id: pageContext?.topic?.id ?? pageContext?.item?.id ?? null,
        query: pageContext?.query ?? null,
        user_id: userId,
      },
    });
    if (error) {
      throw error;
    }

    return data;
  },
};
