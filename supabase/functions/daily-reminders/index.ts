import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get today's active published topic
    const { data: topic, error: topicError } = await supabase
      .from('daily_topics')
      .select('*')
      .eq('is_published', true)
      .order('publish_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (topicError) {
      throw topicError;
    }

    if (!topic) {
      return new Response(
        JSON.stringify({ success: true, message: 'No published daily topic found today.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 2. Fetch all profiles, preferences, and progress states
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        streak_count,
        user_preferences (
          notification_preferences
        ),
        user_progress (
          completed_topic_ids
        )
      `);

    if (usersError) {
      throw usersError;
    }

    // 3. Fetch all active device tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('device_tokens')
      .select('token, user_id');

    if (tokensError) {
      throw tokensError;
    }

    // Group device tokens by user_id
    const userTokensMap: { [userId: string]: string[] } = {};
    for (const entry of tokens || []) {
      if (!entry.token || !entry.user_id) continue;
      if (!userTokensMap[entry.user_id]) {
        userTokensMap[entry.user_id] = [];
      }
      userTokensMap[entry.user_id].push(entry.token);
    }

    // 4. Construct Push Messages for users who have NOT completed today's topic
    const pushMessages: Array<{
      to: string;
      sound: string;
      title: string;
      body: string;
      data: any;
    }> = [];

    for (const user of users || []) {
      // Extract user preferences
      const prefRecord = Array.isArray(user.user_preferences) 
        ? user.user_preferences[0] 
        : user.user_preferences;
      
      const notificationPrefs = prefRecord?.notification_preferences ?? { dailyTopic: true };

      // Skip user if they disabled dailyTopic alerts
      if (notificationPrefs.dailyTopic === false) {
        continue;
      }

      // Check if they completed today's topic
      const progressRecord = Array.isArray(user.user_progress)
        ? user.user_progress[0]
        : user.user_progress;
      
      const completedIds: string[] = progressRecord?.completed_topic_ids ?? [];

      // ONLY send push alert if today's topic has NOT been marked complete yet!
      if (!completedIds.includes(topic.id)) {
        const userTokens = userTokensMap[user.id] || [];
        
        for (const token of userTokens) {
          pushMessages.push({
            to: token,
            sound: 'default',
            title: 'Protect your streak today! ⌛🔥',
            body: `The day is winding down! Take 10 minutes to complete today's module on "${topic.title}" and keep your ${user.streak_count || 0}-day streak safe.`,
            data: { type: 'daily-topic', topicId: topic.id }
          });
        }
      }
    }

    // 5. Send push notifications in chunks of 100 (Expo API recommendation)
    const chunkSize = 100;
    let sentCount = 0;

    for (let i = 0; i < pushMessages.length; i += chunkSize) {
      const chunk = pushMessages.slice(i, i + chunkSize);
      
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept-encoding': 'gzip, deflate',
          'accept': 'application/json'
        },
        body: JSON.stringify(chunk)
      });

      if (res.ok) {
        sentCount += chunk.length;
      } else {
        const errText = await res.text();
        console.error(`Expo Push API failed for chunk starting at index ${i}: ${errText}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: sentCount,
        totalTargets: pushMessages.length,
        topic: topic.title
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || err }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
