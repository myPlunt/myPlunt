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

    // Both directions, pending included: once they aren't friends neither may look after the other's plants.
    @Transactional
    public void endBetween(UUID userId, UUID otherId) {
        List<String> live = List.of(CareDelegation.PENDING, CareDelegation.ACTIVE);
        careDelegationRepository.findByDelegatedByAndDelegatedToAndStatusIn(userId, otherId, live)
                .forEach(d -> d.setStatus(CareDelegation.ENDED));
        careDelegationRepository.findByDelegatedByAndDelegatedToAndStatusIn(otherId, userId, live)
                .forEach(d -> d.setStatus(CareDelegation.ENDED));
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
