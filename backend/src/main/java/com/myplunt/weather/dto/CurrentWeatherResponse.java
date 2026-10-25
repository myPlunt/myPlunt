package com.myplunt.weather.dto;

import com.myplunt.weather.WeatherCondition;

public record CurrentWeatherResponse(WeatherCondition condition) {}
