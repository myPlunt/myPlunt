package com.myplunt.plant;

import com.myplunt.plant.dto.WateringLogResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface WateringLogRepository extends JpaRepository<WateringLog, UUID> {
    @Query("""
            select new com.myplunt.plant.LastWatering(w.plant.id, max(w.wateredAt))
            from WateringLog w
            where w.plant.id in :plantIds
            group by w.plant.id
            """)
    List<LastWatering> findLastWateredAt(Collection<UUID> plantIds);

    List<WateringLog> findByPlantIdOrderByWateredAtAsc(UUID plantId);

    List<WateringLog> findByPlantIdInOrderByWateredAtAsc(Collection<UUID> plantIds);

    @Query("""
            select new com.myplunt.plant.dto.WateringLogResponse(w.id, p.id, p.name, w.wateredAt)
            from WateringLog w join w.plant p
            where p.ownerId = :ownerId and w.wateredAt >= :from and w.wateredAt < :to
            order by w.wateredAt desc
            """)
    List<WateringLogResponse> findOwnersWaterings(UUID ownerId, Instant from, Instant to);
}
