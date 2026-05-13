import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalBackend } from '../services/createLocalBackend.js';

function createMemoryStorage() {
  let value = null;
  return {
    async getItem() {
      return value;
    },
    async setItem(nextValue) {
      value = nextValue;
    },
  };
}

test('local backend supports auth, bookmarks, progress, search, and chat', async () => {
  const backend = createLocalBackend(createMemoryStorage());

  const session = await backend.signUp({
    name: 'Scout Tester',
    email: 'tester@example.com',
    password: 'password123',
  });

  assert.ok(session.user.id);

  const bootstrap = await backend.getBootstrapData(session.user.id);
  assert.equal(bootstrap.profile.name, 'Scout Tester');
  assert.ok(bootstrap.todayTopic.title);

  const explore = await backend.searchExplore('rag');
  assert.ok(explore.topics.length > 0);
  assert.ok(explore.papers.length > 0);

  const feed = await backend.fetchFeed('news');
  assert.ok(feed.length > 0);

  const afterBookmark = await backend.toggleBookmark(session.user.id, feed[0]);
  assert.equal(afterBookmark.length, 1);

  const afterUnbookmark = await backend.toggleBookmark(session.user.id, feed[0]);
  assert.equal(afterUnbookmark.length, 0);

  const progress = await backend.markTopicComplete(session.user.id, bootstrap.todayTopic.id);
  assert.ok(progress.completedTopicIds.includes(bootstrap.todayTopic.id));

  const prefs = await backend.updateNotificationPreferences(session.user.id, { papers: false });
  assert.equal(prefs.papers, false);

  const profile = await backend.updateProfile(session.user.id, { themeMode: 'dark' });
  assert.equal(profile.themeMode, 'dark');

  const chat = await backend.sendChatMessage(session.user.id, {
    message: 'Explain RAG simply',
    pageContext: { type: 'lecture', topic: bootstrap.todayTopic },
  });

  assert.match(chat.answer, /RAG/i);
  assert.ok(chat.citations.length > 0);
});
