package com.myplunt.plant;

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
@Table(name = "watering_logs")
public class WateringLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id", nullable = false)
    private Plant plant;

    // A friend looking after the plant can water it too, so this isn't always the owner.
    @Column(name = "watered_by")
    private UUID wateredBy;

    @Column(name = "watered_at", nullable = false)
    private Instant wateredAt;

    protected WateringLog() {}

    public WateringLog(Plant plant, UUID wateredBy, Instant wateredAt) {
        this.plant = plant;
        this.wateredBy = wateredBy;
        this.wateredAt = wateredAt;
    }

    public UUID getId() {
        return id;
    }

    public Plant getPlant() {
        return plant;
    }

    public UUID getWateredBy() {
        return wateredBy;
    }

    public Instant getWateredAt() {
        return wateredAt;
    }
}
