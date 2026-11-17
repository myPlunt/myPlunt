package com.myplunt.garden.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePlanterRequest(
        @NotBlank(message = "Name must not be blank.")
                @Size(max = 30, message = "Name must be at most 30 characters.")
                String name,
        // Missing means indoor.
        boolean outdoor) {

    public CreatePlanterRequest {
        name = name == null ? null : name.strip();
    }
}
