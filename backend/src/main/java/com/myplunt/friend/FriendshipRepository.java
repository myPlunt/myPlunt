package com.myplunt.friend;

import com.myplunt.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {
    @Query("""
            select f from Friendship f
            where (f.requesterId = :userId and f.receiverId in :otherIds)
               or (f.receiverId = :userId and f.requesterId in :otherIds)
            """)
    List<Friendship> findBetween(UUID userId, Collection<UUID> otherIds);

    Optional<Friendship> findByRequesterIdAndReceiverIdAndStatus(UUID requesterId, UUID receiverId, String status);

    @Query("""
            select u from Friendship f join User u on u.id = f.requesterId
            where f.receiverId = :userId and f.status = 'pending'
            order by f.createdAt desc
            """)
    List<User> findRequesters(UUID userId);

    @Query("""
            select u from Friendship f join User u on u.id = f.receiverId
            where f.requesterId = :userId and f.status = 'pending'
            order by f.createdAt desc
            """)
    List<User> findRequested(UUID userId);

    @Query("""
            select u from Friendship f
            join User u on (u.id = f.receiverId and f.requesterId = :userId)
                        or (u.id = f.requesterId and f.receiverId = :userId)
            where f.status = 'accepted'
            order by u.username
            """)
    List<User> findFriends(UUID userId);
}
