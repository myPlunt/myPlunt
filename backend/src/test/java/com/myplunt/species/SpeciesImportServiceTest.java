package com.myplunt.species;

import com.myplunt.species.dto.SpeciesImportResponse;
import com.myplunt.storage.StorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SpeciesImportServiceTest {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    @Mock
    private PerenualClient perenualClient;

    @Mock
    private SpeciesRepository speciesRepository;

    @Mock
    private StorageService storageService;

    private SpeciesImportService service() {
        return new SpeciesImportService(perenualClient, speciesRepository, storageService);
    }

    private static JsonNode json(String text) {
        return JSON.readTree(text);
    }

    @Test
    void toSpecies_mapsWateringRangeSunlightAndOrigin() {
        Species species = SpeciesImportService.toSpecies("Acer palmatum", json("""
                {"common_name": "japanese maple", "watering": "Average",
                 "watering_general_benchmark": {"value": "\\"7-10\\"", "unit": "days"},
                 "sunlight": ["full sun", "part shade"], "origin": ["Japan", "Korea"]}
                """));

        assertThat(species.getCommonName()).isEqualTo("Japanese maple");
        assertThat(species.getWateringFrequencyDays()).isEqualTo(7);
        assertThat(species.getSunlightNeeds()).isEqualTo("Full sun, part shade");
        assertThat(species.getRegion()).isEqualTo("Japan, Korea");
        assertThat(species.isApproved()).isFalse();
    }

    @Test
    void toSpecies_fallsBackOnWateringWordAndSkipsPaidOnlyData() {
        Species minimum = SpeciesImportService.toSpecies("Aloe vera", json("""
                {"common_name": "aloe", "watering": "Minimum", "watering_general_benchmark": {"value": null}}
                """));
        Species gated = SpeciesImportService.toSpecies("Rosa", json("""
                {"common_name": "rose", "watering": "Upgrade Plans To Premium/Supreme - https://perenual.com",
                 "watering_general_benchmark": "Upgrade Plans To Premium/Supreme - https://perenual.com"}
                """));

        assertThat(minimum.getWateringFrequencyDays()).isEqualTo(14);
        assertThat(minimum.getRegion()).isNull();
        assertThat(gated).isNull();
    }

    @Test
    void toSpecies_keepsALongOriginListWithinTheColumn() {
        String countries = String.join(",", java.util.Collections.nCopies(40, "\"Bosnia and Herzegovina\""));
        Species species = SpeciesImportService.toSpecies("Abies alba", json(
                "{\"common_name\": \"fir\", \"watering\": \"Average\", \"origin\": [" + countries + "]}"));

        assertThat(species.getRegion()).hasSizeLessThanOrEqualTo(255).endsWith("Herzegovina");
    }

    @Test
    void importSpecies_stopsAtTheCountAndStaysOnThePageItStoppedIn() {
        when(perenualClient.isEnabled()).thenReturn(true);
        when(perenualClient.list(1)).thenReturn(new PerenualClient.Page(List.of(
                new PerenualClient.Item(1, List.of("Monstera deliciosa")),
                new PerenualClient.Item(2, List.of("Aloe vera")),
                new PerenualClient.Item(3, List.of("Ficus lyrata"))), 5));
        when(speciesRepository.existsByScientificNameIgnoreCase("Monstera deliciosa")).thenReturn(true);
        when(perenualClient.details(2)).thenReturn(json("""
                {"common_name": "aloe", "watering": "Minimum", "default_image": {"regular_url": "https://img.test/aloe.jpg"}}
                """));
        UUID aloeId = UUID.randomUUID();
        when(speciesRepository.save(any())).thenAnswer(call -> {
            Species saved = call.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", aloeId);
            return saved;
        });
        byte[] picture = {1, 2, 3};
        when(perenualClient.image("https://img.test/aloe.jpg"))
                .thenReturn(ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(picture));
        when(storageService.putSpeciesImage(aloeId, picture, "image/jpeg")).thenReturn("species/aloe/perenual.jpg");

        SpeciesImportResponse result = service().importSpecies(1, 1);

        verify(perenualClient, never()).details(1);
        verify(perenualClient, never()).details(3);
        ArgumentCaptor<Species> saved = ArgumentCaptor.forClass(Species.class);
        verify(speciesRepository, org.mockito.Mockito.atLeastOnce()).save(saved.capture());
        assertThat(saved.getValue().getScientificName()).isEqualTo("Aloe vera");
        assertThat(saved.getValue().getImageKey()).isEqualTo("species/aloe/perenual.jpg");
        assertThat(result).isEqualTo(new SpeciesImportResponse(1, 1, 1, false));
    }

    @Test
    void importSpecies_stopsAtTheDailyLimitAndOffersTheSamePageAgain() {
        when(perenualClient.isEnabled()).thenReturn(true);
        when(perenualClient.list(3)).thenReturn(new PerenualClient.Page(List.of(
                new PerenualClient.Item(7, List.of("Aloe vera")),
                new PerenualClient.Item(8, List.of("Ficus lyrata"))), 5));
        when(perenualClient.details(anyInt())).thenThrow(HttpClientErrorException.create(
                HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", null, null, null));

        SpeciesImportResponse result = service().importSpecies(10, 3);

        verify(perenualClient, never()).details(8);
        verify(speciesRepository, never()).save(any());
        assertThat(result).isEqualTo(new SpeciesImportResponse(0, 0, 3, true));
    }

    @Test
    void importSpecies_movesOnToTheNextPageWhenOneHasNothingNew() {
        when(perenualClient.isEnabled()).thenReturn(true);
        when(perenualClient.list(1)).thenReturn(new PerenualClient.Page(List.of(
                new PerenualClient.Item(1, List.of("Monstera deliciosa"))), 5));
        when(perenualClient.list(2)).thenReturn(new PerenualClient.Page(List.of(
                new PerenualClient.Item(31, List.of("Aloe vera"))), 5));
        when(speciesRepository.existsByScientificNameIgnoreCase("Monstera deliciosa")).thenReturn(true);
        when(perenualClient.details(31)).thenReturn(json("""
                {"common_name": "aloe", "watering": "Minimum"}
                """));
        when(speciesRepository.save(any())).thenAnswer(call -> call.getArgument(0));

        SpeciesImportResponse result = service().importSpecies(1, 1);

        assertThat(result).isEqualTo(new SpeciesImportResponse(1, 1, 3, false));
    }
}
