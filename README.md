# AI Scout

AI Scout is an Expo mobile app for daily AI learning, live news and paper discovery, saved reading, and a context-aware in-app assistant.

## What is implemented

- Email auth flow in the app
- Session-aware mobile navigation
- Live data layer with a Supabase adapter
- Local fallback backend so the full app still works without Supabase keys
- Persistent bookmarks, progress, profile preferences, and chat history
- Global light/dark mode preference
- Push notification registration
- Supabase schema, row-level security, and edge function scaffolding

## Environment

Copy [.env.example](./.env.example) into your local environment and fill these values:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SUPABASE_PROJECT_ID=
OPENAI_API_KEY=
OPENAI_CHAT_MODEL=gpt-4.1-mini
```

If Supabase keys are missing, the app automatically runs in a local persistent dev mode so all major flows can still be exercised.

## Supabase backend files

- SQL schema and RLS: [supabase/migrations/001_init.sql](/C:/Users/HKans/OneDrive/Desktop/Project/Scout%20AI/supabase/migrations/001_init.sql)
- Chat function: [supabase/functions/chat/index.ts](/C:/Users/HKans/OneDrive/Desktop/Project/Scout%20AI/supabase/functions/chat/index.ts)
- Explore function: [supabase/functions/explore-search/index.ts](/C:/Users/HKans/OneDrive/Desktop/Project/Scout%20AI/supabase/functions/explore-search/index.ts)
- Feed ingestion: [supabase/functions/ingest-feed/index.ts](/C:/Users/HKans/OneDrive/Desktop/Project/Scout%20AI/supabase/functions/ingest-feed/index.ts)
- Push alerts: [supabase/functions/push-alerts/index.ts](/C:/Users/HKans/OneDrive/Desktop/Project/Scout%20AI/supabase/functions/push-alerts/index.ts)

## App architecture

- Root auth and navigation shell: [App.js](/C:/Users/HKans/OneDrive/Desktop/Project/Scout%20AI/App.js)
- Shared app state and backend actions: [context/AppProvider.js](/C:/Users/HKans/OneDrive/Desktop/Project/Scout%20AI/context/AppProvider.js)
- Backend selection and adapters: [services](/C:/Users/HKans/OneDrive/Desktop/Project/Scout%20AI/services)
- Supabase client/env helpers: [lib](/C:/Users/HKans/OneDrive/Desktop/Project/Scout%20AI/lib)

## Commands

```bash
npm install
npm run android
npm test
```

## Verification performed

- `npm test`
- `npx expo export --platform android`
