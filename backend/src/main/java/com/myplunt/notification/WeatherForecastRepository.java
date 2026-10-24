package com.myplunt.notification;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WeatherForecastRepository extends JpaRepository<WeatherForecast, String> {
}
