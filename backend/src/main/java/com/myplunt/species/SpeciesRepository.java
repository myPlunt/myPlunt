package com.myplunt.species;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpeciesRepository extends JpaRepository<Species, UUID> {
    List<Species> findByApprovedTrueOrderByCommonNameAsc();

    Optional<Species> findByIdAndApprovedTrue(UUID id);

    Optional<Species> findByIdAndApprovedFalse(UUID id);

    @Query("select s from Species s left join fetch s.submittedBy where s.approved = false order by s.updatedAt asc")
    List<Species> findPendingWithSubmitter();

    // Native SQL: discovered_species has no entity. Discovering a species twice is a no-op.
    @Modifying
    @Query(value = "insert into discovered_species (user_id, species_id) values (:userId, :speciesId) on conflict do nothing",
            nativeQuery = true)
    void markDiscovered(UUID userId, UUID speciesId);

    // Quoted aliases, because Postgres lowercases bare ones and the projection wouldn't match.
    @Query(value = "select species_id as \"speciesId\", discovered_at as \"discoveredAt\" from discovered_species where user_id = :userId",
            nativeQuery = true)
    List<DiscoveredSpecies> findDiscoveredSpecies(UUID userId);

    interface DiscoveredSpecies {
        UUID getSpeciesId();

        Instant getDiscoveredAt();
    }
}
