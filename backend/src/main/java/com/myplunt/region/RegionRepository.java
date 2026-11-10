package com.myplunt.region;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface RegionRepository extends JpaRepository<Region, UUID> {

    // One query for the regions, their parents and countries, instead of one per region.
    @Query("select distinct r from Region r left join fetch r.parent left join fetch r.countries order by r.position")
    List<Region> findAllWithCountries();

    List<Region> findByNameInOrderByPosition(Collection<String> names);
}
