package com.myplunt.post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface PostReactionRepository extends JpaRepository<PostReaction, UUID> {
    boolean existsByPostIdAndUserId(UUID postId, UUID userId);

    long deleteByPostIdAndUserId(UUID postId, UUID userId);

    // One row per post that has drops; posts without any are absent.
    @Query("""
            select new com.myplunt.post.PostCount(r.postId, count(r))
            from PostReaction r
            where r.postId in :postIds
            group by r.postId
            """)
    List<PostCount> countByPostIds(Collection<UUID> postIds);

    // Which of these posts the user has watered.
    @Query("select r.postId from PostReaction r where r.userId = :userId and r.postId in :postIds")
    List<UUID> findWateredPostIds(UUID userId, Collection<UUID> postIds);
}
