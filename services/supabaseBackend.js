import { getSupabaseClient } from '../lib/supabase.js';
import { isSupabaseConfigured } from '../lib/env.js';
import { groupExploreResults, normalizeContentItem, normalizeTopic } from './mappers.js';
import { sanitizeRoadmapContent } from './roadmapUrls.js';

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

    if (type === 'launches') {
      query.contains('tags', ['launches']);
    } else if (type === 'industry') {
      query.contains('tags', ['industry']);
    } else if (type === 'research') {
      query.contains('tags', ['research']);
    } else if (type === 'papers') {
      query.in('type', ['paper', 'research']);
    } else if (type === 'tools') {
      query.eq('type', 'tool');
    } else if (type !== 'all') {
      query.in('type', ['news', 'research', 'paper']);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return (data ?? []).map(normalizeContentItem);
  },

  async fetchRoadmaps() {
    const supabase = getClient();
    const [fieldsRes, roadmapsRes] = await Promise.all([
      supabase.from('ai_fields').select('*').order('sort_order', { ascending: true }),
      supabase.from('ai_roadmaps').select('*')
    ]);

    if (fieldsRes.error) throw fieldsRes.error;
    if (roadmapsRes.error) throw roadmapsRes.error;

    return fieldsRes.data.map((f) => ({
      id: f.id,
      title: f.title,
      icon: f.icon,
      color: f.color,
      desc: f.description,
      children: roadmapsRes.data
        .filter((r) => r.field_id === f.id)
        .map((r) => {
          const rawContent = typeof r.content === 'string' ? JSON.parse(r.content) : r.content;
          const steps = Array.isArray(rawContent) ? rawContent : [];
          return {
            id: r.id,
            title: r.title,
            desc: r.description,
            fieldId: f.id,
            children: steps.length > 0 ? sanitizeRoadmapContent(steps, r.title) : [],
          };
        })
    }));
  },

  async triggerIngestFeed() {
    const supabase = getClient();
    const { data, error } = await supabase.functions.invoke('ingest-feed', {
      method: 'POST',
    });
    if (error) {
      throw error;
    }
    return data;
  },

  async generateRoadmap(fieldId, roadmapId, title, description) {
    const supabase = getClient();
    const { data, error } = await supabase.functions.invoke('generate-roadmap', {
      body: { field_id: fieldId, roadmap_id: roadmapId, title, description }
    });
    if (error) {
      throw error;
    }
    return data;
  },

  async searchExplore(query) {
    const supabase = getClient();
    
    // Instead of calling an Edge Function, query the DB directly
    const [contentResult, topicResult] = await Promise.all([
      supabase
        .from('content_items')
        .select('*')
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%,source_name.ilike.%${query}%`)
        .order('published_at', { ascending: false })
        .limit(20),
      supabase
        .from('daily_topics')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10),
    ]);

    if (contentResult.error) throw contentResult.error;
    if (topicResult.error) throw topicResult.error;

    const items = [
      ...(topicResult.data ?? []).map((topic) => ({ ...topic, type: 'topic' })),
      ...(contentResult.data ?? []),
    ];

    return {
      query,
      ...groupExploreResults(items),
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

  /**
   * Search explore_topics corpus + content_items from our DB.
   * Returns { topics: ExploreTopicRow[], items: ContentItem[] }
   * Zero live external API calls — everything comes from Supabase.
   */
  async searchExploreContent(query) {
    const supabase = getClient();
    const { data, error } = await supabase.functions.invoke(EXPLORE_FUNCTION, {
      body: { query },
    });
    if (error) throw error;
    const { topics = [], items = [] } = data ?? {};
    return {
      topics,
      items: items.map((item) => normalizeContentItem(item)).filter(Boolean),
    };
  },

  /**
   * Resolve a stable explore_topics.id from slug and/or display title.
   * Roadmap steps often use slugify(title) which may not match Gemini-seeded ids.
   */
  async resolveExploreTopicId(topicId, topicTitle) {
    const supabase = getClient();
    const slug = String(topicId ?? '').trim();
    const title = String(topicTitle ?? '').trim();

    if (slug) {
      const { data: byId } = await supabase
        .from('explore_topics')
        .select('id')
        .eq('id', slug)
        .maybeSingle();
      if (byId?.id) return byId.id;
    }

    if (title) {
      const { data: byTitle } = await supabase
        .from('explore_topics')
        .select('id')
        .ilike('title', title)
        .limit(1)
        .maybeSingle();
      if (byTitle?.id) return byTitle.id;

      const { data: byFuzzy } = await supabase
        .from('explore_topics')
        .select('id')
        .or(`title.ilike.%${title}%,short_desc.ilike.%${title}%`)
        .limit(1)
        .maybeSingle();
      if (byFuzzy?.id) return byFuzzy.id;
    }

    return slug || null;
  },

  /**
   * Fetch dynamic content (articles/papers/posts) stored in topic_content
   * for a specific explore_topics entry.
   */
  async fetchTopicContent(topicId) {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('topic_content')
      .select('*')
      .eq('topic_id', topicId)
      .eq('is_staging', false)
      .order('published_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    return (data ?? []).map((item) =>
      normalizeContentItem({
        ...item,
        source_url: item.source_url,
        source_name: item.source_name,
        category: item.category,
        categoryColor: item.category_color,
      })
    ).filter(Boolean);
  },

  /**
   * Fetch full metadata for a specific explore_topic (definition, difficulty, etc.)
   */
  async fetchTopic(topicId) {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('explore_topics')
      .select('*')
      .eq('id', topicId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /**
   * Trigger a real-time crawl of explore content for a specific topic.
   * Returns { ok, itemsInserted } so the UI knows whether anything was found.
   */
  async triggerTopicCrawl(topicId, topicTitle) {
    const supabase = getClient();
    const { data, error } = await supabase.functions.invoke('fetch-topic-content', {
      body: {
        topic_id: topicId,
        topic_title: topicTitle ?? undefined,
      },
    });
    if (error) {
      return { ok: false, itemsInserted: 0 };
    }
    const itemsInserted = Number(data?.items_inserted ?? 0);
    return { ok: true, itemsInserted };
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
