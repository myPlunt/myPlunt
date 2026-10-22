package com.myplunt.post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface PostCommentRepository extends JpaRepository<PostComment, UUID> {
    // Oldest first, so the conversation reads top to bottom.
    List<PostComment> findByPostIdOrderByCreatedAtAsc(UUID postId);

    // One row per post that has comments; posts without any are absent.
    @Query("""
            select new com.myplunt.post.CommentCount(c.postId, count(c))
            from PostComment c
            where c.postId in :postIds
            group by c.postId
            """)
    List<CommentCount> countByPostIds(Collection<UUID> postIds);
}
