package com.myplunt.garden;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

// A room or spot in the user's garden (Balcony, Kitchen windowsill...).
@Entity
@Table(name = "planters")
public class Planter {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(nullable = false)
    private String name;

    // Filled in by the database default.
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    protected Planter() {}

    public Planter(UUID ownerId, String name) {
        this.ownerId = ownerId;
        this.name = name;
    }

    public UUID getId() {
        return id;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
