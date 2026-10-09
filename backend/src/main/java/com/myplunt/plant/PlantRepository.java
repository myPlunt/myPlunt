package com.myplunt.plant;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlantRepository extends JpaRepository<Plant, UUID> {
    // Fetches the species in the same query: the garden needs each plant's watering frequency.
    @EntityGraph(attributePaths = "species")
    List<Plant> findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(UUID ownerId);

    Optional<Plant> findByIdAndOwnerId(UUID id, UUID ownerId);
}
