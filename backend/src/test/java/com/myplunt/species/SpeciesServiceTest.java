package com.myplunt.species;

import com.myplunt.species.dto.SpeciesResponse;
import com.myplunt.storage.StorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SpeciesServiceTest {

    @Mock
    private SpeciesRepository speciesRepository;

    @Mock
    private StorageService storageService;

    private Species species(String commonName, String scientificName) {
        Species species = new Species(commonName, 7);
        ReflectionTestUtils.setField(species, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(species, "scientificName", scientificName);
        return species;
    }

    @Test
    void getApprovedSpecies_mapsTheApprovedSpeciesInRepositoryOrder() {
        Species monstera = species("Monstera", "Monstera deliciosa");
        ReflectionTestUtils.setField(monstera, "region", "Central America");
        ReflectionTestUtils.setField(monstera, "sunlightNeeds", "Bright indirect");
        ReflectionTestUtils.setField(monstera, "common", true);
        when(speciesRepository.findByApprovedTrueOrderByCommonNameAsc()).thenReturn(List.of(monstera));

        List<SpeciesResponse> species = new SpeciesService(speciesRepository, storageService).getApprovedSpecies();

        assertThat(species).containsExactly(new SpeciesResponse(
                monstera.getId(), "Monstera", "Monstera deliciosa", 7, "Central America", "Bright indirect", true, null));
    }

    @Test
    void getApprovedSpecies_signsALinkToTheSpeciesPicture() {
        Species basil = species("Basil", "Ocimum basilicum");
        ReflectionTestUtils.setField(basil, "imageKey", "species/basil.jpg");
        when(speciesRepository.findByApprovedTrueOrderByCommonNameAsc()).thenReturn(List.of(basil));
        when(storageService.createReadUrl("species/basil.jpg")).thenReturn("https://storage.test/basil.jpg?signed");

        List<SpeciesResponse> species = new SpeciesService(speciesRepository, storageService).getApprovedSpecies();

        assertThat(species.get(0).imageUrl()).isEqualTo("https://storage.test/basil.jpg?signed");
    }
}
