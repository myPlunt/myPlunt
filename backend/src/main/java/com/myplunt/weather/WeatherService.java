package com.myplunt.weather;

import com.myplunt.common.logging.LogEvent;
import com.myplunt.common.logging.StructuredLog;
import com.myplunt.notification.OpenWeatherClient;
import com.myplunt.user.User;
import com.myplunt.weather.dto.CurrentWeatherResponse;
import io.getunleash.Unleash;
import io.getunleash.UnleashContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class WeatherService {

    private static final Logger log = LoggerFactory.getLogger(WeatherService.class);

    static final double WINDY_METRES_PER_SECOND = 8.0;

    private static final Duration CACHE_FOR = Duration.ofMinutes(15);

    // How long a staging preview job overrides the real weather.
    static final Duration PREVIEW_FOR = Duration.ofMinutes(2);

    static final String FLAG = "weather_visuals";

    private final OpenWeatherClient openWeatherClient;
    private final Unleash unleash;
    private volatile Preview preview;
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    public WeatherService(OpenWeatherClient openWeatherClient, Unleash unleash) {
        this.openWeatherClient = openWeatherClient;
        this.unleash = unleash;
    }

    public CurrentWeatherResponse current(User user) {
        Preview active = preview;
        if (active != null && Instant.now().isBefore(active.until())) {
            return new CurrentWeatherResponse(active.condition());
        }
        // After the preview check, so the staging jobs work whatever the flag says. The user id lets
        // GitLab's percentage and user-list rollouts pick users.
        if (!unleash.isEnabled(FLAG, UnleashContext.builder().userId(String.valueOf(user.getId())).build())
                || !openWeatherClient.isEnabled() || user.getLatitude() == null || user.getLongitude() == null) {
            return new CurrentWeatherResponse(WeatherCondition.NONE);
        }
        double lat = OpenWeatherClient.round(user.getLatitude());
        double lon = OpenWeatherClient.round(user.getLongitude());
        String town = lat + "," + lon;
        Instant now = Instant.now();
        Cached cached = cache.get(town);
        if (cached == null || cached.fetchedAt().plus(CACHE_FOR).isBefore(now)) {
            cached = new Cached(fetch(lat, lon), now);
            cache.put(town, cached);
        }
        return new CurrentWeatherResponse(cached.condition());
    }

    public void preview(WeatherCondition condition) {
        preview = new Preview(condition, Instant.now().plus(PREVIEW_FOR));
    }

    private WeatherCondition fetch(double lat, double lon) {
        try {
            return condition(openWeatherClient.now(lat, lon));
        } catch (RestClientException e) {
            StructuredLog.error(log, LogEvent.WEATHER_FETCH_FAILED, e, Map.of());
            return WeatherCondition.NONE;
        }
    }

    // Snow and rain win over wind
    static WeatherCondition condition(OpenWeatherClient.Current current) {
        int group = current.conditionId() / 100;
        if (group == 6) {
            return WeatherCondition.SNOW;
        }
        if (group == 2 || group == 3 || group == 5) {
            return WeatherCondition.RAIN;
        }
        if (current.windSpeed() >= WINDY_METRES_PER_SECOND) {
            return WeatherCondition.WIND;
        }
        return WeatherCondition.NONE;
    }

    private record Cached(WeatherCondition condition, Instant fetchedAt) {}

    private record Preview(WeatherCondition condition, Instant until) {}
}
