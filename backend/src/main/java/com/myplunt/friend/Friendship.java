package com.myplunt.friend;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

// One row per pair of users, whoever asked first; the database rejects a second row for the same pair
// in either direction. A declined request is deleted, so the two can ask again later.
@Entity
@Table(name = "friendships")
public class Friendship {
    public static final String PENDING = "pending";
    public static final String ACCEPTED = "accepted";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "requester_id", nullable = false)
    private UUID requesterId;

    @Column(name = "receiver_id", nullable = false)
    private UUID receiverId;

    // pending, accepted, declined or blocked.
    @Column(nullable = false)
    private String status;

    // Set by its database default; only read, to list requests newest first.
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    protected Friendship() {}

    public Friendship(UUID requesterId, UUID receiverId) {
        this.requesterId = requesterId;
        this.receiverId = receiverId;
        this.status = PENDING;
    }

    public UUID getId() {
        return id;
    }

    public UUID getRequesterId() {
        return requesterId;
    }

    public UUID getReceiverId() {
        return receiverId;
    }

    public String getStatus() {
        return status;
    }

    public void accept() {
        this.status = ACCEPTED;
    }
}
