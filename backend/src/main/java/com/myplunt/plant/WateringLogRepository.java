package com.myplunt.plant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface WateringLogRepository extends JpaRepository<WateringLog, UUID> {
    // One row per plant that has been watered at least once; never-watered plants are absent.
    @Query("""
            select new com.myplunt.plant.LastWatering(w.plant.id, max(w.wateredAt))
            from WateringLog w
            where w.plant.id in :plantIds
            group by w.plant.id
            """)
    List<LastWatering> findLastWateredAt(Collection<UUID> plantIds);

    List<WateringLog> findByPlantIdOrderByWateredAtDesc(UUID plantId);
}
