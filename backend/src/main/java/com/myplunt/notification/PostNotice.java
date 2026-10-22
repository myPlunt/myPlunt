package com.myplunt.notification;

import java.util.UUID;

// Read before the async send, where the post's lazy plant can no longer be loaded.
public record PostNotice(UUID postId, UUID ownerId, String type, String plantName, String question) {
}
