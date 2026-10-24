package com.myplunt.notification;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class OpenWeatherClientTest {

    private static final String FORECAST = "http://openweather/forecast";
    private static final String CURRENT = "http://openweather/weather";

    private final RestClient.Builder builder = RestClient.builder().baseUrl("http://openweather");
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    private final WeatherForecastRepository repository = mock(WeatherForecastRepository.class);
    private final OpenWeatherClient client = new OpenWeatherClient(builder.build(), "key", repository);

    // Stands in for the table, so a saved forecast can be read back.
    @BeforeEach
    void storeForecastsInMemory() {
        Map<String, WeatherForecast> table = new HashMap<>();
        when(repository.save(any())).thenAnswer(call -> {
            WeatherForecast forecast = call.getArgument(0);
            table.put(forecast.getTown(), forecast);
            return forecast;
        });
        when(repository.findById(any())).thenAnswer(call -> Optional.ofNullable(table.get(call.<String>getArgument(0))));
    }

    // Snow now, then a hot dry step and an old step that has already ended.
    private static String forecastJson() {
        long now = Instant.now().getEpochSecond();
        return """
                {"list": [
                  {"dt": %d, "main": {"temp_min": -2, "temp_max": 1}, "weather": [{"id": 1}], "wind": {"speed": 1}},
                  {"dt": %d, "main": {"temp_min": -1, "temp_max": 2}, "weather": [{"id": 601}], "wind": {"speed": 3},
                   "rain": {"3h": 4}},
                  {"dt": %d, "main": {"temp_min": 5, "temp_max": 9}, "weather": [{"id": 800}], "wind": {"speed": 2}}
                ]}""".formatted(now - 4 * 3600, now - 3600, now + 2 * 3600);
    }

    @Test
    void next24Hours_usesTheCachedForecastWhenTheApiFailsOrSendsNothing() {
        server.expect(requestTo(startsWith(FORECAST))).andRespond(withSuccess(forecastJson(), MediaType.APPLICATION_JSON));
        server.expect(requestTo(startsWith(FORECAST))).andRespond(withSuccess("{\"list\": []}", MediaType.APPLICATION_JSON));
        server.expect(requestTo(startsWith(FORECAST))).andRespond(withServerError());

        client.next24Hours(52.2215, 6.8937);

        // The step that already ended is left out of the fallback.
        OpenWeatherClient.Forecast cached = new OpenWeatherClient.Forecast(-1, 9, 4);
        assertThat(client.next24Hours(52.22, 6.89)).isEqualTo(cached);
        assertThat(client.next24Hours(52.22, 6.89)).isEqualTo(cached);
        server.verify();
    }

    @Test
    void now_cachesAForecastAndFallsBackOnItsCurrentStepWhenTheApiFails() {
        server.expect(requestTo(startsWith(FORECAST))).andRespond(withSuccess(forecastJson(), MediaType.APPLICATION_JSON));
        server.expect(requestTo(startsWith(CURRENT))).andRespond(withServerError());

        assertThat(client.now(52.22, 6.89)).isEqualTo(new OpenWeatherClient.Current(601, 3));
        server.verify();
    }

    @Test
    void now_failsWhenTheApiIsDownAndNothingIsCached() {
        server.expect(requestTo(startsWith(FORECAST))).andRespond(withServerError());
        server.expect(requestTo(startsWith(CURRENT))).andRespond(withServerError());

        assertThatThrownBy(() -> client.now(52.22, 6.89)).isInstanceOf(RestClientException.class);
    }
}
