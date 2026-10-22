package com.myplunt.post;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

// A friend's like on a post. The app only has one kind, a water drop, so emoji is always WATER;
// uq_post_reactions_post_user keeps it to one per user and post.
@Entity
@Table(name = "post_reactions")
public class PostReaction {
    public static final String WATER = "💧";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "post_id", nullable = false)
    private UUID postId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String emoji;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected PostReaction() {}

    public PostReaction(UUID postId, UUID userId) {
        this.postId = postId;
        this.userId = userId;
        this.emoji = WATER;
        this.createdAt = Instant.now();
    }

    public UUID getPostId() {
        return postId;
    }

    public UUID getUserId() {
        return userId;
    }
}
