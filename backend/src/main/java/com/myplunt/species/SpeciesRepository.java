package com.myplunt.species;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpeciesRepository extends JpaRepository<Species, UUID> {
    List<Species> findByApprovedTrueOrderByCommonNameAsc();

    Optional<Species> findByIdAndApprovedTrue(UUID id);
}
