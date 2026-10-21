package com.myplunt.notification;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

// OpenWeatherMap's free 5-day / 3-hour forecast.
@Component
public class OpenWeatherClient {

    // Eight 3-hour steps: the next 24 hours.
    private static final int STEPS = 8;

    private final RestClient restClient;
    private final String apiKey;

    public OpenWeatherClient(
            @Value("${app.weather.openweather-url}") String url,
            @Value("${app.weather.api-key}") String apiKey) {
        this.restClient = RestClient.create(url);
        this.apiKey = apiKey;
    }

    // Without a key (local dev) weather alerts are off.
    public boolean isEnabled() {
        return !apiKey.isBlank();
    }

    public Forecast next24Hours(double latitude, double longitude) {
        Response response = restClient.get()
                .uri(uri -> uri
                        .queryParam("lat", round(latitude))
                        .queryParam("lon", round(longitude))
                        .queryParam("cnt", STEPS)
                        .queryParam("units", "metric")
                        .queryParam("appid", apiKey)
                        .build())
                .retrieve()
                .body(Response.class);
        return new Forecast(
                response.list().stream().mapToDouble(step -> step.main().temp_min()).min().orElseThrow(),
                response.list().stream().mapToDouble(step -> step.main().temp_max()).max().orElseThrow());
    }

    // Two decimals (about 1 km): users in the same town share a forecast, and we don't send their exact spot.
    static double round(double coordinate) {
        return Math.round(coordinate * 100) / 100.0;
    }

    public record Forecast(double minTemp, double maxTemp) {}

    record Response(List<Step> list) {}

    record Step(Main main) {}

    // Named as in OpenWeather's JSON.
    record Main(double temp_min, double temp_max) {}
}
