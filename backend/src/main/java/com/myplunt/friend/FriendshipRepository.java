package com.myplunt.friend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {
    // The user's friendships with any of the others, whichever of the two sent the request.
    @Query("""
            select f from Friendship f
            where (f.requesterId = :userId and f.receiverId in :otherIds)
               or (f.receiverId = :userId and f.requesterId in :otherIds)
            """)
    List<Friendship> findBetween(UUID userId, Collection<UUID> otherIds);
}
