package com.myplunt.post;

import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantPhoto;
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
@Table(name = "posts")
public class Post {
    // Shared from the Add plant form when the owner ticks "Share this with your friends".
    public static final String NEW_PLANT = "new_plant";
    // Shared from Add photo; the photo is the post's picture, not the plant's newest one.
    public static final String NEW_PHOTO = "new_photo";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plant_id")
    private Plant plant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "photo_id")
    private PlantPhoto photo;

    @Column(name = "post_type", nullable = false)
    private String postType;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Post() {}

    public Post(UUID userId, Plant plant, String postType) {
        this.userId = userId;
        this.plant = plant;
        this.postType = postType;
        this.createdAt = Instant.now();
    }

    public Post(UUID userId, PlantPhoto photo) {
        this(userId, photo.getPlant(), NEW_PHOTO);
        this.photo = photo;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public Plant getPlant() {
        return plant;
    }

    // Null except for photo posts.
    public PlantPhoto getPhoto() {
        return photo;
    }

    public String getPostType() {
        return postType;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
