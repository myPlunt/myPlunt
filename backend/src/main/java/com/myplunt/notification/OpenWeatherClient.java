package com.myplunt.notification;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.myplunt.common.logging.LogEvent;
import com.myplunt.common.logging.StructuredLog;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Component
public class OpenWeatherClient {

    private static final Logger log = LoggerFactory.getLogger(OpenWeatherClient.class);

    // Sixteen 3-hour steps: today and tomorrow, so a failed call can fall back on the last forecast.
    private static final int STEPS = 16;

    // Eight steps: the next 24 hours.
    private static final int DAY = 8;

    private static final Duration STEP = Duration.ofHours(3);

    private final RestClient restClient;
    private final String apiKey;
    private final WeatherForecastRepository weatherForecastRepository;

    @Autowired
    public OpenWeatherClient(
            @Value("${app.weather.openweather-url}") String url,
            @Value("${app.weather.api-key}") String apiKey,
            WeatherForecastRepository weatherForecastRepository) {
        this(RestClient.create(url), apiKey, weatherForecastRepository);
    }

    OpenWeatherClient(RestClient restClient, String apiKey, WeatherForecastRepository weatherForecastRepository) {
        this.restClient = restClient;
        this.apiKey = apiKey;
        this.weatherForecastRepository = weatherForecastRepository;
    }

    public boolean isEnabled() {
        return !apiKey.isBlank();
    }

    public Forecast next24Hours(double latitude, double longitude) {
        List<Step> day = forecast(latitude, longitude).stream().limit(DAY).toList();
        return new Forecast(
                day.stream().mapToDouble(step -> step.main().temp_min()).min().orElseThrow(),
                day.stream().mapToDouble(step -> step.main().temp_max()).max().orElseThrow(),
                day.stream().mapToDouble(step -> step.rain() == null ? 0 : step.rain().threeHours()).sum());
    }

    public Current now(double latitude, double longitude) {
        String town = town(latitude, longitude);
        // Towns that only ask for the current weather still need a forecast cached for when the API fails.
        if (stepsLeft(town).size() < DAY) {
            try {
                forecast(latitude, longitude);
            } catch (RestClientException e) {
                // The current weather below may still work.
            }
        }
        try {
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
            if (response != null && response.weather() != null && !response.weather().isEmpty()) {
                return new Current(response.weather().getFirst().id(), response.wind().speed());
            }
        } catch (RestClientException e) {
            // Falls back on the cached forecast below.
        }
        List<Step> left = stepsLeft(town);
        if (left.isEmpty()) {
            throw new RestClientException("No weather for " + town);
        }
        StructuredLog.warning(log, LogEvent.WEATHER_CACHE_USED, Map.of("call", "weather", "stepsLeft", left.size()));
        Step step = left.getFirst();
        return new Current(step.weather().getFirst().id(), step.wind().speed());
    }

    private List<Step> forecast(double latitude, double longitude) {
        String town = town(latitude, longitude);
        try {
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
            if (response != null && response.list() != null && !response.list().isEmpty()) {
                weatherForecastRepository.save(new WeatherForecast(town, response.list()));
                return response.list();
            }
        } catch (RestClientException e) {
            // Falls back on the cached forecast below.
        }
        List<Step> left = stepsLeft(town);
        if (left.isEmpty()) {
            throw new RestClientException("No forecast for " + town);
        }
        StructuredLog.warning(log, LogEvent.WEATHER_CACHE_USED, Map.of("call", "forecast", "stepsLeft", left.size()));
        return left;
    }

    // A step that has started but not ended still counts.
    private List<Step> stepsLeft(String town) {
        Instant now = Instant.now();
        return weatherForecastRepository.findById(town).map(WeatherForecast::getSteps).orElse(List.of()).stream()
                .filter(step -> Instant.ofEpochSecond(step.dt()).plus(STEP).isAfter(now))
                .toList();
    }

    private static String town(double latitude, double longitude) {
        return round(latitude) + "," + round(longitude);
    }

    // Two decimals (about 1 km): users in the same town share a forecast, and we don't send their exact spot.
    public static double round(double coordinate) {
        return Math.round(coordinate * 100) / 100.0;
    }

    public record Forecast(double minTemp, double maxTemp, double rainMm) {}

    // conditionId is OpenWeather's weather code (2xx storm, 3xx drizzle, 5xx rain, 6xx snow...); wind in m/s.
    public record Current(int conditionId, double windSpeed) {}

    record Response(List<Step> list) {}

    // dt is the step's start in epoch seconds; rain is left out of a step when it stays dry.
    record Step(long dt, Main main, List<Condition> weather, Wind wind, Rain rain) {}

    record Rain(@JsonProperty("3h") double threeHours) {}

    record CurrentResponse(List<Condition> weather, Wind wind) {}

    record Condition(int id) {}

    record Wind(double speed) {}

    // Named as in OpenWeather's JSON.
    record Main(double temp_min, double temp_max) {}
}
