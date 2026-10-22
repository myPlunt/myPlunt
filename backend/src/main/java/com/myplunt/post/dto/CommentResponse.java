package com.myplunt.post.dto;

import com.myplunt.user.dto.UserSummaryResponse;

import java.time.Instant;
import java.util.UUID;

// One comment under a post. Commenters can be friends of the post's author the viewer doesn't
// know, so author.friendship isn't looked up and is always null.
public record CommentResponse(UUID id, UserSummaryResponse author, String body, Instant createdAt) {
}
