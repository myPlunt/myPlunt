package com.myplunt.notification;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

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

    public boolean isEnabled() {
        return !apiKey.isBlank();
    }

    public Forecast next24Hours(double latitude, double longitude) {
        Response response = restClient.get()
                .uri(uri -> uri
                        .path("/forecast")
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
                response.list().stream().mapToDouble(step -> step.main().temp_max()).max().orElseThrow(),
                response.list().stream().mapToDouble(step -> step.rain() == null ? 0 : step.rain().threeHours()).sum());
    }

    public Current now(double latitude, double longitude) {
        CurrentResponse response = restClient.get()
                .uri(uri -> uri
                        .path("/weather")
                        .queryParam("lat", round(latitude))
                        .queryParam("lon", round(longitude))
                        .queryParam("units", "metric")
                        .queryParam("appid", apiKey)
                        .build())
                .retrieve()
                .body(CurrentResponse.class);
        return new Current(response.weather().getFirst().id(), response.wind().speed());
    }

    // Two decimals (about 1 km): users in the same town share a forecast, and we don't send their exact spot.
    public static double round(double coordinate) {
        return Math.round(coordinate * 100) / 100.0;
    }

    public record Forecast(double minTemp, double maxTemp, double rainMm) {}

    // conditionId is OpenWeather's weather code (2xx storm, 3xx drizzle, 5xx rain, 6xx snow...); wind in m/s.
    public record Current(int conditionId, double windSpeed) {}

    record Response(List<Step> list) {}

    // rain is left out of a step when it stays dry.
    record Step(Main main, Rain rain) {}

    record Rain(@JsonProperty("3h") double threeHours) {}

    record CurrentResponse(List<Condition> weather, Wind wind) {}

    record Condition(int id) {}

    record Wind(double speed) {}

    // Named as in OpenWeather's JSON.
    record Main(double temp_min, double temp_max) {}
}
