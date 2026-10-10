package com.myplunt.plant;

import com.myplunt.auth.JwtService;
import com.myplunt.config.SecurityConfig;
import com.myplunt.plant.dto.CreatePlantRequest;
import com.myplunt.plant.dto.PlantResponse;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
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

    private void expectBadRequest(String body) {
        restTestClient.post().uri("/v1/plants")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void create_returnsTheCreatedPlantForTheSignedInUser() {
        UUID ownerId = authenticateAsJane();
        CreatePlantRequest request = new CreatePlantRequest("Vera", "bright_indirect", 7, "Found at a flea market", null, null, null);
        when(plantService.create(eq(ownerId), eq(request)))
                .thenReturn(new PlantResponse(plantId, "Vera", "bright_indirect", 7, "Found at a flea market", null, null, null));

        restTestClient.post().uri("/v1/plants")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(PlantResponse.class)
                .isEqualTo(new PlantResponse(plantId, "Vera", "bright_indirect", 7, "Found at a flea market", null, null, null));
    }

    @Test
    void create_stripsSurroundingWhitespaceFromName() {
        UUID ownerId = authenticateAsJane();
        when(plantService.create(eq(ownerId), eq(new CreatePlantRequest("Vera", null, null, null, null, null, null))))
                .thenReturn(new PlantResponse(plantId, "Vera", null, null, null, null, null, null));

        restTestClient.post().uri("/v1/plants")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"name\": \"  Vera  \"}")
                .exchange()
                .expectStatus().isCreated()
                .expectBody(PlantResponse.class)
                .isEqualTo(new PlantResponse(plantId, "Vera", null, null, null, null, null, null));
    }

    @Test
    void create_returnsNotFoundForSomeoneElsesPlanter() {
        authenticateAsJane();
        when(plantService.create(any(), any())).thenThrow(new IllegalStateException("Planter not found"));

        restTestClient.post().uri("/v1/plants")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new CreatePlantRequest("Vera", null, null, null, UUID.randomUUID(), null, null))
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    void create_rejectsBlankName() {
        authenticateAsJane();

        expectBadRequest("{\"name\": \"   \"}");
        verify(plantService, never()).create(any(), any());
    }

    @Test
    void create_rejectsNameLongerThan255Characters() {
        authenticateAsJane();

        expectBadRequest("{\"name\": \"" + "a".repeat(256) + "\"}");
    }

    @Test
    void create_rejectsUnknownLight() {
        authenticateAsJane();

        expectBadRequest("{\"name\": \"Vera\", \"light\": \"disco\"}");
    }

    @Test
    void create_rejectsWateringOutside1To365Days() {
        authenticateAsJane();

        expectBadRequest("{\"name\": \"Vera\", \"wateringEveryDays\": 0}");
        expectBadRequest("{\"name\": \"Vera\", \"wateringEveryDays\": 366}");
    }

    @Test
    void create_rejectsNotesLongerThan1000Characters() {
        authenticateAsJane();

        expectBadRequest("{\"name\": \"Vera\", \"notes\": \"" + "a".repeat(1001) + "\"}");
    }

    @Test
    void create_rejectsPhotoKeyLongerThan512Characters() {
        authenticateAsJane();

        expectBadRequest("{\"name\": \"Vera\", \"photoKey\": \"" + "a".repeat(513) + "\"}");
    }

    @Test
    void create_rejectsRequestsWithoutAToken() {
        restTestClient.post().uri("/v1/plants")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new CreatePlantRequest("Vera", null, null, null, null, null, null))
                .exchange()
                .expectStatus().isUnauthorized();
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
