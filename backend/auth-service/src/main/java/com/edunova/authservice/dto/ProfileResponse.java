package com.edunova.authservice.dto;

public record ProfileResponse(
        Long userId,
        String name,
        String phoneNumber,
        String email,
        String role,
        boolean googleAccount
) {
}
