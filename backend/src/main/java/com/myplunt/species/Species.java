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

    @Column(name = "sunlight_needs")
    private String sunlightNeeds;

    @Column(name = "image_key")
    private String imageKey;

    @Column(name = "is_common", nullable = false)
    private boolean common;

    @Column(name = "is_approved", nullable = false)
    private boolean approved;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by")
    private User submittedBy;

    // For a pending species, when it was submitted.
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

    public void approve() {
        this.approved = true;
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
