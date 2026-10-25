package com.myplunt.care;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

// No dependencies, so Plants and Notifications can use it while CareRequestService depends on them.
@Service
public class CareDelegationService {

    private final CareDelegationRepository careDelegationRepository;

    public CareDelegationService(CareDelegationRepository careDelegationRepository) {
        this.careDelegationRepository = careDelegationRepository;
    }

    @Transactional(readOnly = true)
    public boolean isSitting(UUID plantId, UUID sitterId) {
        return careDelegationRepository.existsByPlantIdAndDelegatedToAndStatusAndActiveUntilAfter(
                plantId, sitterId, CareDelegation.ACTIVE, Instant.now());
    }

    @Transactional(readOnly = true)
    public List<UUID> sittingFor(UUID sitterId, Instant now) {
        return careDelegationRepository.findByDelegatedToAndStatusInOrderByActiveFromAsc(sitterId, List.of(CareDelegation.ACTIVE))
                .stream()
                .filter(d -> d.getActiveUntil().isAfter(now))
                .map(CareDelegation::getDelegatedBy)
                .distinct()
                .toList();
    }
}
