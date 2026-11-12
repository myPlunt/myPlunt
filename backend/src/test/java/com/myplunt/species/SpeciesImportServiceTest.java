package com.myplunt.species;

import com.myplunt.region.RegionRepository;
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
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SpeciesImportServiceTest {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    @Mock
    private TrefleClient trefleClient;

    @Mock
    private SpeciesRepository speciesRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private RegionRepository regionRepository;

    private SpeciesImportService service() {
        return new SpeciesImportService(trefleClient, speciesRepository, storageService, regionRepository);
    }

    private static JsonNode json(String text) {
        return JSON.readTree(text);
    }

    private static TrefleClient.Item item(int id, String commonName, String scientificName, String genus) {
        return new TrefleClient.Item(id, commonName, scientificName, genus, null);
    }

    private static TrefleClient.Page page(TrefleClient.Item... items) {
        return new TrefleClient.Page(List.of(items), new TrefleClient.Meta(100));
    }

    @Test
    void toSpecies_mapsNameRegionAndLightAndLeavesWateringForTheAdmin() {
        // Monstera deliciosa's real Trefle distribution, with a light value added.
        JsonNode details = json("""
                {"growth": {"light": 5}, "specifications": {"growth_habit": "Vine, Forb/herb"},
                 "distribution": {"native": ["Guatemala", "Mexico Gulf", "Mexico Southeast", "Mexico Southwest"]}}
                """);
        Species species = SpeciesImportService.toSpecies(item(1, "fruit-salad-plant", "Monstera deliciosa", "Monstera"), details);

        assertThat(species.getCommonName()).isEqualTo("Fruit-salad-plant");
        assertThat(SpeciesImportService.regionsOf(details)).containsExactly("Central America", "Canada, USA and Mexico");
        assertThat(species.getSunlightNeeds()).isEqualTo("Part shade");
        assertThat(species.getWateringFrequencyDays()).isNull();
        assertThat(species.isApproved()).isFalse();
    }

    @Test
    void toSpecies_skipsTreesAndGrasses() {
        assertThat(SpeciesImportService.toSpecies(item(1, "oak", "Quercus robur", "Quercus"),
                json("{\"specifications\": {\"ligneous_type\": \"tree\"}}"))).isNull();
        assertThat(SpeciesImportService.toSpecies(item(2, "barnyard grass", "Dactylis glomerata", "Dactylis"),
                json("{\"specifications\": {\"growth_habit\": \"Graminoid\"}}"))).isNull();
    }

    @Test
    void importSpecies_stopsAtTheCountSkipsTreeGeneraFreeAndCopiesThePicture() {
        when(trefleClient.isEnabled()).thenReturn(true);
        when(trefleClient.list(1)).thenReturn(page(
                item(1, "evergreen oak", "Quercus rotundifolia", "Quercus"),
                item(2, "Monstera", "Monstera deliciosa", "Monstera"),
                new TrefleClient.Item(3, "Aloe", "Aloe vera", "Aloe", "https://img.test/aloe.jpg"),
                item(4, "Fiddle-leaf fig", "Ficus lyrata", "Ficus")));
        when(speciesRepository.existsByScientificNameIgnoreCase("Monstera deliciosa")).thenReturn(true);
        when(trefleClient.details(3)).thenReturn(json("{}"));
        UUID aloeId = UUID.randomUUID();
        when(speciesRepository.save(any())).thenAnswer(call -> {
            Species saved = call.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", aloeId);
            return saved;
        });
        byte[] picture = {1, 2, 3};
        when(trefleClient.image("https://img.test/aloe.jpg"))
                .thenReturn(ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).body(picture));
        when(storageService.putSpeciesImage(aloeId, picture, "image/jpeg")).thenReturn("species/aloe/imported.jpg");

        SpeciesImportResponse result = service().importSpecies(1, 1);

        verify(trefleClient, never()).details(1);
        verify(trefleClient, never()).details(2);
        verify(trefleClient, never()).details(4);
        ArgumentCaptor<Species> saved = ArgumentCaptor.forClass(Species.class);
        verify(speciesRepository, atLeastOnce()).save(saved.capture());
        assertThat(saved.getValue().getScientificName()).isEqualTo("Aloe vera");
        assertThat(saved.getValue().getImageKey()).isEqualTo("species/aloe/imported.jpg");
        assertThat(result).isEqualTo(new SpeciesImportResponse(1, 2, 1, false));
    }

    @Test
    void importSpecies_stopsAtTheRateLimitAndOffersTheSamePageAgain() {
        when(trefleClient.isEnabled()).thenReturn(true);
        when(trefleClient.list(3)).thenReturn(page(
                item(7, "Aloe", "Aloe vera", "Aloe"),
                item(8, "Fiddle-leaf fig", "Ficus lyrata", "Ficus")));
        when(trefleClient.details(anyInt())).thenThrow(HttpClientErrorException.create(
                HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", null, null, null));

        SpeciesImportResponse result = service().importSpecies(10, 3);

        verify(trefleClient, never()).details(8);
        verify(speciesRepository, never()).save(any());
        assertThat(result).isEqualTo(new SpeciesImportResponse(0, 0, 3, true));
    }

    @Test
    void importSpecies_movesOnToTheNextPageWhenOneHasNothingNew() {
        when(trefleClient.isEnabled()).thenReturn(true);
        when(trefleClient.list(1)).thenReturn(page(item(1, "Monstera", "Monstera deliciosa", "Monstera")));
        when(trefleClient.list(2)).thenReturn(page(item(31, "Aloe", "Aloe vera", "Aloe")));
        when(speciesRepository.existsByScientificNameIgnoreCase("Monstera deliciosa")).thenReturn(true);
        when(trefleClient.details(31)).thenReturn(json("{}"));
        when(speciesRepository.save(any())).thenAnswer(call -> call.getArgument(0));

        SpeciesImportResponse result = service().importSpecies(1, 1);

        assertThat(result).isEqualTo(new SpeciesImportResponse(1, 1, 3, false));
    }
}
