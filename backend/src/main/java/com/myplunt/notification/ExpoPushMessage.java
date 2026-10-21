package com.myplunt.notification;

// One message for Expo's push service, which hands it to Apple (APNs) or Google (FCM).
// channelId: the Android channel the app creates; iOS ignores it.
record ExpoPushMessage(String to, String title, String body, String sound, String channelId) {

    ExpoPushMessage(String to, String title, String body) {
        this(to, title, body, "default", "default");
    }
}
