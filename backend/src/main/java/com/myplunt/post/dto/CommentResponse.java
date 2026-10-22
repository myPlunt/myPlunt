package com.myplunt.post.dto;

import com.myplunt.user.dto.UserSummaryResponse;

import java.time.Instant;
import java.util.UUID;

// author.friendship is always null: commenters can be strangers to the viewer, so it isn't looked up.
public record CommentResponse(UUID id, UserSummaryResponse author, String body, Instant createdAt) {
}
