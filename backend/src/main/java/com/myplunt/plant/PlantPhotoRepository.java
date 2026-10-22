package com.myplunt.plant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlantPhotoRepository extends JpaRepository<PlantPhoto, UUID> {
    // A plant's newest photo; two rows if two share the newest time.
    @Query("""
            select new com.myplunt.plant.LatestPhoto(p.plant.id, p.photoKey)
            from PlantPhoto p
            where p.plant.id in :plantIds
              and p.takenAt = (select max(p2.takenAt) from PlantPhoto p2 where p2.plant = p.plant)
            """)
    List<LatestPhoto> findLatestPhotos(Collection<UUID> plantIds);

    Optional<PlantPhoto> findByIdAndPlantId(UUID id, UUID plantId);

    List<PlantPhoto> findByPlantIdOrderByTakenAtAsc(UUID plantId);

    @Query("select p.photoKey from PlantPhoto p where p.plant.id = :plantId")
    List<String> findPhotoKeysByPlantId(UUID plantId);
}
