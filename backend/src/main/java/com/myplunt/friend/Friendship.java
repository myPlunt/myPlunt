package com.myplunt.friend;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

// One row per pair of users, whoever asked first; the database rejects a second row for the same pair
// in either direction. created_at is left to its database default.
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
}
