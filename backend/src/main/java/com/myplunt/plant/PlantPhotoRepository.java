package com.myplunt.plant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface PlantPhotoRepository extends JpaRepository<PlantPhoto, UUID> {
    // A plant's current photo is its newest one; older ones stay for the feed. One row per
    // plant that has a photo (two if two share the newest time); plants without one are absent.
    @Query("""
            select new com.myplunt.plant.LatestPhoto(p.plant.id, p.photoKey)
            from PlantPhoto p
            where p.plant.id in :plantIds
              and p.takenAt = (select max(p2.takenAt) from PlantPhoto p2 where p2.plant = p.plant)
            """)
    List<LatestPhoto> findLatestPhotos(Collection<UUID> plantIds);

    // Every photo the plant ever had, so they can be removed from storage along with it.
    @Query("select p.photoKey from PlantPhoto p where p.plant.id = :plantId")
    List<String> findPhotoKeysByPlantId(UUID plantId);
}
