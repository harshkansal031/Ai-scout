const appJson = require('./app.json');

// extra.* from EXPO_PUBLIC_* (.env locally, EAS Environment Variables on CI/build).
module.exports = () => ({
  expo: {
    ...appJson.expo,
    extra: {
      eas: appJson.expo.extra?.eas,
      appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
      supabaseProjectId: process.env.EXPO_PUBLIC_SUPABASE_PROJECT_ID ?? '',
      authEmailConfirmRedirectUrl: process.env.EXPO_PUBLIC_AUTH_EMAIL_CONFIRM_REDIRECT_URL ?? '',
    },
  },
});
