package com.myplunt.garden;

import com.myplunt.auth.JwtService;
import com.myplunt.config.SecurityConfig;
import com.myplunt.garden.dto.GardenPlantResponse;
import com.myplunt.garden.dto.GardenResponse;
import com.myplunt.garden.dto.RoomResponse;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.client.RestTestClient;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.when;

@WebMvcTest(GardenController.class)
@AutoConfigureRestTestClient
@Import(SecurityConfig.class)
class GardenControllerTest {

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private GardenService gardenService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void garden_returnsTheAuthenticatedUsersGarden() {
        UUID id = UUID.randomUUID();
        User user = new User("jane", "jane@example.com", "hashed");
        ReflectionTestUtils.setField(user, "id", id);
        when(jwtService.parseAndValidate("access-token")).thenReturn(id);
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        GardenResponse garden = new GardenResponse(List.of(new RoomResponse(
                UUID.randomUUID(),
                "Balcony",
                List.of(new GardenPlantResponse(
                        UUID.randomUUID(),
                        "George",
                        "Geranium",
                        4,
                        Instant.parse("2026-10-07T08:00:00Z"),
                        Instant.parse("2026-10-11T08:00:00Z"),
                        "https://storage.test/george.jpg?signed")))));
        when(gardenService.getGarden(id)).thenReturn(garden);

        restTestClient.get().uri("/v1/garden")
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isOk()
                .expectBody(GardenResponse.class)
                .isEqualTo(garden);
    }

    @Test
    void garden_rejectsRequestsWithoutAToken() {
        restTestClient.get().uri("/v1/garden")
                .exchange()
                .expectStatus().isUnauthorized();
    }
}
