package com.myplunt.plant;

import com.myplunt.auth.JwtService;
import com.myplunt.config.SecurityConfig;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@WebMvcTest(PlantController.class)
@AutoConfigureRestTestClient
@Import(SecurityConfig.class)
class PlantControllerTest {

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private PlantService plantService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    private final UUID plantId = UUID.randomUUID();

    private UUID authenticateAsJane() {
        UUID id = UUID.randomUUID();
        User user = new User("jane", "jane@example.com", "hashed");
        ReflectionTestUtils.setField(user, "id", id);
        when(jwtService.parseAndValidate("access-token")).thenReturn(id);
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        return id;
    }

    @Test
    void water_returnsNoContentAndWatersThePlant() {
        UUID userId = authenticateAsJane();

        restTestClient.post().uri("/v1/plants/{plantId}/waterings", plantId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isNoContent();

        verify(plantService).water(userId, plantId);
    }

    @Test
    void water_returnsNotFoundWhenThePlantIsNotTheUsers() {
        UUID userId = authenticateAsJane();
        doThrow(new IllegalStateException("Plant not found")).when(plantService).water(userId, plantId);

        restTestClient.post().uri("/v1/plants/{plantId}/waterings", plantId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    void water_propagatesConflictFromService() {
        UUID userId = authenticateAsJane();
        doThrow(new ResponseStatusException(HttpStatus.CONFLICT, "This plant has passed away and can't be watered"))
                .when(plantService).water(userId, plantId);

        restTestClient.post().uri("/v1/plants/{plantId}/waterings", plantId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void water_rejectsAMalformedPlantId() {
        authenticateAsJane();

        restTestClient.post().uri("/v1/plants/not-a-uuid/waterings")
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void water_rejectsRequestsWithoutAToken() {
        restTestClient.post().uri("/v1/plants/{plantId}/waterings", plantId)
                .exchange()
                .expectStatus().isUnauthorized();
    }
}
