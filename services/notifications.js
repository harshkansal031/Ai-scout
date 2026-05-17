import Constants from 'expo-constants';
import * as Device from 'expo-device';

let notificationHandlerRegistered = false;

function isExpoGo() {
  return (
    Constants.appOwnership === 'expo' ||
    Constants.executionEnvironment === 'storeClient'
  );
}

async function loadNotificationsModule() {
  if (isExpoGo()) {
    return null;
  }

  const Notifications = await import('expo-notifications');

  if (!notificationHandlerRegistered) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerRegistered = true;
  }

  return Notifications;
}

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice || isExpoGo()) {
    return null;
  }

  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId =
    process.env.EXPO_PUBLIC_SUPABASE_PROJECT_ID ??
    Constants.expoConfig?.extra?.supabaseProjectId ??
    Constants.easConfig?.projectId;

  const token = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );

  return token.data;
}

export async function sendImmediateNotification(title, body, data = {}) {
  try {
    const Notifications = await loadNotificationsModule();
    if (!Notifications) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null,
    });
  } catch (err) {
    console.warn('Failed to trigger immediate notification:', err);
  }
}

export async function scheduleEventReminderNotification(eventId, title, eventDateStr) {
  try {
    const Notifications = await loadNotificationsModule();
    if (!Notifications) return null;

    // 1. Cancel any existing notification for this event first to prevent duplicates
    await cancelEventReminderNotification(eventId);

    const eventDate = new Date(eventDateStr);
    const now = new Date();
    if (isNaN(eventDate.getTime()) || eventDate <= now) {
      return null;
    }

    // Schedule for 1 hour before the event
    const triggerTime = new Date(eventDate.getTime() - 60 * 60 * 1000); 

    let trigger;
    if (triggerTime <= now) {
      // If the event starts in less than an hour, trigger after 8 seconds for test!
      trigger = { seconds: 8 };
    } else {
      trigger = triggerTime;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔔 Upcoming Event: ${title}`,
        body: `Starting in 1 hour! Make sure you don't miss out.`,
        data: { type: 'event-reminder', eventId },
      },
      trigger,
    });

    return notificationId;
  } catch (err) {
    console.warn('Failed to schedule local notification:', err);
    return null;
  }
}

export async function cancelEventReminderNotification(eventId) {
  try {
    const Notifications = await loadNotificationsModule();
    if (!Notifications) return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.eventId === eventId) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (err) {
    console.warn('Failed to cancel local notification:', err);
  }
}
