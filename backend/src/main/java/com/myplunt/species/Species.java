package com.myplunt.species;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

// Only the columns the garden and the add-plant species search need so far; the
// Plantdex will map the rest.
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

    // Species users submit stay hidden until someone approves them.
    @Column(name = "is_approved", nullable = false)
    private boolean approved;

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
}
