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
  const [roadmaps, setRoadmaps] = useState([]);
  const [exploreResults, setExploreResults] = useState(EMPTY_EXPLORE);
  const [notificationPreferences, setNotificationPreferences] = useState({
    dailyTopic: true,
    breakingNews: true,
    papers: true,
  });
  const [localInterests, setLocalInterests] = useState([]);

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

      // Fire off a background ingest to scrape platforms automatically on app open
      if (backend.triggerIngestFeed) {
        backend.triggerIngestFeed()
          .then(() => backend.fetchFeed('news'))
          .then((freshItems) => {
             // We don't apply full sorting here to avoid jumping, but we update the feed
             setFeed(prev => freshItems.length > 0 ? freshItems : prev);
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

      const effectiveInterests = profile?.interests || localInterests;
      if (effectiveInterests && effectiveInterests.length > 0) {
        items.sort((a, b) => {
          const aCat = a.category?.toLowerCase() || a.type?.toLowerCase();
          const bCat = b.category?.toLowerCase() || b.type?.toLowerCase();
          
          let aScore = effectiveInterests.findIndex(i => {
            const lowerI = i.toLowerCase();
            return aCat === lowerI || a.title?.toLowerCase().includes(lowerI) || a.summary?.toLowerCase().includes(lowerI) || a.tags?.some(t => t.toLowerCase() === lowerI);
          });
          let bScore = effectiveInterests.findIndex(i => {
            const lowerI = i.toLowerCase();
            return bCat === lowerI || b.title?.toLowerCase().includes(lowerI) || b.summary?.toLowerCase().includes(lowerI) || b.tags?.some(t => t.toLowerCase() === lowerI);
          });
          
          if (aScore === -1) aScore = 999;
          if (bScore === -1) bScore = 999;
          
          // Secondary sort by date if scores are equal
          if (aScore === bScore) {
             return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
          }
          
          return aScore - bScore;
        });
      }

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

  async function generateRoadmap(fieldId, roadmapId, title, description) {
    setDataLoading(true);
    try {
      const newRoadmapContent = await backend.generateRoadmap(fieldId, roadmapId, title, description);
      const updatedRoadmaps = await backend.fetchRoadmaps();
      setRoadmaps(updatedRoadmaps);
      return newRoadmapContent;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setDataLoading(false);
    }
  }

  async function sendChatMessage(message, pageContext) {
    if (!session?.user?.id) {
      throw new Error('Sign in to use the AI assistant.');
    }

    return backend.sendChatMessage(session.user.id, { message, pageContext });
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
      trackItemClick,
      trackSearch,
      generateRoadmap,
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
      localInterests,
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
