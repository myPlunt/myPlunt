package com.myplunt.notification;

import java.util.UUID;

// What a like or comment notification needs to know about the post, read before it's sent in the
// background (where the post's lazy plant can't be loaded any more). type is a Post constant;
// plantName is null for a question, question null for a plant post.
public record PostNotice(UUID postId, UUID ownerId, String type, String plantName, String question) {
}
