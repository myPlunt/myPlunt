package com.myplunt.garden;

import com.myplunt.common.exception.NotFoundException;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.garden.dto.CreatePlanterRequest;
import com.myplunt.garden.dto.PlanterResponse;
import com.myplunt.garden.dto.UpdatePlanterRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlanterServiceTest {

    @Mock
    private PlanterRepository planterRepository;

    @Mock
    private AuditLog auditLog;

    private final UUID userId = UUID.randomUUID();
    private final UUID planterId = UUID.randomUUID();

    private PlanterService planterService() {
        return new PlanterService(planterRepository, auditLog);
    }

    @Test
    void create_savesThePlanterForTheOwnerAndReturnsIt() {
        when(planterRepository.save(any())).thenAnswer(invocation -> {
            Planter planter = invocation.getArgument(0);
            ReflectionTestUtils.setField(planter, "id", planterId);
            return planter;
        });

        PlanterResponse response = planterService().create(userId, new CreatePlanterRequest("Balcony", false));

        assertThat(response).isEqualTo(new PlanterResponse(planterId, "Balcony", false));
        ArgumentCaptor<Planter> saved = ArgumentCaptor.forClass(Planter.class);
        verify(planterRepository).save(saved.capture());
        assertThat(saved.getValue().getOwnerId()).isEqualTo(userId);
        assertThat(saved.getValue().getName()).isEqualTo("Balcony");
    }

    @Test
    void create_throwsConflictWhenTheOwnerAlreadyHasAPlanterWithThatName() {
        when(planterRepository.existsByOwnerIdAndNameIgnoreCase(userId, "Balcony")).thenReturn(true);

        assertThatThrownBy(() -> planterService().create(userId, new CreatePlanterRequest("Balcony", false)))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.CONFLICT);
        verify(planterRepository, never()).save(any());
    }

    @Test
    // An older app sends no outdoor flag: renaming mustn't move the planter indoors.
    void rename_changesTheNameOfTheOwnersPlanterAndKeepsItOutdoor() {
        Planter planter = new Planter(userId, "balcony", true);
        ReflectionTestUtils.setField(planter, "id", planterId);
        when(planterRepository.findByIdAndOwnerId(planterId, userId)).thenReturn(Optional.of(planter));
        when(planterRepository.save(planter)).thenReturn(planter);

        PlanterResponse response = planterService().rename(userId, planterId, new UpdatePlanterRequest("Balcony", null));

        assertThat(response).isEqualTo(new PlanterResponse(planterId, "Balcony", true));
        verify(planterRepository).existsByOwnerIdAndNameIgnoreCaseAndIdNot(userId, "Balcony", planterId);
    }

    @Test
    void rename_movesThePlanterOutdoors() {
        Planter planter = new Planter(userId, "Balcony", false);
        ReflectionTestUtils.setField(planter, "id", planterId);
        when(planterRepository.findByIdAndOwnerId(planterId, userId)).thenReturn(Optional.of(planter));
        when(planterRepository.save(planter)).thenReturn(planter);

        PlanterResponse response = planterService().rename(userId, planterId, new UpdatePlanterRequest("Balcony", true));

        assertThat(response).isEqualTo(new PlanterResponse(planterId, "Balcony", true));
    }

    @Test
    void rename_throwsConflictWhenAnotherPlanterHasThatName() {
        when(planterRepository.findByIdAndOwnerId(planterId, userId))
                .thenReturn(Optional.of(new Planter(userId, "Balcony", false)));
        when(planterRepository.existsByOwnerIdAndNameIgnoreCaseAndIdNot(userId, "Kitchen", planterId)).thenReturn(true);

        assertThatThrownBy(() -> planterService().rename(userId, planterId, new UpdatePlanterRequest("Kitchen", null)))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.CONFLICT);
        verify(planterRepository, never()).save(any());
    }

    @Test
    void delete_removesTheOwnersPlanter() {
        Planter planter = new Planter(userId, "Balcony", false);
        when(planterRepository.findByIdAndOwnerId(planterId, userId)).thenReturn(Optional.of(planter));

        planterService().delete(userId, planterId);

        verify(planterRepository).delete(planter);
    }

    @Test
    void delete_throwsNotFoundForSomeoneElsesPlanter() {
        when(planterRepository.findByIdAndOwnerId(planterId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> planterService().delete(userId, planterId))
                .isInstanceOf(NotFoundException.class);
        verify(planterRepository, never()).delete(any());
    }
}
