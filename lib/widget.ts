// lib/widget.ts
import { SharedStorage, WidgetCenter } from 'react-native-widget-extension';
import { supabase } from './supabase';

// Function to update widget data via SharedStorage and reload timelines
export const updateWidgetData = async (photoUrl: string, senderName: string) => {
  try {
    // Write to SharedStorage (which uses AppGroup for iOS and shared preferences for Android)
    await SharedStorage.setItem('latestPhotoURL', photoUrl);
    await SharedStorage.setItem('senderName', senderName);
    
    // Reload all widget timelines to reflect the new data
    await WidgetCenter.reloadAllTimelines();
    
    console.log('Widget data updated successfully');
  } catch (error) {
    console.error('Error updating widget data:', error);
  }
};

// Function to get the latest photo URL and sender name from SharedStorage (for debugging)
export const getWidgetData = async () => {
  try {
    const photoUrl = await SharedStorage.getItem('latestPhotoURL');
    const senderName = await SharedStorage.getItem('senderName');
    return { photoUrl, senderName };
  } catch (error) {
    console.error('Error getting widget data:', error);
    return { photoUrl: null, senderName: null };
  }
};

// Function to initialize notifications (to be called after auth)
export const setupNotifications = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push notification permissions!');
    return false;
  }
  return true;
};

// Function to get and save Expo push token to user's profile
export const registerForPushNotificationsAsync = async (userId: string) => {
  try {
    // Get the token that identifies this device
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);

    // Save the token to the user's profile in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ expo_push_token: token })
      .eq('id', userId);

    if (error) throw error;
    console.log('Push token saved to profile');
    return token;
  } catch (error) {
    console.error('Error getting or saving push token:', error);
    return null;
  }
};

// Function to handle incoming notifications (foreground and background)
export const setupNotificationHandler = (onReceiveNotification: (notification: any) => void) => {
  // Handle notifications when the app is in the foreground
  const foregroundSubscription = Notifications.addEventListener(
    'received',
    (notification) => {
      onReceiveNotification(notification);
    }
  );

  // Handle notifications when the app is in the background (but not terminated)
  const backgroundSubscription = Notifications.addEventListener(
    'response',
    (response) => {
      onReceiveNotification(response.notification);
    }
  );

  return () => {
    foregroundSubscription.remove();
    backgroundSubscription.remove();
  };
};

// Function to send a batch of Expo push notifications
export const sendExpoNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, any> = {}
) => {
  // Expo push notification API has a limit of 100 tokens per request
  const BATCH_SIZE = 100;
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);
    const message = {
      to: batch,
      sound: 'default',
      title,
      body,
      data,
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const responseJson = await response.json();
      console.log('Push notification batch response:', responseJson);

      // Check for errors in the response
      if (responseJson.data) {
        for (const item of responseJson.data) {
          if (item.status === 'ok') {
            successCount++;
          } else {
            failureCount++;
            console.error('Failed to send push notification:', item.message);
          }
        }
      }
    } catch (error) {
      console.error('Error sending push notification batch:', error);
      failureCount += batch.length;
    }
  }

  console.log(`Push notifications sent: ${successCount} success, ${failureCount} failed`);
  return { successCount, failureCount };
};