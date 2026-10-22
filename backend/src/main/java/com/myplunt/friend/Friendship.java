package com.myplunt.friend;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

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

    @Column(nullable = false)
    private String status;

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
