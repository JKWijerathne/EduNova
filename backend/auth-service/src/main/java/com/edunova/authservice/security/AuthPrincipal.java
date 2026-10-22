package com.edunova.authservice.security;

public record AuthPrincipal(Long userId, String email) {
}
