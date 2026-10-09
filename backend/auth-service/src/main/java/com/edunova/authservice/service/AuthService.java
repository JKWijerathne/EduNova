package com.edunova.authservice.service;

import com.edunova.authservice.dto.AuthResponse;
import com.edunova.authservice.dto.LoginRequest;
import com.edunova.authservice.dto.RegisterRequest;
import com.edunova.authservice.entity.Role;
import com.edunova.authservice.entity.User;
import com.edunova.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleIdentityVerifier googleIdentityVerifier;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Role userRole = Role.STUDENT;

        if (request.getRole() != null && !request.getRole().isBlank()) {
            userRole = Role.valueOf(request.getRole().toUpperCase());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(userRole)
                .build();

        User savedUser = userRepository.save(user);

        String token = jwtService.generateToken(savedUser);

        return createAuthResponse(savedUser, "User registered successfully", token);
    }

    public AuthResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        boolean passwordMatches = passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        );

        if (!passwordMatches) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtService.generateToken(user);

        return createAuthResponse(user, "Login successful", token);
    }

    public AuthResponse googleLogin(String idToken) {
        GoogleIdentity identity = googleIdentityVerifier.verify(idToken);
        String email = identity.email().trim().toLowerCase(Locale.ROOT);

        Optional<User> userForGoogleAccount = userRepository.findByGoogleSubject(identity.subject());
        User user;
        if (userForGoogleAccount.isPresent()) {
            user = userForGoogleAccount.get();
        } else {
            Optional<User> userForEmail = userRepository.findByEmailIgnoreCase(email);
            if (userForEmail.isPresent()) {
                user = userForEmail.get();
                if (user.getGoogleSubject() != null
                        && !user.getGoogleSubject().equals(identity.subject())) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "This email is already linked to a different Google account."
                    );
                }
                user.setGoogleSubject(identity.subject());
                user = userRepository.save(user);
            } else {
                byte[] randomPassword = new byte[32];
                secureRandom.nextBytes(randomPassword);
                String unusablePassword = Base64.getUrlEncoder()
                        .withoutPadding()
                        .encodeToString(randomPassword);
                String name = identity.name() == null || identity.name().isBlank()
                        ? email.substring(0, email.indexOf('@'))
                        : identity.name().trim();
                user = userRepository.save(User.builder()
                        .name(name)
                        .email(email)
                        .password(passwordEncoder.encode(unusablePassword))
                        .googleSubject(identity.subject())
                        .role(Role.STUDENT)
                        .build());
            }
        }

        String token = jwtService.generateToken(user);
        return createAuthResponse(user, "Google sign-in successful", token);
    }

    private AuthResponse createAuthResponse(User user, String message, String token) {
        return AuthResponse.builder()
                .message(message)
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}