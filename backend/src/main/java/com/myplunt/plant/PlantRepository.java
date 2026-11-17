package com.myplunt.plant;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlantRepository extends JpaRepository<Plant, UUID> {
    @EntityGraph(attributePaths = "species")
    List<Plant> findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(UUID ownerId);

    // Plants without a planter count as indoor.
    @Query("""
            select count(p) > 0 from Plant p, Planter pl
            where p.planterId = pl.id and pl.outdoor = true and p.ownerId = :ownerId and p.alive = true""")
    boolean hasLivingOutdoorPlants(UUID ownerId);

    Optional<Plant> findByIdAndOwnerId(UUID id, UUID ownerId);
}
