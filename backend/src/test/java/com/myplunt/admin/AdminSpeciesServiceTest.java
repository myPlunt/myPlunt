package com.myplunt.admin;

import com.myplunt.common.exception.NotFoundException;
import com.myplunt.admin.dto.PendingSpeciesResponse;
import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.species.Species;
import com.myplunt.species.SpeciesService;
import com.myplunt.storage.StorageService;
import com.myplunt.user.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminSpeciesServiceTest {

    @Mock
    private SpeciesService speciesService;

    @Mock
    private StorageService storageService;

    @Mock
    private AuditLog auditLog;

    private final UUID adminId = UUID.randomUUID();

    private AdminSpeciesService service() {
        return new AdminSpeciesService(speciesService, storageService, auditLog);
    }

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
        when(speciesService.findPending()).thenReturn(List.of(olive, sage));
        when(storageService.createReadUrl("species/olive/seed.jpg")).thenReturn("https://storage.test/olive");

        List<PendingSpeciesResponse> pending = service().getPendingSpecies();

        assertThat(pending).containsExactly(
                new PendingSpeciesResponse(olive.getId(), "Olive tree", "Olea europaea", "Mediterranean", 14, "Full sun",
                        "https://storage.test/olive", "plantdad", submittedAt),
                new PendingSpeciesResponse(sage.getId(), "Common sage", "Salvia officinalis", null, 14, null,
                        null, null, null));
    }

    @Test
    void approve_marksThePendingSpeciesApprovedAndLogsItForTheSubmitter() {
        Species olive = species("Olive tree", "Olea europaea");
        User submitter = new User("plantdad", "plantdad@example.com", "hashed");
        ReflectionTestUtils.setField(submitter, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(olive, "submittedBy", submitter);
        when(speciesService.findPending(olive.getId())).thenReturn(olive);

        service().approve(olive.getId(), adminId);

        assertThat(olive.isApproved()).isTrue();
        verify(auditLog).recorded(AuditEvent.SPECIES_APPROVED, submitter.getId(), adminId, Map.of(
                "species_id", olive.getId(), "common_name", "Olive tree", "scientific_name", "Olea europaea"));
    }

    @Test
    void reject_deletesThePendingSpeciesAndLogsIt() {
        Species olive = species("Olive tree", "Olea europaea");
        when(speciesService.findPending(olive.getId())).thenReturn(olive);

        service().reject(olive.getId(), adminId);

        verify(speciesService).delete(olive);
        verify(auditLog).recorded(eq(AuditEvent.SPECIES_REJECTED), eq(null), eq(adminId), anyMap());
    }

    @Test
    void reject_throwsNotFoundForASpeciesThatIsNotPending() {
        UUID approvedId = UUID.randomUUID();
        when(speciesService.findPending(approvedId)).thenThrow(new NotFoundException("Species not found"));

        assertThatThrownBy(() -> service().reject(approvedId, adminId))
                .isInstanceOf(NotFoundException.class);
        verify(speciesService, never()).delete(any());
        verify(auditLog, never()).recorded(any(), any(), any(), anyMap());
    }
}
