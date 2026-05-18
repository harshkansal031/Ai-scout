import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getBackend } from '../services/backend';
import { 
  registerForPushNotificationsAsync,
  scheduleEventReminderNotification,
  cancelEventReminderNotification,
  sendImmediateNotification
} from '../services/notifications';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { ENV } from '../lib/env';

const AppContext = createContext(null);

const backend = getBackend();

const emailConfirmRedirectConfigured = Boolean(ENV.authEmailConfirmRedirectUrl?.trim());

const EMPTY_EXPLORE = {
  query: '',
  topics: [],
  papers: [],
  tools: [],
  resources: [],
  news: [],
};

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [todayTopic, setTodayTopic] = useState(null);
  const [continueLearning, setContinueLearning] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [feed, setFeed] = useState([]);
  const [feedType, setFeedType] = useState('news');
  const [signupEmailVerificationPending, setSignupEmailVerificationPending] = useState(null);

  const clearSignupEmailPending = useCallback(() => {
    setSignupEmailVerificationPending(null);
  }, []);

  const [roadmaps, setRoadmaps] = useState([]);
  const [exploreResults, setExploreResults] = useState(EMPTY_EXPLORE);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [notificationPreferences, setNotificationPreferences] = useState({
    dailyTopic: true,
    breakingNews: true,
    papers: true,
  });
  const [localInterests, setLocalInterests] = useState([]);
  const [brandCache, setBrandCache] = useState({});

  useEffect(() => {
    async function loadBrandCache() {
      try {
        const raw = await AsyncStorage.getItem('scout_brand_cache');
        if (raw) {
          setBrandCache(JSON.parse(raw));
        }
      } catch (e) {
        console.warn('Failed to load brand cache:', e);
      }
    }
    loadBrandCache();
  }, []);

  const triggerCacheSave = async (cleanName, url) => {
    if (brandCache[cleanName]) return;
    const updated = { ...brandCache, [cleanName]: url };
    setBrandCache(updated);
    try {
      await AsyncStorage.setItem('scout_brand_cache', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save brand cache:', e);
    }
  };

  const getBrandLogo = (name) => {
    if (!name) return null;
    const clean = name.toLowerCase().trim();
    if (brandCache[clean]) return brandCache[clean];
    
    const domainMap = {
      google: 'google.com',
      openai: 'openai.com',
      apple: 'apple.com',
      meta: 'meta.com',
      microsoft: 'microsoft.com',
      nvidia: 'nvidia.com',
      anthropic: 'anthropic.com',
      huggingface: 'huggingface.co',
      hugging_face: 'huggingface.co',
      tesla: 'tesla.com',
      supabase: 'supabase.com',
      github: 'github.com',
      amazon: 'amazon.com',
      aws: 'amazon.com',
      ycombinator: 'ycombinator.com',
      yc: 'ycombinator.com',
    };
    const domain = domainMap[clean] || `${clean.replace(/[^a-zA-Z0-9]/g, '')}.com`;
    const generatedUrl = `https://logo.clearbit.com/${domain}?size=120`;
    
    triggerCacheSave(clean, generatedUrl);
    return generatedUrl;
  };

  const [ogCache, setOgCache] = useState({});
  const thumbnailPersistSessionRef = useRef(new Set());

  useEffect(() => {
    async function loadOgCache() {
      try {
        const raw = await AsyncStorage.getItem('scout_og_cache');
        if (raw) {
          setOgCache(JSON.parse(raw));
        }
      } catch (e) {
        console.warn('Failed to load OG cache:', e);
      }
    }
    loadOgCache();
  }, []);



  useEffect(() => {
    let mounted = true;
    backend
      .getSession()
      .then((nextSession) => {
        if (mounted) {
          setSession(nextSession);
        }
      })
      .catch((nextError) => {
        if (mounted) {
          setError(nextError.message);
        }
      })
      .finally(() => {
        if (mounted) {
          setAuthLoading(false);
        }
      });

    const subscription = backend.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        resetUserData();
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    bootstrapUser(session.user.id);
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id || !backend.fetchRoadmaps) {
      return;
    }

    backend.fetchRoadmaps().then(setRoadmaps).catch(() => setRoadmaps([]));
  }, [session?.user?.id]);

  async function bootstrapUser(userId) {
    setDataLoading(true);
    setError('');
    try {
      const [bootstrap, dailyTopic, initialFeed, initialRoadmaps] = await Promise.all([
        backend.getBootstrapData(userId),
        backend.fetchDailyTopic(),
        backend.fetchFeed('news'),
        backend.fetchRoadmaps().catch(() => []),
      ]);

      setProfile(bootstrap.profile);
      setProgress(bootstrap.progress);
      setTodayTopic(dailyTopic ?? bootstrap.todayTopic);
      setContinueLearning(bootstrap.continueLearning ?? []);
      setSavedItems(bootstrap.savedItems ?? []);
      setHistoryItems(bootstrap.historyItems ?? []);
      setNotificationPreferences(bootstrap.notificationPreferences ?? notificationPreferences);
      setFeed(initialFeed);
      setFeedType('news');
      setRoadmaps(initialRoadmaps);
      setExploreResults(EMPTY_EXPLORE);

      const initialEvents = await backend.fetchUpcomingEvents(userId).catch(() => []);
      setUpcomingEvents(initialEvents);

      if (backend.triggerIngestFeed) {
        backend.triggerIngestFeed()
          .then(() => Promise.all([
            backend.fetchFeed('news'),
            backend.fetchRoadmaps?.() ?? Promise.resolve(initialRoadmaps),
          ]))
          .then(([freshItems, freshRoadmaps]) => {
             setFeed((prev) => (freshItems.length > 0 ? freshItems : prev));
             if (freshRoadmaps?.length) {
               setRoadmaps(freshRoadmaps);
             }
          })
          .catch((err) => console.warn('Background ingest failed:', err.message));
      }

      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await backend.registerDeviceToken(userId, token);
        }
      } catch (notificationError) {
        console.warn('Push registration skipped:', notificationError.message);
      }
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setDataLoading(false);
    }
  }

  function resetUserData() {
    setProfile(null);
    setProgress(null);
    setTodayTopic(null);
    setContinueLearning([]);
    setSavedItems([]);
    setHistoryItems([]);
    setFeed([]);
    setFeedType('news');
    setExploreResults(EMPTY_EXPLORE);
  }

  async function signIn(email, password) {
    setError('');
    setSignupEmailVerificationPending(null);
    setAuthLoading(true);
    try {
      const nextSession = await backend.signIn({ email, password });
      setSession(nextSession);
      return nextSession;
    } catch (nextError) {
      setError(nextError.message);
      throw nextError;
    } finally {
      setAuthLoading(false);
    }
  }

  async function signUp({ name, email, password }) {
    setError('');
    setAuthLoading(true);
    try {
      const result = await backend.signUp({ name, email, password });
      if (result.pendingEmailConfirmation) {
        setSession(null);
        setSignupEmailVerificationPending(email.trim());
        try {
          await backend.signOut();
        } catch (_) {
          /* no active session */
        }
        return result;
      }
      setSignupEmailVerificationPending(null);
      setSession(result.session);
      return result;
    } catch (nextError) {
      setError(nextError.message);
      throw nextError;
    } finally {
      setAuthLoading(false);
    }
  }

  async function signOut() {
    setAuthLoading(true);
    try {
      await backend.signOut();
      setSignupEmailVerificationPending(null);
      setSession(null);
      resetUserData();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function resendSignupConfirmationEmail(email) {
    setError('');
    if (backend.kind !== 'supabase' || !backend.resendSignupConfirmation) {
      return;
    }
    setAuthLoading(true);
    try {
      await backend.resendSignupConfirmation(email);
    } catch (nextError) {
      setError(nextError.message);
      throw nextError;
    } finally {
      setAuthLoading(false);
    }
  }

  async function refreshFeed(type = feedType, forceIngest = false) {
    setDataLoading(true);
    setError('');
    try {
      if (forceIngest && backend.triggerIngestFeed) {
        try {
          await backend.triggerIngestFeed();
        } catch (e) {
          console.warn('Failed to trigger ingest:', e);
        }
      }
      
      const items = await backend.fetchFeed(type);

      // Always sort strictly chronologically (newest first) to guarantee the latest news is always at the top
      items.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));

      // Apply existing cache synchronously first so cached images load instantly!
      const itemsWithCachedImages = items.map(item => {
        if (item.sourceUrl && ogCache[item.sourceUrl]) {
          return { ...item, imageUrl: ogCache[item.sourceUrl] };
        }
        return item;
      });

      setFeed(itemsWithCachedImages);
      setFeedType(type);
      
      return items;
    } catch (nextError) {
      setError(nextError.message);
      return [];
    } finally {
      setDataLoading(false);
    }
  }

  const persistNewsThumbnail = useCallback(async (contentId, imageUrl) => {
    if (!contentId || typeof imageUrl !== 'string') return;
    const trimmed = imageUrl.trim();
    if (!trimmed.startsWith('http')) return;
    if (trimmed.includes('logo.clearbit.com')) return;
    if (backend.kind !== 'supabase' || typeof backend.persistNewsThumbnail !== 'function') return;

    if (thumbnailPersistSessionRef.current.has(contentId)) return;
    thumbnailPersistSessionRef.current.add(contentId);

    try {
      await backend.persistNewsThumbnail(contentId, trimmed);
      setFeed((prev) =>
        prev.map((item) =>
          item.id !== contentId
            ? item
            : {
                ...item,
                imageUrl: trimmed,
                metadata: {
                  ...(item.metadata && typeof item.metadata === 'object' ? item.metadata : {}),
                  imageUrl: trimmed,
                },
              },
        ),
      );
    } catch (e) {
      thumbnailPersistSessionRef.current.delete(contentId);
      console.warn('[persistNewsThumbnail]', e.message);
    }
  }, []);

  async function searchExplore(query) {
    setDataLoading(true);
    setError('');
    trackSearch(query);
    try {
      const results = await backend.searchExplore(query);
      setExploreResults(results);
      return results;
    } catch (nextError) {
      setError(nextError.message);
      return EMPTY_EXPLORE;
    } finally {
      setDataLoading(false);
    }
  }

  async function toggleBookmark(item) {
    if (!session?.user?.id) {
      return;
    }

    try {
      const nextItems = await backend.toggleBookmark(session.user.id, item);
      setSavedItems(nextItems);
      return nextItems;
    } catch (nextError) {
      setError(nextError.message);
      return savedItems;
    }
  }

  async function markTopicComplete(topicId) {
    if (!session?.user?.id) {
      return;
    }

    try {
      const nextProgress = await backend.markTopicComplete(session.user.id, topicId);
      setProgress(nextProgress);
      const bootstrap = await backend.getBootstrapData(session.user.id);
      setHistoryItems(bootstrap.historyItems ?? []);
      setContinueLearning(bootstrap.continueLearning ?? continueLearning);
      return nextProgress;
    } catch (nextError) {
      setError(nextError.message);
      return progress;
    }
  }

  async function updateProfile(patch) {
    if (!session?.user?.id) {
      return;
    }

    try {
      const nextProfile = await backend.updateProfile(session.user.id, patch);
      setProfile(nextProfile);
      return nextProfile;
    } catch (nextError) {
      setError(nextError.message);
      return profile;
    }
  }

  async function updateThemeMode(themeMode) {
    const nextProfile = await updateProfile({ themeMode });
    return nextProfile?.themeMode ?? profile?.themeMode ?? 'light';
  }

  async function updateNotificationSettings(patch) {
    if (!session?.user?.id) {
      return;
    }

    try {
      const nextPreferences = await backend.updateNotificationPreferences(session.user.id, patch);
      setNotificationPreferences(nextPreferences);
      return nextPreferences;
    } catch (nextError) {
      setError(nextError.message);
      return notificationPreferences;
    }
  }

  async function refreshRoadmaps() {
    if (!backend.fetchRoadmaps) {
      return [];
    }
    try {
      const updated = await backend.fetchRoadmaps();
      setRoadmaps(updated);
      return updated;
    } catch (e) {
      console.warn('Failed to refresh roadmaps:', e.message);
      return roadmaps;
    }
  }

  /** Steps for a roadmap id from freshly loaded tree (source of truth for Explore timeline). */
  function stepsFromRoadmapTree(updatedTree, roadmapId) {
    const id = roadmapId ?? '';
    for (const field of updatedTree ?? []) {
      const sub = field.children?.find((c) => c.id === id);
      if (sub?.children?.length) return sub.children;
    }
    return [];
  }

  async function generateRoadmap(fieldId, roadmapId, title, description) {
    try {
      const directResult = await backend.generateRoadmap(
        fieldId,
        roadmapId,
        title,
        description,
      );
      const updated = await refreshRoadmaps();

      if (Array.isArray(directResult) && directResult.length > 0) {
        return directResult;
      }

      const fromDb = stepsFromRoadmapTree(updated, roadmapId);
      if (fromDb.length > 0) {
        return fromDb;
      }

      return [];
    } catch (e) {
      setError(e.message);
      return [];
    }
  }

  async function sendChatMessage(message, pageContext) {
    if (!session?.user?.id) {
      throw new Error('Sign in to use the AI assistant.');
    }

    return backend.sendChatMessage(session.user.id, { message, pageContext });
  }

  async function fetchUpcomingEvents() {
    try {
      const userId = session?.user?.id;
      const events = await backend.fetchUpcomingEvents(userId);
      setUpcomingEvents(events);
      return events;
    } catch (e) {
      console.warn('Failed to fetch upcoming events:', e.message);
      return [];
    }
  }

  async function toggleEventReminder(eventId) {
    if (!session?.user?.id) {
      throw new Error('Sign in to set reminders.');
    }
    try {
      const isSet = await backend.toggleEventReminder(session.user.id, eventId);
      
      // Update state
      setUpcomingEvents(prev => prev.map(e => e.id === eventId ? { ...e, isReminderSet: isSet } : e));

      // Trigger & schedule local push notifications on device
      const eventDetails = upcomingEvents.find(e => e.id === eventId);
      if (eventDetails) {
        if (isSet) {
          // Schedule 1 hour before
          await scheduleEventReminderNotification(eventId, eventDetails.title, eventDetails.eventDate);
          // Pop up confirmation instantly
          await sendImmediateNotification(
            '🔔 Reminder Set!',
            `We will alert you 1 hour before "${eventDetails.title}" starts!`
          );
        } else {
          // Cancel scheduled alert
          await cancelEventReminderNotification(eventId);
          // Pop up cancellation instantly
          await sendImmediateNotification(
            '🔕 Reminder Cancelled',
            `Alert for "${eventDetails.title}" has been removed.`
          );
        }
      }

      return isSet;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }

  async function trackItemClick(item) {
    const category = item.category || item.type;
    if (!category) return;
    
    const currentInterests = profile?.interests || localInterests;
    const newInterests = [category, ...currentInterests.filter(c => c !== category)].slice(0, 10);
    
    if (newInterests.join(',') !== currentInterests.join(',')) {
      if (profile) {
        setProfile(prev => ({ ...prev, interests: newInterests }));
        updateProfile({ interests: newInterests });
      } else {
        setLocalInterests(newInterests);
      }
    }
  }

  async function trackSearch(query) {
    if (!query || query.trim().length === 0) return;
    const term = query.toLowerCase().trim();
    
    const currentInterests = profile?.interests || localInterests;
    const newInterests = [term, ...currentInterests.filter(c => c !== term)].slice(0, 10);
    
    if (newInterests.join(',') !== currentInterests.join(',')) {
      if (profile) {
        setProfile(prev => ({ ...prev, interests: newInterests }));
        updateProfile({ interests: newInterests });
      } else {
        setLocalInterests(newInterests);
      }
    }
  }

  const value = useMemo(
    () => ({
      backendKind: backend.kind,
      backendConfigured: backend.kind === 'supabase',
      emailConfirmRedirectConfigured,
      session,
      authLoading,
      dataLoading,
      error,
      profile,
      progress,
      todayTopic,
      continueLearning,
      savedItems,
      historyItems,
      feed,
      feedType,
      roadmaps,
      exploreResults,
      notificationPreferences,
      themeMode: profile?.themeMode ?? 'light',
      upcomingEvents,
      signIn,
      signUp,
      signOut,
      signupEmailVerificationPending,
      clearSignupEmailPending,
      resendSignupConfirmationEmail,
      refreshFeed,
      persistNewsThumbnail,
      searchExplore,
      toggleBookmark,
      markTopicComplete,
      updateProfile,
      updateThemeMode,
      updateNotificationSettings,
      sendChatMessage,
      trackItemClick,
      trackSearch,
      generateRoadmap,
      refreshRoadmaps,
      fetchUpcomingEvents,
      toggleEventReminder,
      getBrandLogo,
      backend,
    }),
    [
      authLoading,
      dataLoading,
      error,
      exploreResults,
      feed,
      feedType,
      historyItems,
      notificationPreferences,
      profile,
      progress,
      savedItems,
      session,
      signupEmailVerificationPending,
      todayTopic,
      continueLearning,
      localInterests,
      roadmaps,
      upcomingEvents,
      brandCache,
      ogCache,
      persistNewsThumbnail,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useApp must be used inside AppProvider.');
  }
  return value;
}
