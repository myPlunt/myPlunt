package com.myplunt.plant;

import com.myplunt.garden.Planter;
import com.myplunt.garden.PlanterRepository;
import com.myplunt.plant.dto.CreatePlantRequest;
import com.myplunt.plant.dto.PlantDetailsResponse;
import com.myplunt.plant.dto.PlantResponse;
import com.myplunt.plant.dto.UpdatePlantRequest;
import com.myplunt.plant.dto.WateringHistoryResponse;
import com.myplunt.plant.dto.WateringLogResponse;
import com.myplunt.plant.dto.WateringResponse;
import com.myplunt.plant.dto.WateringStreakResponse;
import com.myplunt.species.Species;
import com.myplunt.species.SpeciesRepository;
import com.myplunt.storage.StorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.entry;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlantServiceTest {

    @Mock
    private PlantRepository plantRepository;

    @Mock
    private WateringLogRepository wateringLogRepository;

    @Mock
    private PlanterRepository planterRepository;

    @Mock
    private SpeciesRepository speciesRepository;

    @Mock
    private PlantPhotoRepository plantPhotoRepository;

    @Mock
    private StorageService storageService;

    private final UUID userId = UUID.randomUUID();
    private final UUID plantId = UUID.randomUUID();

    private PlantService plantService() {
        return new PlantService(
                plantRepository, wateringLogRepository, planterRepository, speciesRepository, plantPhotoRepository, storageService);
    }

    // Gives the saved plant an id, as the database would.
    private void saveAssignsId() {
        when(plantRepository.save(any())).thenAnswer(invocation -> {
            Plant plant = invocation.getArgument(0);
            ReflectionTestUtils.setField(plant, "id", plantId);
            return plant;
        });
    }

    @Test
    void create_savesThePlantForTheOwnerAndReturnsIt() {
        saveAssignsId();

        PlantResponse response = plantService().create(
                userId, new CreatePlantRequest("Vera", "bright_indirect", 7, "Found at a flea market", null, null, null));

        assertThat(response).isEqualTo(new PlantResponse(plantId, "Vera", "bright_indirect", 7, "Found at a flea market", null, null, null));
        ArgumentCaptor<Plant> saved = ArgumentCaptor.forClass(Plant.class);
        verify(plantRepository).save(saved.capture());
        assertThat(saved.getValue().getOwnerId()).isEqualTo(userId);
        assertThat(saved.getValue().isAlive()).isTrue();
    }

    @Test
    void create_putsThePlantInTheOwnersPlanter() {
        UUID planterId = UUID.randomUUID();
        when(planterRepository.existsByIdAndOwnerId(planterId, userId)).thenReturn(true);
        saveAssignsId();

        PlantResponse response = plantService().create(userId, new CreatePlantRequest("Vera", null, null, null, planterId, null, null));

        assertThat(response.planterId()).isEqualTo(planterId);
    }

    @Test
    void create_throwsNotFoundForAPlanterTheUserDoesNotOwn() {
        UUID planterId = UUID.randomUUID();
        when(planterRepository.existsByIdAndOwnerId(planterId, userId)).thenReturn(false);

        assertThatThrownBy(() -> plantService().create(userId, new CreatePlantRequest("Vera", null, null, null, planterId, null, null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Planter not found");
        verify(plantRepository, never()).save(any());
    }

    @Test
    void create_linksTheChosenApprovedSpecies() {
        UUID speciesId = UUID.randomUUID();
        Species monstera = new Species("Monstera", 7);
        ReflectionTestUtils.setField(monstera, "id", speciesId);
        when(speciesRepository.findByIdAndApprovedTrue(speciesId)).thenReturn(Optional.of(monstera));
        saveAssignsId();

        PlantResponse response =
                plantService().create(userId, new CreatePlantRequest("Vera", null, null, null, null, speciesId, null));

        assertThat(response.speciesId()).isEqualTo(speciesId);
        ArgumentCaptor<Plant> saved = ArgumentCaptor.forClass(Plant.class);
        verify(plantRepository).save(saved.capture());
        assertThat(saved.getValue().getSpecies()).isSameAs(monstera);
        verify(speciesRepository).markDiscovered(userId, speciesId);
    }

    @Test
    void create_throwsNotFoundForAnUnknownOrUnapprovedSpecies() {
        UUID speciesId = UUID.randomUUID();
        when(speciesRepository.findByIdAndApprovedTrue(speciesId)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                        plantService().create(userId, new CreatePlantRequest("Vera", null, null, null, null, speciesId, null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Species not found");
        verify(plantRepository, never()).save(any());
    }

    @Test
    void create_confirmsTheUploadedPhotoAndSavesItForThePlant() {
        saveAssignsId();
        String key = "plants/" + userId + "/photo.jpg";
        when(storageService.createReadUrl(key)).thenReturn("https://storage.test/photo.jpg?signed");

        PlantResponse response =
                plantService().create(userId, new CreatePlantRequest("Vera", null, null, null, null, null, key));

        assertThat(response.photoUrl()).isEqualTo("https://storage.test/photo.jpg?signed");
        verify(storageService).confirmUpload(userId, key);
        ArgumentCaptor<PlantPhoto> photo = ArgumentCaptor.forClass(PlantPhoto.class);
        verify(plantPhotoRepository).save(photo.capture());
        assertThat(photo.getValue().getPlant().getId()).isEqualTo(plantId);
        assertThat(photo.getValue().getUploadedBy()).isEqualTo(userId);
        assertThat(photo.getValue().getPhotoKey()).isEqualTo(key);
    }

    @Test
    void create_savesNothingWhenThePhotoCannotBeConfirmed() {
        String key = "plants/" + UUID.randomUUID() + "/photo.jpg";
        doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Upload not found for key: " + key))
                .when(storageService).confirmUpload(userId, key);

        assertThatThrownBy(() ->
                        plantService().create(userId, new CreatePlantRequest("Vera", null, null, null, null, null, key)))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.NOT_FOUND);
        verify(plantRepository, never()).save(any());
        verify(plantPhotoRepository, never()).save(any());
    }

    @Test
    void create_keepsOptionalFieldsEmptyWhenLeftOut() {
        saveAssignsId();

        PlantResponse response = plantService().create(userId, new CreatePlantRequest("Vera", null, null, null, null, null, null));

        assertThat(response).isEqualTo(new PlantResponse(plantId, "Vera", null, null, null, null, null, null));
        verify(storageService, never()).confirmUpload(any(), any());
        verify(plantPhotoRepository, never()).save(any());
    }

    @Test
    void create_trimsNotesAndStoresBlankNotesAsNull() {
        saveAssignsId();

        assertThat(plantService().create(userId, new CreatePlantRequest("Vera", null, null, "  Repotted  ", null, null, null)).notes())
                .isEqualTo("Repotted");
        assertThat(plantService().create(userId, new CreatePlantRequest("Vera", null, null, "   ", null, null, null)).notes())
                .isNull();
    }

    // A saved plant of the user's, as findByIdAndOwnerId returns it.
    private Plant ownPlant(String name) {
        Plant plant = new Plant(userId, name);
        ReflectionTestUtils.setField(plant, "id", plantId);
        ReflectionTestUtils.setField(plant, "createdAt", Instant.parse("2026-09-01T10:00:00Z"));
        when(plantRepository.findByIdAndOwnerId(plantId, userId)).thenReturn(Optional.of(plant));
        return plant;
    }

    private Species approvedSpecies(String name, Integer wateringFrequencyDays) {
        Species species = new Species(name, wateringFrequencyDays);
        ReflectionTestUtils.setField(species, "id", UUID.randomUUID());
        when(speciesRepository.findByIdAndApprovedTrue(species.getId())).thenReturn(Optional.of(species));
        return species;
    }

    @Test
    void getDetails_returnsThePlantWithItsPlanterSpeciesWateringAndPhoto() {
        Plant vera = ownPlant("Vera");
        Planter balcony = new Planter(userId, "Balcony");
        ReflectionTestUtils.setField(balcony, "id", UUID.randomUUID());
        Species monstera = new Species("Monstera", 7);
        ReflectionTestUtils.setField(monstera, "id", UUID.randomUUID());
        vera.setPlanterId(balcony.getId());
        vera.setSpecies(monstera);
        vera.setLight("bright_indirect");
        vera.setNotes("Found at a flea market");
        Instant wateredAt = Instant.parse("2026-10-07T08:00:00Z");
        when(planterRepository.findByIdAndOwnerId(balcony.getId(), userId)).thenReturn(Optional.of(balcony));
        when(wateringLogRepository.findLastWateredAt(List.of(plantId))).thenReturn(List.of(new LastWatering(plantId, wateredAt)));
        when(plantPhotoRepository.findLatestPhotos(List.of(plantId)))
                .thenReturn(List.of(new LatestPhoto(plantId, "plants/vera.jpg")));
        when(storageService.createReadUrl("plants/vera.jpg")).thenReturn("https://storage.test/vera.jpg?signed");

        PlantDetailsResponse details = plantService().getDetails(userId, plantId);

        assertThat(details).isEqualTo(new PlantDetailsResponse(
                plantId,
                "Vera",
                "bright_indirect",
                null,
                "Found at a flea market",
                balcony.getId(),
                "Balcony",
                monstera.getId(),
                "Monstera",
                7,
                wateredAt,
                wateredAt.plus(Duration.ofDays(7)),
                "https://storage.test/vera.jpg?signed"));
    }

    @Test
    void getDetails_leavesOutWhatThePlantDoesNotHave() {
        ownPlant("Vera");

        PlantDetailsResponse details = plantService().getDetails(userId, plantId);

        // No frequency from the owner or a species, so the default schedule, counted from the day it was added.
        assertThat(details).isEqualTo(new PlantDetailsResponse(
                plantId, "Vera", null, null, null, null, null, null, null,
                WateringSchedule.DEFAULT_FREQUENCY_DAYS, null,
                Instant.parse("2026-09-01T10:00:00Z").plus(Duration.ofDays(WateringSchedule.DEFAULT_FREQUENCY_DAYS)), null));
        verify(planterRepository, never()).findByIdAndOwnerId(any(), any());
    }

    @Test
    void getDetails_prefersTheOwnersWateringFrequencyOverTheSpecies() {
        Plant vera = ownPlant("Vera");
        vera.setSpecies(new Species("Monstera", 7));
        vera.setWateringEveryDays(3);

        PlantDetailsResponse details = plantService().getDetails(userId, plantId);

        assertThat(details.wateringEveryDays()).isEqualTo(3);
        assertThat(details.wateringFrequencyDays()).isEqualTo(3);
        // Never watered, so counted from the day it was added.
        assertThat(details.nextWateringAt()).isEqualTo(vera.getCreatedAt().plus(Duration.ofDays(3)));
    }

    @Test
    void getDetails_usesTheSpeciesFrequencyWhenTheOwnerSetNone() {
        Plant vera = ownPlant("Vera");
        vera.setSpecies(new Species("Pothos", 10));

        PlantDetailsResponse details = plantService().getDetails(userId, plantId);

        assertThat(details.wateringEveryDays()).isNull();
        assertThat(details.wateringFrequencyDays()).isEqualTo(10);
    }

    @Test
    void getDetails_usesTheDefaultScheduleForASpeciesWithoutAFrequency() {
        Plant vera = ownPlant("Vera");
        vera.setSpecies(new Species("Sweet basil", null));

        PlantDetailsResponse details = plantService().getDetails(userId, plantId);

        assertThat(details.wateringFrequencyDays()).isEqualTo(WateringSchedule.DEFAULT_FREQUENCY_DAYS);
    }

    @Test
    void getDetails_throwsNotFoundForAPlantTheUserDoesNotOwn() {
        when(plantRepository.findByIdAndOwnerId(plantId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> plantService().getDetails(userId, plantId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Plant not found");
    }

    @Test
    void update_replacesTheEditableFieldsAndReturnsTheDetails() {
        Plant vera = ownPlant("Vera");
        vera.setLight("full_sun");
        vera.setWateringEveryDays(4);
        vera.setNotes("Old notes");
        UUID planterId = UUID.randomUUID();
        when(planterRepository.existsByIdAndOwnerId(planterId, userId)).thenReturn(true);
        Species pothos = approvedSpecies("Pothos", 10);
        when(plantRepository.save(vera)).thenReturn(vera);

        PlantDetailsResponse details = plantService().update(
                userId, plantId, new UpdatePlantRequest("Vera II", "low_light", 9, "  Repotted  ", planterId, pothos.getId(), null));

        assertThat(vera.getName()).isEqualTo("Vera II");
        assertThat(vera.getLight()).isEqualTo("low_light");
        assertThat(vera.getWateringEveryDays()).isEqualTo(9);
        assertThat(vera.getNotes()).isEqualTo("Repotted");
        assertThat(vera.getPlanterId()).isEqualTo(planterId);
        assertThat(vera.getSpecies()).isSameAs(pothos);
        assertThat(details.name()).isEqualTo("Vera II");
        assertThat(details.speciesName()).isEqualTo("Pothos");
        assertThat(details.wateringFrequencyDays()).isEqualTo(9);
        verify(speciesRepository).markDiscovered(userId, pothos.getId());
    }

    @Test
    void update_clearsTheFieldsSentAsNullButKeepsThePhoto() {
        Plant vera = ownPlant("Vera");
        vera.setPlanterId(UUID.randomUUID());
        vera.setSpecies(new Species("Monstera", 7));
        vera.setLight("full_sun");
        vera.setWateringEveryDays(4);
        vera.setNotes("Old notes");
        when(plantRepository.save(vera)).thenReturn(vera);

        plantService().update(userId, plantId, new UpdatePlantRequest("Vera", null, null, "   ", null, null, null));

        assertThat(vera.getPlanterId()).isNull();
        assertThat(vera.getSpecies()).isNull();
        assertThat(vera.getLight()).isNull();
        assertThat(vera.getWateringEveryDays()).isNull();
        assertThat(vera.getNotes()).isNull();
        verify(storageService, never()).confirmUpload(any(), any());
        verify(plantPhotoRepository, never()).save(any());
    }

    @Test
    void update_confirmsANewPhotoAndMakesItThePlantsPhoto() {
        Plant vera = ownPlant("Vera");
        when(plantRepository.save(vera)).thenReturn(vera);
        String key = "plants/" + userId + "/new.jpg";

        plantService().update(userId, plantId, new UpdatePlantRequest("Vera", null, null, null, null, null, key));

        verify(storageService).confirmUpload(userId, key);
        ArgumentCaptor<PlantPhoto> photo = ArgumentCaptor.forClass(PlantPhoto.class);
        verify(plantPhotoRepository).save(photo.capture());
        assertThat(photo.getValue().getPlant()).isSameAs(vera);
        assertThat(photo.getValue().getPhotoKey()).isEqualTo(key);
    }

    @Test
    void update_throwsNotFoundForAPlantTheUserDoesNotOwn() {
        when(plantRepository.findByIdAndOwnerId(plantId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> plantService().update(
                        userId, plantId, new UpdatePlantRequest("Vera", null, null, null, null, null, null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Plant not found");
        verify(plantRepository, never()).save(any());
    }

    @Test
    void update_throwsNotFoundForAPlanterTheUserDoesNotOwn() {
        ownPlant("Vera");
        UUID planterId = UUID.randomUUID();
        when(planterRepository.existsByIdAndOwnerId(planterId, userId)).thenReturn(false);

        assertThatThrownBy(() -> plantService().update(
                        userId, plantId, new UpdatePlantRequest("Vera", null, null, null, planterId, null, null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Planter not found");
        verify(plantRepository, never()).save(any());
    }

    @Test
    void update_throwsNotFoundForAnUnknownOrUnapprovedSpecies() {
        ownPlant("Vera");
        UUID speciesId = UUID.randomUUID();
        when(speciesRepository.findByIdAndApprovedTrue(speciesId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> plantService().update(
                        userId, plantId, new UpdatePlantRequest("Vera", null, null, null, null, speciesId, null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Species not found");
        verify(plantRepository, never()).save(any());
    }

    @Test
    void update_changesNothingWhenTheNewPhotoCannotBeConfirmed() {
        Plant vera = ownPlant("Vera");
        String key = "plants/" + UUID.randomUUID() + "/photo.jpg";
        doThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Upload not found for key: " + key))
                .when(storageService).confirmUpload(userId, key);

        assertThatThrownBy(() -> plantService().update(
                        userId, plantId, new UpdatePlantRequest("Vera II", null, null, null, null, null, key)))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(vera.getName()).isEqualTo("Vera");
        verify(plantRepository, never()).save(any());
        verify(plantPhotoRepository, never()).save(any());
    }

    @Test
    void update_rejectsAPlantThatHasDied() {
        Plant vera = ownPlant("Vera");
        vera.setAlive(false);

        assertThatThrownBy(() -> plantService().update(
                        userId, plantId, new UpdatePlantRequest("Vera II", null, null, null, null, null, null)))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.CONFLICT);
        assertThat(vera.getName()).isEqualTo("Vera");
        verify(plantRepository, never()).save(any());
    }

    @Test
    void getLivingPlants_returnsTheOwnersLivingPlants() {
        Plant george = new Plant(userId, "George");
        when(plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(userId)).thenReturn(List.of(george));

        assertThat(plantService().getLivingPlants(userId)).containsExactly(george);
    }

    @Test
    void getLastWateredAt_mapsEachWateredPlantToItsLastWatering() {
        UUID neverWatered = UUID.randomUUID();
        Instant wateredAt = Instant.parse("2026-10-07T08:00:00Z");
        when(wateringLogRepository.findLastWateredAt(List.of(plantId, neverWatered)))
                .thenReturn(List.of(new LastWatering(plantId, wateredAt)));

        assertThat(plantService().getLastWateredAt(List.of(plantId, neverWatered)))
                .containsExactly(entry(plantId, wateredAt));
    }

    @Test
    void getLastWateredAt_skipsTheQueryWithoutPlants() {
        assertThat(plantService().getLastWateredAt(List.of())).isEmpty();
        verify(wateringLogRepository, never()).findLastWateredAt(any());
    }

    @Test
    void getPhotoUrls_mapsEachPlantWithAPhotoToALinkToIt() {
        UUID noPhoto = UUID.randomUUID();
        when(plantPhotoRepository.findLatestPhotos(List.of(plantId, noPhoto)))
                .thenReturn(List.of(new LatestPhoto(plantId, "plants/vera.jpg")));
        when(storageService.createReadUrl("plants/vera.jpg")).thenReturn("https://storage.test/vera.jpg?signed");

        assertThat(plantService().getPhotoUrls(List.of(plantId, noPhoto)))
                .containsExactly(entry(plantId, "https://storage.test/vera.jpg?signed"));
    }

    @Test
    void getPhotoUrls_keepsOneLinkWhenTwoPhotosShareTheNewestTime() {
        when(plantPhotoRepository.findLatestPhotos(List.of(plantId)))
                .thenReturn(List.of(new LatestPhoto(plantId, "plants/a.jpg"), new LatestPhoto(plantId, "plants/b.jpg")));
        when(storageService.createReadUrl(any())).thenAnswer(invocation -> "https://storage.test/" + invocation.getArgument(0));

        assertThat(plantService().getPhotoUrls(List.of(plantId))).containsOnlyKeys(plantId);
    }

    @Test
    void getPhotoUrls_skipsTheQueryWithoutPlants() {
        assertThat(plantService().getPhotoUrls(List.of())).isEmpty();
        verify(plantPhotoRepository, never()).findLatestPhotos(any());
    }

    @Test
    void water_logsAWateringByTheUserNow() {
        Plant george = new Plant(userId, "George");
        when(plantRepository.findByIdAndOwnerId(plantId, userId)).thenReturn(Optional.of(george));
        Instant before = Instant.now();

        plantService().water(userId, plantId);

        ArgumentCaptor<WateringLog> saved = ArgumentCaptor.forClass(WateringLog.class);
        verify(wateringLogRepository).save(saved.capture());
        assertThat(saved.getValue().getPlant()).isSameAs(george);
        assertThat(saved.getValue().getWateredBy()).isEqualTo(userId);
        assertThat(saved.getValue().getWateredAt()).isBetween(before, Instant.now());
    }

    @Test
    void water_throwsNotFoundForAPlantTheUserDoesNotOwn() {
        when(plantRepository.findByIdAndOwnerId(plantId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> plantService().water(userId, plantId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Plant not found");
        verify(wateringLogRepository, never()).save(any());
    }

    @Test
    void water_rejectsAPlantThatHasDied() {
        Plant george = new Plant(userId, "George");
        george.setAlive(false);
        when(plantRepository.findByIdAndOwnerId(plantId, userId)).thenReturn(Optional.of(george));

        assertThatThrownBy(() -> plantService().water(userId, plantId))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.CONFLICT);
        verify(wateringLogRepository, never()).save(any());
    }

    @Test
    void getWateringHistory_returnsEveryWateringNewestFirstMarkedOnTimeOrLate() {
        // Times relative to now, as the service reads the clock itself. On a 3-day schedule:
        // added 12 days ago, on time 10 days ago, 3 days late 4 days ago, on time 2 days ago.
        Plant vera = ownPlant("Vera");
        Instant now = Instant.now();
        ReflectionTestUtils.setField(vera, "createdAt", now.minus(Duration.ofDays(12)));
        vera.setWateringEveryDays(3);
        WateringLog first = watering(vera, now.minus(Duration.ofDays(10)));
        WateringLog late = watering(vera, now.minus(Duration.ofDays(4)));
        WateringLog latest = watering(vera, now.minus(Duration.ofDays(2)));
        when(wateringLogRepository.findByPlantIdOrderByWateredAtAsc(plantId)).thenReturn(List.of(first, late, latest));

        WateringHistoryResponse history = plantService().getWateringHistory(userId, plantId, ZoneOffset.UTC);

        assertThat(history).isEqualTo(new WateringHistoryResponse(
                "Vera", 3, 1, 1, 67, false,
                List.of(
                        new WateringResponse(latest.getId(), latest.getWateredAt(), 0),
                        new WateringResponse(late.getId(), late.getWateredAt(), 3),
                        new WateringResponse(first.getId(), first.getWateredAt(), 0))));
    }

    @Test
    void getWateringHistory_hasNoStreakBeforeTheFirstWatering() {
        ownPlant("Vera");

        WateringHistoryResponse history = plantService().getWateringHistory(userId, plantId, ZoneOffset.UTC);

        assertThat(history.wateringFrequencyDays()).isEqualTo(WateringSchedule.DEFAULT_FREQUENCY_DAYS);
        assertThat(history.currentStreak()).isZero();
        assertThat(history.onTimePercent()).isNull();
        assertThat(history.waterings()).isEmpty();
    }

    @Test
    void getWateringHistory_stillWorksForAPlantThatHasDied() {
        Plant vera = ownPlant("Vera");
        vera.setAlive(false);

        assertThat(plantService().getWateringHistory(userId, plantId, ZoneOffset.UTC).plantName()).isEqualTo("Vera");
    }

    @Test
    void getWateringHistory_throwsNotFoundForAPlantTheUserDoesNotOwn() {
        when(plantRepository.findByIdAndOwnerId(plantId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> plantService().getWateringHistory(userId, plantId, ZoneOffset.UTC))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Plant not found");
        verify(wateringLogRepository, never()).findByPlantIdOrderByWateredAtAsc(any());
    }

    @Test
    void getWateringStreaks_returnsEachPlantsCurrentStreakFromOneQuery() {
        Instant now = Instant.now();
        Plant george = plantAdded("George", now.minus(Duration.ofDays(5)));
        Plant pinky = plantAdded("Pinky", now.minus(Duration.ofDays(5)));
        Plant neverWatered = plantAdded("Monty", now.minus(Duration.ofDays(1)));
        when(wateringLogRepository.findByPlantIdInOrderByWateredAtAsc(
                List.of(george.getId(), pinky.getId(), neverWatered.getId())))
                .thenReturn(List.of(
                        watering(george, now.minus(Duration.ofDays(4))),
                        watering(pinky, now.minus(Duration.ofDays(4))),
                        watering(george, now.minus(Duration.ofDays(1)))));

        Map<UUID, Integer> streaks = plantService().getWateringStreaks(List.of(george, pinky, neverWatered), ZoneOffset.UTC);

        // Pinky was due again yesterday, so its streak is broken.
        assertThat(streaks).containsOnly(entry(george.getId(), 2), entry(pinky.getId(), 0), entry(neverWatered.getId(), 0));
    }

    @Test
    void getWateringStreaks_skipsTheQueryWithoutPlants() {
        assertThat(plantService().getWateringStreaks(List.of(), ZoneOffset.UTC)).isEmpty();
        verify(wateringLogRepository, never()).findByPlantIdInOrderByWateredAtAsc(any());
    }

    @Test
    void getWaterings_returnsTheOwnersWateringsInTheRange() {
        Instant from = Instant.parse("2026-10-01T00:00:00Z");
        Instant to = Instant.parse("2026-11-01T00:00:00Z");
        List<WateringLogResponse> waterings = List.of(
                new WateringLogResponse(UUID.randomUUID(), plantId, "Vera", Instant.parse("2026-10-07T08:00:00Z")));
        when(wateringLogRepository.findOwnersWaterings(userId, from, to)).thenReturn(waterings);

        assertThat(plantService().getWaterings(userId, from, to)).isEqualTo(waterings);
    }

    @Test
    void getWaterings_rejectsARangeThatEndsBeforeItStarts() {
        Instant from = Instant.parse("2026-10-01T00:00:00Z");

        assertThatThrownBy(() -> plantService().getWaterings(userId, from, from))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.BAD_REQUEST);
        verify(wateringLogRepository, never()).findOwnersWaterings(any(), any(), any());
    }

    @Test
    void getWaterings_rejectsARangeLongerThan62Days() {
        Instant from = Instant.parse("2026-01-01T00:00:00Z");

        assertThatThrownBy(() -> plantService().getWaterings(userId, from, from.plus(Duration.ofDays(63))))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.BAD_REQUEST);
        verify(wateringLogRepository, never()).findOwnersWaterings(any(), any(), any());
    }

    @Test
    void getWateringStreak_addsUpTheStreaksOfTheLivingPlants() {
        Instant now = Instant.now();
        Plant george = plantAdded("George", now.minus(Duration.ofDays(5)));
        Plant pinky = plantAdded("Pinky", now.minus(Duration.ofDays(3)));
        when(plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(userId)).thenReturn(List.of(george, pinky));
        when(wateringLogRepository.findByPlantIdInOrderByWateredAtAsc(List.of(george.getId(), pinky.getId())))
                .thenReturn(List.of(
                        watering(george, now.minus(Duration.ofDays(4))),
                        watering(pinky, now.minus(Duration.ofDays(2))),
                        watering(george, now.minus(Duration.ofDays(1)))));

        assertThat(plantService().getWateringStreak(userId, ZoneOffset.UTC)).isEqualTo(new WateringStreakResponse(3));
    }

    @Test
    void getWateringStreak_isZeroWithoutPlants() {
        when(plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(userId)).thenReturn(List.of());

        assertThat(plantService().getWateringStreak(userId, ZoneOffset.UTC)).isEqualTo(new WateringStreakResponse(0));
    }

    // A plant on a 3-day schedule, added at the given moment.
    private Plant plantAdded(String name, Instant addedAt) {
        Plant plant = new Plant(userId, name);
        ReflectionTestUtils.setField(plant, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(plant, "createdAt", addedAt);
        plant.setWateringEveryDays(3);
        return plant;
    }

    private static WateringLog watering(Plant plant, Instant wateredAt) {
        WateringLog watering = new WateringLog(plant, plant.getOwnerId(), wateredAt);
        ReflectionTestUtils.setField(watering, "id", UUID.randomUUID());
        return watering;
    }

    @Test
    void delete_removesThePlantAndThenItsPhotosFromStorage() {
        Plant george = new Plant(userId, "George");
        when(plantRepository.findByIdAndOwnerId(plantId, userId)).thenReturn(Optional.of(george));
        when(plantPhotoRepository.findPhotoKeysByPlantId(plantId)).thenReturn(List.of("plants/u/old.jpg", "plants/u/new.jpg"));

        plantService().delete(userId, plantId);

        InOrder order = inOrder(plantRepository, storageService);
        order.verify(plantRepository).delete(george);
        order.verify(plantRepository).flush();
        order.verify(storageService).deleteObject("plants/u/old.jpg");
        order.verify(storageService).deleteObject("plants/u/new.jpg");
    }

    @Test
    void delete_alsoRemovesAPlantThatHasDied() {
        Plant george = new Plant(userId, "George");
        george.setAlive(false);
        when(plantRepository.findByIdAndOwnerId(plantId, userId)).thenReturn(Optional.of(george));

        plantService().delete(userId, plantId);

        verify(plantRepository).delete(george);
    }

    @Test
    void delete_stillDeletesThePlantWhenAPhotoCannotBeRemovedFromStorage() {
        Plant george = new Plant(userId, "George");
        when(plantRepository.findByIdAndOwnerId(plantId, userId)).thenReturn(Optional.of(george));
        when(plantPhotoRepository.findPhotoKeysByPlantId(plantId)).thenReturn(List.of("plants/u/a.jpg", "plants/u/b.jpg"));
        doThrow(new RuntimeException("storage down")).when(storageService).deleteObject("plants/u/a.jpg");

        plantService().delete(userId, plantId);

        verify(plantRepository).delete(george);
        verify(storageService).deleteObject("plants/u/b.jpg");
    }

    @Test
    void delete_throwsNotFoundForAPlantTheUserDoesNotOwn() {
        when(plantRepository.findByIdAndOwnerId(plantId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> plantService().delete(userId, plantId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Plant not found");
        verify(plantRepository, never()).delete(any());
        verify(storageService, never()).deleteObject(any());
    }
}
