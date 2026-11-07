package com.myplunt.species;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.net.URI;
import java.util.List;

// Trefle (trefle.io) is the source for importing species: free, 60 requests a minute, no daily cap.
// It has names, pictures and native regions, but almost never watering or light: the admin fills
// those in with Edit before approving.
@Component
public class TrefleClient {

    static final int PAGE_SIZE = 20;

    private final RestClient restClient;
    private final String apiKey;

    @Autowired
    public TrefleClient(@Value("${app.trefle.url}") String url, @Value("${app.trefle.api-key}") String apiKey) {
        this(RestClient.create(url), apiKey);
    }

    TrefleClient(RestClient restClient, String apiKey) {
        this.restClient = restClient;
        this.apiKey = apiKey;
    }

    public boolean isEnabled() {
        return !apiKey.isBlank();
    }

    // Only species with a common name and a picture: about 14,500 of Trefle's 494,000, and the rest are
    // mostly wild plants nobody keeps at home.
    public Page list(int page) {
        return restClient.get()
                .uri(builder -> builder.path("/species")
                        .queryParam("token", apiKey)
                        .queryParam("page", page)
                        .queryParam("filter_not[common_name]", "null")
                        .queryParam("filter_not[image_url]", "null")
                        .build())
                .retrieve()
                .body(Page.class);
    }

    // The "data" object of a species: growth, specifications and distributions are only here.
    public JsonNode details(int id) {
        JsonNode body = restClient.get()
                .uri(builder -> builder.path("/species/{id}").queryParam("token", apiKey).build(id))
                .retrieve()
                .body(JsonNode.class);
        return body == null ? null : body.path("data");
    }

    // A URI, so a signed or pre-encoded link isn't re-encoded.
    public ResponseEntity<byte[]> image(String url) {
        return restClient.get().uri(URI.create(url)).retrieve().toEntity(byte[].class);
    }

    public record Page(List<Item> data, Meta meta) {
        public int lastPage() {
            return Math.max(1, (meta.total() + PAGE_SIZE - 1) / PAGE_SIZE);
        }
    }

    public record Meta(int total) {}

    public record Item(int id, String common_name, String scientific_name, String genus, String image_url) {}
}
