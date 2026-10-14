package com.myplunt.admin.dto;

import java.util.UUID;

public record AdminResponse(UUID id, String email, String displayName) {
}
