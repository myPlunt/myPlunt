package com.myplunt.post;

import java.util.UUID;

public record CommentCount(UUID postId, long count) {
}
