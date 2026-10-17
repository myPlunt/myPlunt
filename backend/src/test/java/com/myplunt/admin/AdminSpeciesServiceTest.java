package com.myplunt.admin;

import com.myplunt.admin.dto.PendingSpeciesResponse;
import com.myplunt.species.Species;
import com.myplunt.species.SpeciesRepository;
import com.myplunt.storage.StorageService;
import com.myplunt.user.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminSpeciesServiceTest {

    @Mock
    private SpeciesRepository speciesRepository;

    @Mock
    private StorageService storageService;

    private Species species(String commonName, String scientificName) {
        Species species = new Species(commonName, 14);
        ReflectionTestUtils.setField(species, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(species, "scientificName", scientificName);
        return species;
    }

    @Test
    void getPendingSpecies_mapsEachSpeciesWithItsSubmitterAndPicture() {
        Instant submittedAt = Instant.parse("2026-10-11T09:30:00Z");
        Species olive = species("Olive tree", "Olea europaea");
        ReflectionTestUtils.setField(olive, "region", "Mediterranean");
        ReflectionTestUtils.setField(olive, "sunlightNeeds", "Full sun");
        ReflectionTestUtils.setField(olive, "imageKey", "species/olive/seed.jpg");
        ReflectionTestUtils.setField(olive, "submittedBy", new User("plantdad", "plantdad@example.com", "hashed"));
        ReflectionTestUtils.setField(olive, "updatedAt", submittedAt);
        // Its submitter's account was deleted, and it has no picture.
        Species sage = species("Common sage", "Salvia officinalis");
        when(speciesRepository.findPendingWithSubmitter()).thenReturn(List.of(olive, sage));
        when(storageService.createReadUrl("species/olive/seed.jpg")).thenReturn("https://storage.test/olive");

        List<PendingSpeciesResponse> pending = new AdminSpeciesService(speciesRepository, storageService).getPendingSpecies();

        assertThat(pending).containsExactly(
                new PendingSpeciesResponse(olive.getId(), "Olive tree", "Olea europaea", "Mediterranean", 14, "Full sun",
                        "https://storage.test/olive", "plantdad", submittedAt),
                new PendingSpeciesResponse(sage.getId(), "Common sage", "Salvia officinalis", null, 14, null,
                        null, null, null));
    }
}
