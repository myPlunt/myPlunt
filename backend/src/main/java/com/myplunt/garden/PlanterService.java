package com.myplunt.garden;

import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.garden.dto.CreatePlanterRequest;
import com.myplunt.garden.dto.PlanterResponse;
import com.myplunt.garden.dto.UpdatePlanterRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@Service
public class PlanterService {

    private final PlanterRepository planterRepository;
    private final AuditLog auditLog;

    public PlanterService(PlanterRepository planterRepository, AuditLog auditLog) {
        this.planterRepository = planterRepository;
        this.auditLog = auditLog;
    }

    @Transactional
    public PlanterResponse create(UUID ownerId, CreatePlanterRequest request) {
        if (planterRepository.existsByOwnerIdAndNameIgnoreCase(ownerId, request.name())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "You already have a planter called " + request.name());
        }
        Planter saved = planterRepository.save(new Planter(ownerId, request.name()));
        auditLog.recorded(AuditEvent.PLANTER_CREATED, ownerId, ownerId, Map.of("planter_id", saved.getId()));
        return new PlanterResponse(saved.getId(), saved.getName());
    }

    @Transactional
    public PlanterResponse rename(UUID ownerId, UUID planterId, UpdatePlanterRequest request) {
        Planter planter = findOwnPlanter(ownerId, planterId);
        // Checked against the other planters only, so "balcony" can become "Balcony".
        if (planterRepository.existsByOwnerIdAndNameIgnoreCaseAndIdNot(ownerId, request.name(), planterId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "You already have a planter called " + request.name());
        }
        planter.setName(request.name());
        Planter saved = planterRepository.save(planter);
        auditLog.recorded(AuditEvent.PLANTER_RENAMED, ownerId, ownerId, Map.of("planter_id", planterId));
        return new PlanterResponse(saved.getId(), saved.getName());
    }

    // Its plants stay: plants.planter_id is ON DELETE SET NULL.
    @Transactional
    public void delete(UUID ownerId, UUID planterId) {
        planterRepository.delete(findOwnPlanter(ownerId, planterId));
        auditLog.recorded(AuditEvent.PLANTER_DELETED, ownerId, ownerId, Map.of("planter_id", planterId));
    }

    private Planter findOwnPlanter(UUID ownerId, UUID planterId) {
        return planterRepository.findByIdAndOwnerId(planterId, ownerId)
                .orElseThrow(() -> new IllegalStateException("Planter not found"));
    }
}
