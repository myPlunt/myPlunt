package com.myplunt.garden.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdatePlanterRequest(
        @NotBlank(message = "Name must not be blank.")
                @Size(max = 255, message = "Name must be at most 255 characters.")
                String name) {

    // Strip before validation runs, so a name of only spaces counts as blank.
    public UpdatePlanterRequest {
        name = name == null ? null : name.strip();
    }
}
