package com.myplunt.species;

import tools.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

// Perenual (perenual.com) is the source for importing species: unlike Trefle it gives watering in
// days, sunlight and origin. Free plan: 100 requests a day, details only for species ids 1 to 3000.
@Component
public class PerenualClient {

    private final RestClient restClient;
    private final String apiKey;

    @Autowired
    public PerenualClient(@Value("${app.perenual.url}") String url, @Value("${app.perenual.api-key}") String apiKey) {
        this(RestClient.create(url), apiKey);
    }

    PerenualClient(RestClient restClient, String apiKey) {
        this.restClient = restClient;
        this.apiKey = apiKey;
    }

    public boolean isEnabled() {
        return !apiKey.isBlank();
    }

    public Page list(int page) {
        return restClient.get()
                .uri("/species-list?key={key}&page={page}", apiKey, page)
                .retrieve()
                .body(Page.class);
    }

    // A JsonNode, because the free plan puts "Upgrade Plans..." strings where objects and arrays go.
    public JsonNode details(int id) {
        return restClient.get()
                .uri("/species/details/{id}?key={key}", id, apiKey)
                .retrieve()
                .body(JsonNode.class);
    }

    public record Page(List<Item> data, int last_page) {}

    public record Item(int id, List<String> scientific_name) {}
}
