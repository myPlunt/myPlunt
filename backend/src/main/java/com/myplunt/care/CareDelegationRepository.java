package com.myplunt.care;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface CareDelegationRepository extends JpaRepository<CareDelegation, UUID> {
    List<CareDelegation> findByDelegatedByAndDelegatedToAndStatusIn(UUID delegatedBy, UUID delegatedTo, Collection<String> statuses);

    List<CareDelegation> findByDelegatedToAndStatusInOrderByActiveFromAsc(UUID delegatedTo, Collection<String> statuses);

    List<CareDelegation> findByDelegatedByAndStatusInOrderByActiveFromAsc(UUID delegatedBy, Collection<String> statuses);
}
