package com.myplunt.species;

import com.myplunt.user.User;
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

// Only the columns the garden, the add-plant species search and the Pluntdex need so far.
@Entity
@Table(name = "species")
public class Species {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "common_name", nullable = false)
    private String commonName;

    @Column(name = "scientific_name", nullable = false, unique = true)
    private String scientificName;

    @Column(name = "watering_frequency_days")
    private Integer wateringFrequencyDays;

    @Column(name = "region")
    private String region;

    // Free text, e.g. "Low to bright indirect"; null when unknown.
    @Column(name = "sunlight_needs")
    private String sunlightNeeds;

    @Column(name = "image_key")
    private String imageKey;

    // Everyday plants people own (basil, snake plant...); the Pluntdex has a filter for them.
    @Column(name = "is_common", nullable = false)
    private boolean common;

    // Species users submit stay hidden until someone approves them.
    @Column(name = "is_approved", nullable = false)
    private boolean approved;

    // Who submitted it; null for species added by us, or when the account was deleted.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by")
    private User submittedBy;

    // Set by the database (default now()); for a species awaiting approval, when it was submitted.
    @Column(name = "updated_at", insertable = false, updatable = false)
    private Instant updatedAt;

    protected Species() {}

    public Species(String commonName, Integer wateringFrequencyDays) {
        this.commonName = commonName;
        this.wateringFrequencyDays = wateringFrequencyDays;
    }

    public UUID getId() {
        return id;
    }

    public String getCommonName() {
        return commonName;
    }

    public String getScientificName() {
        return scientificName;
    }

    public boolean isApproved() {
        return approved;
    }

    public Integer getWateringFrequencyDays() {
        return wateringFrequencyDays;
    }

    public String getRegion() {
        return region;
    }

    public String getSunlightNeeds() {
        return sunlightNeeds;
    }

    public String getImageKey() {
        return imageKey;
    }

    public boolean isCommon() {
        return common;
    }

    public User getSubmittedBy() {
        return submittedBy;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
