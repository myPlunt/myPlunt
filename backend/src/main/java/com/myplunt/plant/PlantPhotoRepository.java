package com.myplunt.plant;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PlantPhotoRepository extends JpaRepository<PlantPhoto, UUID> {
    // The plant's current photo is its newest one; older ones stay for the feed.
    Optional<PlantPhoto> findFirstByPlantIdOrderByTakenAtDesc(UUID plantId);
}
