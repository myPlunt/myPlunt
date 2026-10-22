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
@Table(name = "plant_photos")
public class PlantPhoto {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id", nullable = false)
    private Plant plant;

    // A friend looking after the plant can add photos too, so this isn't always the owner.
    @Column(name = "uploaded_by")
    private UUID uploadedBy;

    @Column(name = "photo_key", nullable = false)
    private String photoKey;

    @Column(name = "taken_at")
    private Instant takenAt;

    private String caption;

    protected PlantPhoto() {}

    public PlantPhoto(Plant plant, UUID uploadedBy, String photoKey, Instant takenAt) {
        this.plant = plant;
        this.uploadedBy = uploadedBy;
        this.photoKey = photoKey;
        this.takenAt = takenAt;
    }

    public UUID getId() {
        return id;
    }

    public Plant getPlant() {
        return plant;
    }

    public UUID getUploadedBy() {
        return uploadedBy;
    }

    public String getPhotoKey() {
        return photoKey;
    }

    public Instant getTakenAt() {
        return takenAt;
    }

    public void setTakenAt(Instant takenAt) {
        this.takenAt = takenAt;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }
}
