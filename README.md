# AI Scout — React Native Expo App

A mobile-first AI learning app with daily topics, news feed, explore search, bookmarks, and a floating AI chatbot.

## Project Structure

```
ai-scout/
├── App.js                        # Root: navigation setup (bottom tabs + stack navigators)
├── app.json                      # Expo config
├── babel.config.js               # Babel config
├── package.json
│
├── screens/
│   ├── TodayScreen.js            # Home: daily topic card, progress, continue learning
│   ├── LectureScreen.js          # Topic detail: RAG diagram, tabs (Learn/Examples/Takeaway)
│   ├── NewsScreen.js             # News feed: featured + list, filter tabs
│   ├── ExploreScreen.js          # Search: topics, papers, courses, tools
│   ├── SavedScreen.js            # Bookmarks with stats
│   └── ProfileScreen.js          # Profile, stats, settings
│
├── components/
│   ├── FloatingChat.js           # Floating AI chatbot button + bottom sheet modal
│   ├── ProgressRing.js           # SVG circular progress ring
│   ├── RAGDiagram.js             # Interactive RAG architecture diagram
│   └── WeekDots.js               # Week activity dot indicators
│
└── constants/
    ├── theme.js                  # LIGHT + DARK themes, FONTS, SPACING, RADIUS
    └── mockData.js               # All mock data: topics, news, tools, profile
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start the dev server

```bash
npx expo start
```

Then press:
- `a` for Android emulator
- `i` for iOS simulator  
- Scan QR with **Expo Go** app on your phone

### 3. Android-specific (for physical device)

```bash
npx expo start --android
```

## Navigation Architecture

```
Tab Navigator
├── Today (stack)
│   ├── TodayHome  ← TodayScreen
│   └── Lecture    ← LectureScreen
├── News (stack)
│   ├── NewsHome   ← NewsScreen
│   └── Lecture    ← LectureScreen
├── Explore (stack)
│   ├── ExploreHome ← ExploreScreen
│   └── Lecture     ← LectureScreen
├── Saved (stack)
│   ├── SavedHome  ← SavedScreen
│   └── Lecture    ← LectureScreen
└── Profile (stack)
    └── ProfileHome ← ProfileScreen
```

## Theme System

- **Today, Lecture, Explore**: Dark theme (`DARK` from theme.js)
- **News, Saved, Profile**: Light theme (`LIGHT` from theme.js)
- The tab bar background dynamically switches based on the active tab

## Integrations (to add later)

- **Auth**: Replace `USER_PROFILE` mock with real auth (Supabase, Firebase, Clerk)
- **Daily Topic API**: `GET /daily-topic/today` → replace `DAILY_TOPIC` mock
- **News Feed API**: `GET /feed?type=news|papers` → replace `NEWS_ITEMS` mock
- **Explore Search API**: `POST /explore/search` → replace static arrays
- **Bookmarks API**: `POST /bookmarks`, `DELETE /bookmarks/:id`
- **Chat API**: Connect `FloatingChat.js` `sendMessage()` to `POST /chat` with `page_context`
- **Push Notifications**: Daily topic reminder via Expo Notifications

## FloatingChat Context

The `FloatingChat` component accepts a `pageContext` prop:

```js
// Today screen
<FloatingChat isDark={false} pageContext={{ type: 'today', topic: DAILY_TOPIC }} />

// Lecture screen  
<FloatingChat isDark={true} pageContext={{ type: 'lecture', topic }} />

// Explore screen
<FloatingChat isDark={true} pageContext={{ type: 'explore', query: searchQuery }} />

// News screen
<FloatingChat isDark={false} pageContext={{ type: 'news' }} />
```

When connecting to your backend, pass `pageContext` as `page_context_type` and `page_context_id` in your chat API call.

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@react-navigation/native` | Navigation core |
| `@react-navigation/bottom-tabs` | Bottom tab bar |
| `@react-navigation/native-stack` | Stack navigation |
| `expo-linear-gradient` | Gradient backgrounds |
| `react-native-svg` | RAG diagram + progress ring |
| `react-native-reanimated` | Smooth animations |
| `react-native-safe-area-context` | Safe area handling |
| `@expo/vector-icons` | Ionicons throughout the app |
