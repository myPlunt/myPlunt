package com.myplunt.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "weather_forecasts")
public class WeatherForecast {
    @Id
    private String town;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private List<OpenWeatherClient.Step> steps;

    @Column(name = "fetched_at", nullable = false)
    private Instant fetchedAt;

    protected WeatherForecast() {}

    public WeatherForecast(String town, List<OpenWeatherClient.Step> steps) {
        this.town = town;
        this.steps = steps;
        this.fetchedAt = Instant.now();
    }

    public String getTown() {
        return town;
    }

    public List<OpenWeatherClient.Step> getSteps() {
        return steps;
    }

    public Instant getFetchedAt() {
        return fetchedAt;
    }
}
