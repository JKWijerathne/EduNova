package com.edunova.authservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be 100 characters or fewer")
        String name,
        @Size(max = 25, message = "Phone number must be 25 characters or fewer")
        @Pattern(regexp = "^$|^(?=.*\\d)[+]?[0-9() .-]{7,25}$", message = "Enter a valid phone number")
        String phoneNumber
) {
}
