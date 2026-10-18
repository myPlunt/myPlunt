package com.myplunt.config;

import com.myplunt.admin.AdminJwtAuthFilter;
import com.myplunt.admin.AdminJwtService;
import com.myplunt.admin.AdminUserRepository;
import com.myplunt.constants.ApiPaths;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

// The admin dashboard's own security chain, for /v1/admin/** only and checked before the app's
// (SecurityConfig). Only admin access tokens are accepted here (AdminJwtAuthFilter), and admin
// tokens are useless on the app's routes. CSRF protection isn't needed: the access token is sent
// in a header, and the refresh cookie is SameSite=Strict (AdminRefreshCookie).
@Configuration
public class AdminSecurityConfig {

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public SecurityFilterChain adminFilterChain(
            HttpSecurity http,
            AdminJwtService jwtService,
            AdminUserRepository adminUserRepository,
            @Value("${app.admin.allowed-origins}") List<String> allowedOrigins) throws Exception {
        return http
                .securityMatcher(ApiPaths.Admin.BASE + "/**")
                .cors(cors -> cors.configurationSource(corsConfiguration(allowedOrigins)))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())
                // Unlike the app's chain, the 401 isn't logged: nothing the admin app does is (see CLAUDE.md).
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, e) ->
                        response.setStatus(HttpStatus.UNAUTHORIZED.value())))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(ApiPaths.Admin.AUTH + "/**").permitAll()
                        .anyRequest().hasRole("ADMIN"))
                .addFilterBefore(new AdminJwtAuthFilter(jwtService, adminUserRepository),
                        UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    // Only the dashboard's own origin may call the admin API from a browser, with credentials so
    // the refresh cookie is sent. No origins configured means no browser can.
    private static UrlBasedCorsConfigurationSource corsConfiguration(List<String> allowedOrigins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins.stream().map(String::strip).filter(origin -> !origin.isEmpty()).toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration(ApiPaths.Admin.BASE + "/**", config);
        return source;
    }
}
