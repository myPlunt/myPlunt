package com.myplunt.species;

import com.myplunt.species.dto.SpeciesResponse;
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

    @Test
    void getApprovedSpecies_mapsTheApprovedSpeciesInRepositoryOrder() {
        UUID id = UUID.randomUUID();
        Species monstera = new Species("Monstera", 7);
        ReflectionTestUtils.setField(monstera, "id", id);
        ReflectionTestUtils.setField(monstera, "scientificName", "Monstera deliciosa");
        when(speciesRepository.findByApprovedTrueOrderByCommonNameAsc()).thenReturn(List.of(monstera));

        List<SpeciesResponse> species = new SpeciesService(speciesRepository).getApprovedSpecies();

        assertThat(species).containsExactly(new SpeciesResponse(id, "Monstera", "Monstera deliciosa", 7));
    }
}
