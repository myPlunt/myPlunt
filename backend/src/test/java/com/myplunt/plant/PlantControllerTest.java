package com.myplunt.plant;

import com.myplunt.auth.JwtService;
import com.myplunt.config.SecurityConfig;
import com.myplunt.plant.dto.AddPlantPhotoRequest;
import com.myplunt.plant.dto.CreatePlantRequest;
import com.myplunt.plant.dto.PlantDetailsResponse;
import com.myplunt.plant.dto.PlantPhotoResponse;
import com.myplunt.plant.dto.PlantResponse;
import com.myplunt.plant.dto.UpdatePlantPhotoRequest;
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
        CreatePlantRequest request = new CreatePlantRequest("Vera", "bright_indirect", 7, "Found at a flea market", null, null, null, null);
        when(plantService.create(eq(ownerId), eq(request)))
                .thenReturn(new PlantResponse(plantId, "Vera", "bright_indirect", 7, "Found at a flea market", null, null, null));

        // Raw JSON without shareToFeed, as older apps send it: leaving it out must still work.
        restTestClient.post().uri("/v1/plants")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body("""
                        {"name": "Vera", "light": "bright_indirect", "wateringEveryDays": 7, "notes": "Found at a flea market"}
                        """)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(PlantResponse.class)
                .isEqualTo(new PlantResponse(plantId, "Vera", "bright_indirect", 7, "Found at a flea market", null, null, null));
    }

    @Test
    void create_returnsNotFoundForSomeoneElsesPlanter() {
        authenticateAsJane();
        when(plantService.create(any(), any())).thenThrow(new IllegalStateException("Planter not found"));

        restTestClient.post().uri("/v1/plants")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new CreatePlantRequest("Vera", null, null, null, UUID.randomUUID(), null, null, false))
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
    void create_rejectsRequestsWithoutAToken() {
        restTestClient.post().uri("/v1/plants")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new CreatePlantRequest("Vera", null, null, null, null, null, null, false))
                .exchange()
                .expectStatus().isUnauthorized();
    }

    private PlantDetailsResponse veraDetails(String name) {
        Instant wateredAt = Instant.parse("2026-10-07T08:00:00Z");
        return new PlantDetailsResponse(
                plantId, name, "bright_indirect", null, "Found at a flea market", null, null, null, null, 7,
                wateredAt, wateredAt.plusSeconds(7 * 24 * 3600), "https://storage.test/vera.jpg?signed");
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
    void delete_returnsNoContentAndDeletesThePlant() {
        UUID userId = authenticateAsJane();

        restTestClient.delete().uri("/v1/plants/{plantId}", plantId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isNoContent();

        verify(plantService).delete(userId, plantId);
    }

    @Test
    void water_returnsNoContentAndWatersThePlant() {
        UUID userId = authenticateAsJane();

        restTestClient.post().uri("/v1/plants/{plantId}/waterings", plantId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isNoContent();

        verify(plantService).water(userId, plantId, null, ZoneId.of("UTC"));
    }

    @Test
    void water_passesOnTheTimeOfAWateringSavedOffline() {
        UUID userId = authenticateAsJane();

        restTestClient.post().uri("/v1/plants/{plantId}/waterings?wateredAt=2026-10-22T08:00:00.123Z", plantId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isNoContent();

        verify(plantService).water(userId, plantId, Instant.parse("2026-10-22T08:00:00.123Z"), ZoneId.of("UTC"));
    }

    @Test
    void water_propagatesConflictFromService() {
        UUID userId = authenticateAsJane();
        doThrow(new ResponseStatusException(HttpStatus.CONFLICT, "This plant has passed away and can't be watered"))
                .when(plantService).water(userId, plantId, null, ZoneId.of("UTC"));

        restTestClient.post().uri("/v1/plants/{plantId}/waterings", plantId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.CONFLICT);
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
    void addPhoto_returnsTheCreatedPhoto() {
        UUID userId = authenticateAsJane();
        AddPlantPhotoRequest request = new AddPlantPhotoRequest("plants/u/growth.jpg", null, "First split leaf!", true);
        PlantPhotoResponse photo = new PlantPhotoResponse(
                UUID.randomUUID(), "https://storage.test/growth.jpg?signed", Instant.parse("2026-10-18T08:00:00Z"), null);
        when(plantService.addPhoto(userId, plantId, request)).thenReturn(photo);

        restTestClient.post().uri("/v1/plants/{plantId}/photos", plantId)
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .exchange()
                .expectStatus().isCreated()
                .expectBody(PlantPhotoResponse.class)
                .isEqualTo(photo);
    }

    @Test
    void updatePhoto_returnsTheUpdatedPhoto() {
        UUID userId = authenticateAsJane();
        UUID photoId = UUID.randomUUID();
        UpdatePlantPhotoRequest request = new UpdatePlantPhotoRequest(Instant.parse("2025-08-05T12:00:00Z"), "Repotted");
        PlantPhotoResponse photo = new PlantPhotoResponse(
                photoId, "https://storage.test/jun.jpg?signed", Instant.parse("2025-08-05T12:00:00Z"), "Repotted");
        when(plantService.updatePhoto(userId, plantId, photoId, request)).thenReturn(photo);

        restTestClient.put().uri("/v1/plants/{plantId}/photos/{photoId}", plantId, photoId)
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody(PlantPhotoResponse.class)
                .isEqualTo(photo);
    }

    @Test
    void deletePhoto_returnsNotFoundForAPhotoOfAnotherPlant() {
        UUID userId = authenticateAsJane();
        UUID photoId = UUID.randomUUID();
        doThrow(new IllegalStateException("Photo not found")).when(plantService).deletePhoto(userId, plantId, photoId);

        restTestClient.delete().uri("/v1/plants/{plantId}/photos/{photoId}", plantId, photoId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isNotFound();
    }

    @Test
    void addPhoto_rejectsAMissingPhotoKey() {
        authenticateAsJane();

        restTestClient.post().uri("/v1/plants/{plantId}/photos", plantId)
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"caption\": \"New leaf\"}")
                .exchange()
                .expectStatus().isBadRequest();
        verify(plantService, never()).addPhoto(any(), any(), any());
    }

}
