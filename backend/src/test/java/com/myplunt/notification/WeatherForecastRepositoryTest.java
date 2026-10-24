package com.myplunt.notification;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class WeatherForecastRepositoryTest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private WeatherForecastRepository weatherForecastRepository;

    @Autowired
    private TestEntityManager entityManager;

    // The steps go through JSONB, which a mock can't check.
    @Test
    void save_keepsTheForecastStepsThroughTheJsonColumnAndReplacesTheTownsLastOne() {
        OpenWeatherClient.Step dry = new OpenWeatherClient.Step(1_800_000_000L, new OpenWeatherClient.Main(-1, 4),
                List.of(new OpenWeatherClient.Condition(800)), new OpenWeatherClient.Wind(3), null);
        OpenWeatherClient.Step wet = new OpenWeatherClient.Step(1_800_010_800L, new OpenWeatherClient.Main(2, 6),
                List.of(new OpenWeatherClient.Condition(500)), new OpenWeatherClient.Wind(9), new OpenWeatherClient.Rain(4.5));
        weatherForecastRepository.save(new WeatherForecast("52.22,6.89", List.of(dry)));
        weatherForecastRepository.save(new WeatherForecast("52.22,6.89", List.of(dry, wet)));
        entityManager.flush();
        entityManager.clear();

        assertThat(weatherForecastRepository.count()).isEqualTo(1);
        assertThat(weatherForecastRepository.findById("52.22,6.89").orElseThrow().getSteps()).containsExactly(dry, wet);
    }
}
