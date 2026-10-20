package com.myplunt.post;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PostRepository extends JpaRepository<Post, UUID> {
    // The user's own posts and their friends', of the given types, newest first. The plant
    // (none for a question) and photo are fetched along, so mapping the feed doesn't load each
    // one separately.
    @Query("""
            select p from Post p left join fetch p.plant left join fetch p.photo
            where p.postType in :types
              and (p.userId = :userId
                   or p.userId in (select f.receiverId from Friendship f
                                   where f.requesterId = :userId and f.status = 'accepted')
                   or p.userId in (select f.requesterId from Friendship f
                                   where f.receiverId = :userId and f.status = 'accepted'))
            order by p.createdAt desc
            """)
    List<Post> findFeed(UUID userId, Collection<String> types, Limit limit);

    // The user's own posts of the given types, newest first, with the same fetches as findFeed.
    @Query("""
            select p from Post p left join fetch p.plant left join fetch p.photo
            where p.userId = :userId and p.postType in :types
            order by p.createdAt desc
            """)
    List<Post> findOwn(UUID userId, Collection<String> types);

    // One post, if the user may see it: their own or an accepted friend's, as in findFeed.
    @Query("""
            select p from Post p left join fetch p.plant left join fetch p.photo
            where p.id = :postId and p.postType in :types
              and (p.userId = :userId
                   or p.userId in (select f.receiverId from Friendship f
                                   where f.requesterId = :userId and f.status = 'accepted')
                   or p.userId in (select f.requesterId from Friendship f
                                   where f.receiverId = :userId and f.status = 'accepted'))
            """)
    Optional<Post> findVisible(UUID postId, UUID userId, Collection<String> types);

    Optional<Post> findByIdAndUserId(UUID id, UUID userId);
}
