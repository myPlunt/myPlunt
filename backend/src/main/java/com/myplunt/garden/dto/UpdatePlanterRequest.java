package com.myplunt.garden.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdatePlanterRequest(
        @NotBlank(message = "Name must not be blank.")
                @Size(max = 30, message = "Name must be at most 30 characters.")
                String name,
        // null keeps the current value, so an older app that only renames doesn't reset it.
        Boolean outdoor) {

    public UpdatePlanterRequest {
        name = name == null ? null : name.strip();
    }
}
