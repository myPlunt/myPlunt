package com.myplunt.notification;

import java.util.Map;

// channelId must match the Android channel the app creates; iOS ignores it.
record ExpoPushMessage(String to, String title, String body, Map<String, String> data, String sound, String channelId) {

    ExpoPushMessage(String to, String title, String body, String url) {
        this(to, title, body, Map.of("url", url), "default", "default");
    }
}
