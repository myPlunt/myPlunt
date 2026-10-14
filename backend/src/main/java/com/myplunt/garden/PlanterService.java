package com.myplunt.garden;

import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.garden.dto.CreatePlanterRequest;
import com.myplunt.garden.dto.PlanterResponse;
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
        // Two planters with the same name would look identical in the garden and the picker.
        if (planterRepository.existsByOwnerIdAndNameIgnoreCase(ownerId, request.name())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "You already have a planter called " + request.name());
        }
        Planter saved = planterRepository.save(new Planter(ownerId, request.name()));
        auditLog.recorded(AuditEvent.PLANTER_CREATED, ownerId, ownerId, Map.of("planter_id", saved.getId()));
        return new PlanterResponse(saved.getId(), saved.getName());
    }
}
