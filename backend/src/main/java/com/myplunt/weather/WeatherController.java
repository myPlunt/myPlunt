package com.myplunt.weather;

import com.myplunt.constants.ApiPaths;
import com.myplunt.user.User;
import com.myplunt.weather.dto.CurrentWeatherResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WeatherController {

    private final WeatherService weatherService;

    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    // At the user's saved location, for the app's weather visuals.
    @GetMapping(ApiPaths.Weather.CURRENT)
    public CurrentWeatherResponse current(@AuthenticationPrincipal User principal) {
        return weatherService.current(principal);
    }
}
