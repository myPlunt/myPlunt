package com.myplunt.species;

import com.myplunt.region.Region;
import com.myplunt.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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

    // Where the plant is native: every region it grows in, never a parent like Europe.
    @ManyToMany
    @JoinTable(name = "species_regions", joinColumns = @JoinColumn(name = "species_id"),
            inverseJoinColumns = @JoinColumn(name = "region_id"))
    @OrderBy("position")
    private List<Region> regions = new ArrayList<>();

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

    // An imported species: pending until an admin approves it.
    public Species(String commonName, String scientificName, Integer wateringFrequencyDays, String sunlightNeeds) {
        this(commonName, wateringFrequencyDays);
        this.scientificName = scientificName;
        this.sunlightNeeds = sunlightNeeds;
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

    public void update(String commonName, String scientificName, String region, Integer wateringFrequencyDays,
            String sunlightNeeds, boolean common) {
        this.commonName = commonName;
        this.scientificName = scientificName;
        this.region = region;
        this.wateringFrequencyDays = wateringFrequencyDays;
        this.sunlightNeeds = sunlightNeeds;
        this.common = common;
    }

    public Integer getWateringFrequencyDays() {
        return wateringFrequencyDays;
    }

    public List<Region> getRegions() {
        return regions;
    }

    public List<String> getRegionNames() {
        return regions.stream().map(Region::getName).toList();
    }

    public void setRegions(List<Region> regions) {
        this.regions.clear();
        this.regions.addAll(regions);
    }

    public String getSunlightNeeds() {
        return sunlightNeeds;
    }

    public String getImageKey() {
        return imageKey;
    }

    public void updateCare(List<Region> regions, Integer wateringFrequencyDays, String sunlightNeeds) {
        setRegions(regions);
        this.wateringFrequencyDays = wateringFrequencyDays;
        this.sunlightNeeds = sunlightNeeds;
    }

    public void setImageKey(String imageKey) {
        this.imageKey = imageKey;
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
