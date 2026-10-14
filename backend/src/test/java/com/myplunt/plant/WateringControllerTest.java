package com.myplunt.plant;

import com.myplunt.auth.JwtService;
import com.myplunt.config.SecurityConfig;
import com.myplunt.plant.dto.WateringLogResponse;
import com.myplunt.plant.dto.WateringStreakResponse;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.client.RestTestClient;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@WebMvcTest(WateringController.class)
@AutoConfigureRestTestClient
@Import(SecurityConfig.class)
class WateringControllerTest {

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private PlantService plantService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private final Instant from = Instant.parse("2026-09-30T22:00:00Z");
    private final Instant to = Instant.parse("2026-10-31T23:00:00Z");

    private UUID authenticateAsJane() {
        UUID id = UUID.randomUUID();
        User user = new User("jane", "jane@example.com", "hashed");
        ReflectionTestUtils.setField(user, "id", id);
        when(jwtService.parseAndValidate("access-token")).thenReturn(id);
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        return id;
    }

    @Test
    void waterings_returnsTheUsersWateringsInTheRange() {
        UUID userId = authenticateAsJane();
        List<WateringLogResponse> waterings = List.of(
                new WateringLogResponse(UUID.randomUUID(), UUID.randomUUID(), "Vera", Instant.parse("2026-10-07T08:00:00Z")));
        when(plantService.getWaterings(userId, from, to)).thenReturn(waterings);

        restTestClient.get().uri("/v1/waterings?from={from}&to={to}", from, to)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isOk()
                .expectBody(new ParameterizedTypeReference<List<WateringLogResponse>>() {})
                .isEqualTo(waterings);
    }

    @Test
    void waterings_rejectsAMissingOrMalformedRange() {
        authenticateAsJane();

        restTestClient.get().uri("/v1/waterings?from={from}", from)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isBadRequest();
        restTestClient.get().uri("/v1/waterings?from=yesterday&to={to}", to)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isBadRequest();
        verify(plantService, never()).getWaterings(any(), any(), any());
    }

    @Test
    void streak_returnsTheUsersStreakCountedInTheirTimeZone() {
        UUID userId = authenticateAsJane();
        when(plantService.getWateringStreak(userId, ZoneId.of("Europe/Amsterdam"))).thenReturn(new WateringStreakResponse(7));

        restTestClient.get().uri("/v1/waterings/streak?zone=Europe/Amsterdam")
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isOk()
                .expectBody(WateringStreakResponse.class)
                .isEqualTo(new WateringStreakResponse(7));
    }

}
