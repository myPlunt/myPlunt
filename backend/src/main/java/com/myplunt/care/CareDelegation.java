package com.myplunt.care;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

// One row per plant: a plant sitter request for the whole garden is the rows with the same pair of users.
@Entity
@Table(name = "care_delegation")
public class CareDelegation {
    public static final String PENDING = "pending";
    public static final String ACTIVE = "active";
    public static final String ENDED = "ended";
    public static final String DECLINED = "declined";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "plant_id", nullable = false)
    private UUID plantId;

    @Column(name = "delegated_by", nullable = false)
    private UUID delegatedBy;

    @Column(name = "delegated_to", nullable = false)
    private UUID delegatedTo;

    @Column(nullable = false)
    private String status;

    @Column(name = "active_from")
    private Instant activeFrom;

    @Column(name = "active_until")
    private Instant activeUntil;

    protected CareDelegation() {}

    public CareDelegation(UUID plantId, UUID delegatedBy, UUID delegatedTo, Instant activeFrom, Instant activeUntil) {
        this.plantId = plantId;
        this.delegatedBy = delegatedBy;
        this.delegatedTo = delegatedTo;
        this.activeFrom = activeFrom;
        this.activeUntil = activeUntil;
        this.status = PENDING;
    }

    public UUID getId() {
        return id;
    }

    public UUID getPlantId() {
        return plantId;
    }

    public UUID getDelegatedBy() {
        return delegatedBy;
    }

    public UUID getDelegatedTo() {
        return delegatedTo;
    }

    public String getStatus() {
        return status;
    }

    public Instant getActiveFrom() {
        return activeFrom;
    }

    public Instant getActiveUntil() {
        return activeUntil;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
