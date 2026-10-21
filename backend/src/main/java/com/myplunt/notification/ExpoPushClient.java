package com.myplunt.notification;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
public class ExpoPushClient {

    // Expo accepts at most 100 messages per request.
    private static final int BATCH_SIZE = 100;

    private final RestClient restClient;

    public ExpoPushClient(@Value("${app.push.expo-url}") String expoUrl) {
        this.restClient = RestClient.create(expoUrl);
    }

    // shortcut: ignores Expo's per-message tickets, so tokens of uninstalled apps stay in push_tokens;
    // read the tickets and delete DeviceNotRegistered tokens once there are many users.
    public void send(List<ExpoPushMessage> messages) {
        for (int from = 0; from < messages.size(); from += BATCH_SIZE) {
            restClient.post()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(messages.subList(from, Math.min(from + BATCH_SIZE, messages.size())))
                    .retrieve()
                    .toBodilessEntity();
        }
    }
}
