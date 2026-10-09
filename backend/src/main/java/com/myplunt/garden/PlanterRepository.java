package com.myplunt.garden;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PlanterRepository extends JpaRepository<Planter, UUID> {
    List<Planter> findByOwnerIdOrderByCreatedAtAsc(UUID ownerId);
}
