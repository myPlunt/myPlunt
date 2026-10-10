package com.myplunt.garden;

import com.myplunt.garden.dto.CreatePlanterRequest;
import com.myplunt.garden.dto.PlanterResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class PlanterService {

    private final PlanterRepository planterRepository;

    public PlanterService(PlanterRepository planterRepository) {
        this.planterRepository = planterRepository;
    }

    @Transactional
    public PlanterResponse create(UUID ownerId, CreatePlanterRequest request) {
        // Two planters with the same name would look identical in the garden and the picker.
        if (planterRepository.existsByOwnerIdAndNameIgnoreCase(ownerId, request.name())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "You already have a planter called " + request.name());
        }
        Planter saved = planterRepository.save(new Planter(ownerId, request.name()));
        return new PlanterResponse(saved.getId(), saved.getName());
    }
}
