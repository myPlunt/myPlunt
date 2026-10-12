package com.myplunt.species;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpeciesRepository extends JpaRepository<Species, UUID> {
    List<Species> findByApprovedTrueOrderByCommonNameAsc();

    Optional<Species> findByIdAndApprovedTrue(UUID id);

    // caught_species (V7) is plain SQL: it's a list of ids with no entity of its own.
    // Catching a species twice is a no-op, so callers don't check first.
    @Modifying
    @Query(value = "insert into caught_species (user_id, species_id) values (:userId, :speciesId) on conflict do nothing",
            nativeQuery = true)
    void markCaught(UUID userId, UUID speciesId);

    @Query(value = "select species_id from caught_species where user_id = :userId", nativeQuery = true)
    List<UUID> findCaughtSpeciesIds(UUID userId);
}
