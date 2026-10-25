package com.myplunt.config;

import io.getunleash.DefaultUnleash;
import io.getunleash.FakeUnleash;
import io.getunleash.Unleash;
import io.getunleash.util.UnleashConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeatureFlagConfig {

    // Without a URL (local dev, tests) every flag is on, so nothing needs GitLab to run.
    @Bean(destroyMethod = "shutdown")
    public Unleash unleash(
            @Value("${app.feature-flags.url}") String url,
            @Value("${app.feature-flags.instance-id}") String instanceId,
            @Value("${app.feature-flags.environment}") String environment) {
        if (url.isBlank()) {
            FakeUnleash fake = new FakeUnleash();
            fake.enableAll();
            return fake;
        }
        // GitLab picks each flag's strategy by appName, so it must be the GitLab environment's name.
        return new DefaultUnleash(UnleashConfig.builder()
                .appName(environment)
                .environment(environment)
                .instanceId(instanceId)
                .unleashAPI(url)
                .build());
    }
}
