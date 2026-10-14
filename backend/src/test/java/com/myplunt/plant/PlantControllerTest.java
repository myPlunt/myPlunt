package com.myplunt.plant;

import com.myplunt.auth.JwtService;
import com.myplunt.config.SecurityConfig;
import com.myplunt.plant.dto.CreatePlantRequest;
import com.myplunt.plant.dto.PlantDetailsResponse;
import com.myplunt.plant.dto.PlantResponse;
import com.myplunt.plant.dto.UpdatePlantRequest;
import com.myplunt.plant.dto.WateringHistoryResponse;
import com.myplunt.plant.dto.WateringResponse;
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

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
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
    void create_rejectsNameShorterThan3Characters() {
        authenticateAsJane();

        expectBadRequest("{\"name\": \"Ab\"}");
        // Surrounding spaces don't count towards the length.
        expectBadRequest("{\"name\": \"  Ab  \"}");
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

    private PlantDetailsResponse veraDetails(String name) {
        Instant wateredAt = Instant.parse("2026-10-07T08:00:00Z");
        return new PlantDetailsResponse(
                plantId, name, "bright_indirect", null, "Found at a flea market", null, null, null, null, 7,
                wateredAt, wateredAt.plusSeconds(7 * 24 * 3600), "https://storage.test/vera.jpg?signed");
    }

    private void expectBadUpdate(String body) {
        restTestClient.put().uri("/v1/plants/{plantId}", plantId)
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void get_returnsTheSignedInUsersPlant() {
        UUID userId = authenticateAsJane();
        when(plantService.getDetails(userId, plantId)).thenReturn(veraDetails("Vera"));

        restTestClient.get().uri("/v1/plants/{plantId}", plantId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isOk()
                .expectBody(PlantDetailsResponse.class)
                .isEqualTo(veraDetails("Vera"));
    }

    @Test
    void get_returnsNotFoundWhenThePlantIsNotTheUsers() {
        UUID userId = authenticateAsJane();
        when(plantService.getDetails(userId, plantId)).thenThrow(new IllegalStateException("Plant not found"));

        restTestClient.get().uri("/v1/plants/{plantId}", plantId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    void get_rejectsAMalformedPlantId() {
        authenticateAsJane();

        restTestClient.get().uri("/v1/plants/not-a-uuid")
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void get_rejectsRequestsWithoutAToken() {
        restTestClient.get().uri("/v1/plants/{plantId}", plantId)
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    void update_returnsTheUpdatedPlant() {
        UUID userId = authenticateAsJane();
        UpdatePlantRequest request = new UpdatePlantRequest("Vera II", "bright_indirect", null, "Found at a flea market", null, null, null);
        when(plantService.update(userId, plantId, request)).thenReturn(veraDetails("Vera II"));

        restTestClient.put().uri("/v1/plants/{plantId}", plantId)
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody(PlantDetailsResponse.class)
                .isEqualTo(veraDetails("Vera II"));
    }

    @Test
    void update_stripsSurroundingWhitespaceFromName() {
        UUID userId = authenticateAsJane();
        when(plantService.update(userId, plantId, new UpdatePlantRequest("Vera", null, null, null, null, null, null)))
                .thenReturn(veraDetails("Vera"));

        restTestClient.put().uri("/v1/plants/{plantId}", plantId)
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"name\": \"  Vera  \"}")
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    void update_rejectsBlankName() {
        authenticateAsJane();

        expectBadUpdate("{\"name\": \"   \"}");
        verify(plantService, never()).update(any(), any(), any());
    }

    @Test
    void update_rejectsNameShorterThan3Characters() {
        authenticateAsJane();

        expectBadUpdate("{\"name\": \"Ab\"}");
        expectBadUpdate("{\"name\": \"  Ab  \"}");
        verify(plantService, never()).update(any(), any(), any());
    }

    @Test
    void update_rejectsNameLongerThan255Characters() {
        authenticateAsJane();

        expectBadUpdate("{\"name\": \"" + "a".repeat(256) + "\"}");
    }

    @Test
    void update_rejectsUnknownLight() {
        authenticateAsJane();

        expectBadUpdate("{\"name\": \"Vera\", \"light\": \"disco\"}");
    }

    @Test
    void update_rejectsWateringOutside1To365Days() {
        authenticateAsJane();

        expectBadUpdate("{\"name\": \"Vera\", \"wateringEveryDays\": 0}");
        expectBadUpdate("{\"name\": \"Vera\", \"wateringEveryDays\": 366}");
    }

    @Test
    void update_rejectsNotesLongerThan1000Characters() {
        authenticateAsJane();

        expectBadUpdate("{\"name\": \"Vera\", \"notes\": \"" + "a".repeat(1001) + "\"}");
    }

    @Test
    void update_rejectsPhotoKeyLongerThan512Characters() {
        authenticateAsJane();

        expectBadUpdate("{\"name\": \"Vera\", \"photoKey\": \"" + "a".repeat(513) + "\"}");
    }

    @Test
    void update_returnsNotFoundWhenThePlantIsNotTheUsers() {
        UUID userId = authenticateAsJane();
        when(plantService.update(eq(userId), eq(plantId), any())).thenThrow(new IllegalStateException("Plant not found"));

        restTestClient.put().uri("/v1/plants/{plantId}", plantId)
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new UpdatePlantRequest("Vera", null, null, null, null, null, null))
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    void update_propagatesConflictFromService() {
        UUID userId = authenticateAsJane();
        when(plantService.update(eq(userId), eq(plantId), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "This plant has passed away and can't be edited"));

        restTestClient.put().uri("/v1/plants/{plantId}", plantId)
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new UpdatePlantRequest("Vera", null, null, null, null, null, null))
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void update_rejectsRequestsWithoutAToken() {
        restTestClient.put().uri("/v1/plants/{plantId}", plantId)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new UpdatePlantRequest("Vera", null, null, null, null, null, null))
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    void delete_returnsNoContentAndDeletesThePlant() {
        UUID userId = authenticateAsJane();

        restTestClient.delete().uri("/v1/plants/{plantId}", plantId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isNoContent();

        verify(plantService).delete(userId, plantId);
    }

    @Test
    void delete_returnsNotFoundWhenThePlantIsNotTheUsers() {
        UUID userId = authenticateAsJane();
        doThrow(new IllegalStateException("Plant not found")).when(plantService).delete(userId, plantId);

        restTestClient.delete().uri("/v1/plants/{plantId}", plantId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    void delete_rejectsAMalformedPlantId() {
        authenticateAsJane();

        restTestClient.delete().uri("/v1/plants/not-a-uuid")
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void delete_rejectsRequestsWithoutAToken() {
        restTestClient.delete().uri("/v1/plants/{plantId}", plantId)
                .exchange()
                .expectStatus().isUnauthorized();

        verify(plantService, never()).delete(any(), any());
    }

    @Test
    void water_returnsNoContentAndWatersThePlant() {
        UUID userId = authenticateAsJane();

        restTestClient.post().uri("/v1/plants/{plantId}/waterings", plantId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isNoContent();

        verify(plantService).water(userId, plantId, ZoneId.of("UTC"));
    }

    @Test
    void water_passesTheAppsTimeZoneToTheService() {
        UUID userId = authenticateAsJane();

        restTestClient.post().uri("/v1/plants/{plantId}/waterings?zone=Europe/Amsterdam", plantId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isNoContent();

        verify(plantService).water(userId, plantId, ZoneId.of("Europe/Amsterdam"));
    }

    @Test
    void water_returnsNotFoundWhenThePlantIsNotTheUsers() {
        UUID userId = authenticateAsJane();
        doThrow(new IllegalStateException("Plant not found")).when(plantService).water(userId, plantId, ZoneId.of("UTC"));

        restTestClient.post().uri("/v1/plants/{plantId}/waterings", plantId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    void water_propagatesConflictFromService() {
        UUID userId = authenticateAsJane();
        doThrow(new ResponseStatusException(HttpStatus.CONFLICT, "This plant has passed away and can't be watered"))
                .when(plantService).water(userId, plantId, ZoneId.of("UTC"));

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

    @Test
    void wateringHistory_returnsThePlantsWateringsCountedInTheUsersTimeZone() {
        UUID userId = authenticateAsJane();
        WateringHistoryResponse history = new WateringHistoryResponse(
                "Vera", 7, 1, 2, 50, false,
                List.of(new WateringResponse(UUID.randomUUID(), Instant.parse("2026-10-07T08:00:00Z"), 0)));
        when(plantService.getWateringHistory(userId, plantId, ZoneId.of("Europe/Amsterdam"))).thenReturn(history);

        restTestClient.get().uri("/v1/plants/{plantId}/waterings?zone=Europe/Amsterdam", plantId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isOk()
                .expectBody(WateringHistoryResponse.class)
                .isEqualTo(history);
    }

    @Test
    void wateringHistory_countsDaysInUtcWhenTheAppSendsNoTimeZone() {
        UUID userId = authenticateAsJane();
        when(plantService.getWateringHistory(userId, plantId, ZoneId.of("UTC")))
                .thenReturn(new WateringHistoryResponse("Vera", 7, 0, 0, null, false, List.of()));

        restTestClient.get().uri("/v1/plants/{plantId}/waterings", plantId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isOk();

        verify(plantService).getWateringHistory(userId, plantId, ZoneId.of("UTC"));
    }

    @Test
    void wateringHistory_rejectsAnUnknownTimeZone() {
        authenticateAsJane();

        restTestClient.get().uri("/v1/plants/{plantId}/waterings?zone=Mars/Olympus", plantId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void wateringHistory_returnsNotFoundWhenThePlantIsNotTheUsers() {
        UUID userId = authenticateAsJane();
        when(plantService.getWateringHistory(userId, plantId, ZoneId.of("UTC")))
                .thenThrow(new IllegalStateException("Plant not found"));

        restTestClient.get().uri("/v1/plants/{plantId}/waterings", plantId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    void wateringHistory_rejectsAMalformedPlantId() {
        authenticateAsJane();

        restTestClient.get().uri("/v1/plants/not-a-uuid/waterings")
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void wateringHistory_rejectsRequestsWithoutAToken() {
        restTestClient.get().uri("/v1/plants/{plantId}/waterings", plantId)
                .exchange()
                .expectStatus().isUnauthorized();
    }
}
