import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getBackend } from '../services/backend';
import { registerForPushNotificationsAsync } from '../services/notifications';

const AppContext = createContext(null);

const backend = getBackend();

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
  const [exploreResults, setExploreResults] = useState(EMPTY_EXPLORE);
  const [notificationPreferences, setNotificationPreferences] = useState({
    dailyTopic: true,
    breakingNews: true,
    papers: true,
  });

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

  async function bootstrapUser(userId) {
    setDataLoading(true);
    setError('');
    try {
      const [bootstrap, dailyTopic, initialFeed] = await Promise.all([
        backend.getBootstrapData(userId),
        backend.fetchDailyTopic(),
        backend.fetchFeed('news'),
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
      setExploreResults(EMPTY_EXPLORE);

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
      const nextSession = await backend.signUp({ name, email, password });
      setSession(nextSession);
      return nextSession;
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
      setSession(null);
      resetUserData();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function refreshFeed(type = feedType) {
    setDataLoading(true);
    setError('');
    try {
      const items = await backend.fetchFeed(type);
      setFeed(items);
      setFeedType(type);
      return items;
    } catch (nextError) {
      setError(nextError.message);
      return [];
    } finally {
      setDataLoading(false);
    }
  }

  async function searchExplore(query) {
    setDataLoading(true);
    setError('');
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

  async function sendChatMessage(message, pageContext) {
    if (!session?.user?.id) {
      throw new Error('Sign in to use the AI assistant.');
    }

    return backend.sendChatMessage(session.user.id, { message, pageContext });
  }

  const value = useMemo(
    () => ({
      backendKind: backend.kind,
      backendConfigured: backend.kind === 'supabase',
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
      exploreResults,
      notificationPreferences,
      themeMode: profile?.themeMode ?? 'light',
      signIn,
      signUp,
      signOut,
      refreshFeed,
      searchExplore,
      toggleBookmark,
      markTopicComplete,
      updateProfile,
      updateThemeMode,
      updateNotificationSettings,
      sendChatMessage,
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
      todayTopic,
      continueLearning,
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
