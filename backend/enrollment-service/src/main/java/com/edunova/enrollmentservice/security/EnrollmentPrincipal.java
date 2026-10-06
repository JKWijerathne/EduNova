package com.edunova.enrollmentservice.security;

public record EnrollmentPrincipal(Long userId, String name, String email) {
}