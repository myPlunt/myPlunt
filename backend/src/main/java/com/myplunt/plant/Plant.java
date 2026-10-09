package com.myplunt.plant;

import com.myplunt.species.Species;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "plants")
public class Plant {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    // Null while the plant isn't in a room yet.
    @Column(name = "planter_id")
    private UUID planterId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "species_id")
    private Species species;

    @Column(nullable = false)
    private String name;

    @Column(name = "is_alive", nullable = false)
    private boolean alive = true;

    // Filled in by the database default.
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    protected Plant() {}

    public Plant(UUID ownerId, String name) {
        this.ownerId = ownerId;
        this.name = name;
    }

    public UUID getId() {
        return id;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public UUID getPlanterId() {
        return planterId;
    }

    public void setPlanterId(UUID planterId) {
        this.planterId = planterId;
    }

    public Species getSpecies() {
        return species;
    }

    public void setSpecies(Species species) {
        this.species = species;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isAlive() {
        return alive;
    }

    public void setAlive(boolean alive) {
        this.alive = alive;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
