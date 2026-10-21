package com.myplunt.notification;

import java.util.Map;

// One message for Expo's push service, which hands it to Apple (APNs) or Google (FCM).
// data.url: the app screen a tap opens. channelId: the Android channel the app creates; iOS ignores it.
record ExpoPushMessage(String to, String title, String body, Map<String, String> data, String sound, String channelId) {

    ExpoPushMessage(String to, String title, String body, String url) {
        this(to, title, body, Map.of("url", url), "default", "default");
    }
}
