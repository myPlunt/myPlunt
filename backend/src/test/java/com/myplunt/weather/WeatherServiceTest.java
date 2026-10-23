package com.myplunt.weather;

import com.myplunt.notification.OpenWeatherClient;
import com.myplunt.user.User;
import io.getunleash.FakeUnleash;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClientException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WeatherServiceTest {

    @Mock
    private OpenWeatherClient openWeatherClient;

    private final FakeUnleash unleash = new FakeUnleash();

    @BeforeEach
    void flagOn() {
        unleash.enableAll();
    }

    private User userAt(Double latitude, Double longitude) {
        User user = new User("jane", "jane@example.com", "hashed");
        user.setLatitude(latitude);
        user.setLongitude(longitude);
        return user;
    }

    @Test
    void condition_mapsOpenWeatherCodesAndWindToTheVisual() {
        assertThat(WeatherService.condition(new OpenWeatherClient.Current(601, 12))).isEqualTo(WeatherCondition.SNOW);
        assertThat(WeatherService.condition(new OpenWeatherClient.Current(500, 12))).isEqualTo(WeatherCondition.RAIN);
        assertThat(WeatherService.condition(new OpenWeatherClient.Current(301, 1))).isEqualTo(WeatherCondition.RAIN);
        assertThat(WeatherService.condition(new OpenWeatherClient.Current(800, 9))).isEqualTo(WeatherCondition.WIND);
        assertThat(WeatherService.condition(new OpenWeatherClient.Current(800, 3))).isEqualTo(WeatherCondition.NONE);
    }

    @Test
    void current_fetchesOncePerTownAndReusesIt() {
        when(openWeatherClient.isEnabled()).thenReturn(true);
        when(openWeatherClient.now(52.22, 6.89)).thenReturn(new OpenWeatherClient.Current(500, 2));
        WeatherService service = new WeatherService(openWeatherClient, unleash);

        assertThat(service.current(userAt(52.2215, 6.8937)).condition()).isEqualTo(WeatherCondition.RAIN);
        assertThat(service.current(userAt(52.2187, 6.8901)).condition()).isEqualTo(WeatherCondition.RAIN);
        verify(openWeatherClient, times(1)).now(anyDouble(), anyDouble());
    }

    @Test
    void current_showsNothingWithoutALocation() {
        when(openWeatherClient.isEnabled()).thenReturn(true);

        assertThat(new WeatherService(openWeatherClient, unleash).current(userAt(null, null)).condition())
                .isEqualTo(WeatherCondition.NONE);
        verify(openWeatherClient, never()).now(anyDouble(), anyDouble());
    }

    @Test
    void current_showsNothingWhenOpenWeatherFails() {
        when(openWeatherClient.isEnabled()).thenReturn(true);
        when(openWeatherClient.now(52.22, 6.89)).thenThrow(new RestClientException("down"));

        assertThat(new WeatherService(openWeatherClient, unleash).current(userAt(52.22, 6.89)).condition())
                .isEqualTo(WeatherCondition.NONE);
    }

    @Test
    void current_showsAPreviewToEveryoneOverTheRealWeather() {
        WeatherService service = new WeatherService(openWeatherClient, unleash);

        service.preview(WeatherCondition.WIND);

        assertThat(service.current(userAt(null, null)).condition()).isEqualTo(WeatherCondition.WIND);
        verify(openWeatherClient, never()).now(anyDouble(), anyDouble());
    }

    @Test
    void current_showsNothingWhenTheFlagIsOff() {
        unleash.disableAll();

        assertThat(new WeatherService(openWeatherClient, unleash).current(userAt(52.22, 6.89)).condition())
                .isEqualTo(WeatherCondition.NONE);
        verify(openWeatherClient, never()).now(anyDouble(), anyDouble());
    }
}
