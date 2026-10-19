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
    // Shared from Add photo; the photo is the post's picture, not the plant's newest one, and
    // body is the owner's optional comment on it.
    public static final String NEW_PHOTO = "new_photo";
    // A question for friends (body), with an optional photo of its own (photoKey); not about a plant.
    public static final String QUESTION = "question";

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

    private String body;

    // Storage key of a question's own photo; null for other posts and questions without one.
    @Column(name = "photo_key")
    private String photoKey;

    // Required for questions (and only for them) by chk_posts_is_resolved_only_for_question.
    @Column(name = "is_resolved")
    private Boolean resolved;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Post() {}

    public Post(UUID userId, Plant plant, String postType) {
        this.userId = userId;
        this.plant = plant;
        this.postType = postType;
        this.createdAt = Instant.now();
    }

    public Post(UUID userId, PlantPhoto photo, String comment) {
        this(userId, photo.getPlant(), NEW_PHOTO);
        this.photo = photo;
        this.body = comment;
    }

    public Post(UUID userId, String question, String photoKey) {
        this(userId, (Plant) null, QUESTION);
        this.body = question;
        this.photoKey = photoKey;
        this.resolved = false;
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

    public String getBody() {
        return body;
    }

    public String getPhotoKey() {
        return photoKey;
    }

    public String getPostType() {
        return postType;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
