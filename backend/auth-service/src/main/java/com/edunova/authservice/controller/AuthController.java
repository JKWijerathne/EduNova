package com.edunova.authservice.controller;

import com.edunova.authservice.dto.AuthResponse;
import com.edunova.authservice.dto.ChangePasswordRequest;
import com.edunova.authservice.dto.GoogleAuthRequest;
import com.edunova.authservice.dto.LoginRequest;
import com.edunova.authservice.dto.ProfileResponse;
import com.edunova.authservice.dto.RegisterRequest;
import com.edunova.authservice.dto.UpdateProfileRequest;
import com.edunova.authservice.security.AuthPrincipal;
import com.edunova.authservice.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(authService.googleLogin(request.getIdToken()));
    }

    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> getProfile(@AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(authService.getProfile(principal.userId()));
    }

    @PatchMapping("/me")
    public ResponseEntity<ProfileResponse> updateProfile(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(authService.updateProfile(principal.userId(), request));
    }

    @PostMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        authService.changePassword(principal.userId(), request);
        return ResponseEntity.noContent().build();
    }
}