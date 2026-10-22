package com.edunova.authservice.service;

import com.edunova.authservice.dto.AuthResponse;
import com.edunova.authservice.dto.ChangePasswordRequest;
import com.edunova.authservice.dto.ProfileResponse;
import com.edunova.authservice.dto.UpdateProfileRequest;
import com.edunova.authservice.entity.Role;
import com.edunova.authservice.entity.User;
import com.edunova.authservice.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTests {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private GoogleIdentityVerifier googleIdentityVerifier;

    @InjectMocks
    private AuthService authService;

    @Test
    void googleSignInCreatesStudentAccountAndIssuesEduNovaToken() {
        when(googleIdentityVerifier.verify("google-id-token"))
                .thenReturn(new GoogleIdentity("google-subject", "Learner@example.com", "Learner"));
        when(userRepository.findByGoogleSubject("google-subject")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("learner@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-random-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User savedUser = invocation.getArgument(0);
            savedUser.setId(27L);
            return savedUser;
        });
        when(jwtService.generateToken(any(User.class))).thenReturn("edunova-jwt");

        AuthResponse response = authService.googleLogin("google-id-token");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getEmail()).isEqualTo("learner@example.com");
        assertThat(savedUser.getName()).isEqualTo("Learner");
        assertThat(savedUser.getGoogleSubject()).isEqualTo("google-subject");
        assertThat(savedUser.getRole()).isEqualTo(Role.STUDENT);
        assertThat(savedUser.getPassword()).isEqualTo("encoded-random-password");
        assertThat(response.getToken()).isEqualTo("edunova-jwt");
        assertThat(response.getUserId()).isEqualTo(27L);
        assertThat(response.getRole()).isEqualTo("STUDENT");
    }

    @Test
    void googleSignInLinksExistingVerifiedEmailWithoutChangingItsRole() {
        User existingUser = User.builder()
                .id(8L)
                .name("Platform admin")
                .email("admin@example.com")
                .password("existing-password-hash")
                .role(Role.ADMIN)
                .build();
        when(googleIdentityVerifier.verify("google-id-token"))
                .thenReturn(new GoogleIdentity("google-subject", "admin@example.com", "Google Name"));
        when(userRepository.findByGoogleSubject("google-subject")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("admin@example.com")).thenReturn(Optional.of(existingUser));
        when(userRepository.save(existingUser)).thenReturn(existingUser);
        when(jwtService.generateToken(existingUser)).thenReturn("edunova-jwt");

        AuthResponse response = authService.googleLogin("google-id-token");

        assertThat(existingUser.getGoogleSubject()).isEqualTo("google-subject");
        assertThat(response.getRole()).isEqualTo("ADMIN");
        verify(passwordEncoder, org.mockito.Mockito.never()).encode(anyString());
    }

    @Test
    void profileUsesTheAuthenticatedAccountAndDoesNotExposeCredentials() {
        User user = User.builder()
                .id(15L)
                .name("Learner Name")
                .email("learner@example.com")
                .password("password-hash")
                .role(Role.STUDENT)
                .build();
        when(userRepository.findById(15L)).thenReturn(Optional.of(user));

        ProfileResponse profile = authService.getProfile(15L);

        assertThat(profile.userId()).isEqualTo(15L);
        assertThat(profile.name()).isEqualTo("Learner Name");
        assertThat(profile.phoneNumber()).isNull();
        assertThat(profile.email()).isEqualTo("learner@example.com");
        assertThat(profile.role()).isEqualTo("STUDENT");
        assertThat(profile.googleAccount()).isFalse();
    }

    @Test
    void profileUpdateChangesOnlyTheName() {
        User user = User.builder()
                .id(15L)
                .name("Old Name")
                .phoneNumber("555-0100")
                .email("learner@example.com")
                .password("password-hash")
                .role(Role.STUDENT)
                .build();
        when(userRepository.findById(15L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        ProfileResponse profile = authService.updateProfile(15L, new UpdateProfileRequest("  New Name  ", " +1 (212) 555-0199 "));

        assertThat(profile.name()).isEqualTo("New Name");
        assertThat(profile.phoneNumber()).isEqualTo("+1 (212) 555-0199");
        assertThat(profile.email()).isEqualTo("learner@example.com");
        assertThat(profile.role()).isEqualTo("STUDENT");
        assertThat(user.getPassword()).isEqualTo("password-hash");
    }

    @Test
    void profileUpdateCanClearPhoneNumber() {
        User user = User.builder()
                .id(15L)
                .name("Learner Name")
                .phoneNumber("555-0100")
                .email("learner@example.com")
                .password("password-hash")
                .role(Role.STUDENT)
                .build();
        when(userRepository.findById(15L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        ProfileResponse profile = authService.updateProfile(15L, new UpdateProfileRequest("Learner Name", "  "));

        assertThat(profile.phoneNumber()).isNull();
        assertThat(user.getPhoneNumber()).isNull();
    }

    @Test
    void passwordChangeRequiresTheCurrentPasswordAndStoresANewHash() {
        User user = User.builder()
                .id(15L)
                .name("Learner Name")
                .email("learner@example.com")
                .password("old-password-hash")
                .role(Role.STUDENT)
                .build();
        when(userRepository.findById(15L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("current-password", "old-password-hash")).thenReturn(true);
        when(passwordEncoder.encode("new-password-123")).thenReturn("new-password-hash");
        when(userRepository.save(user)).thenReturn(user);

        authService.changePassword(15L, new ChangePasswordRequest("current-password", "new-password-123"));

        assertThat(user.getPassword()).isEqualTo("new-password-hash");
        verify(userRepository).save(user);
    }

    @Test
    void passwordChangeRejectsIncorrectCurrentPassword() {
        User user = User.builder()
                .id(15L)
                .password("old-password-hash")
                .role(Role.STUDENT)
                .build();
        when(userRepository.findById(15L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "old-password-hash")).thenReturn(false);

        assertThatThrownBy(() -> authService.changePassword(
                15L,
                new ChangePasswordRequest("wrong-password", "new-password-123")
        )).isInstanceOf(ResponseStatusException.class);

        org.mockito.Mockito.verify(userRepository, org.mockito.Mockito.never()).save(any(User.class));
    }

    @Test
    void googleAccountsCannotChangeTheirPasswordThroughEduNova() {
        User user = User.builder()
                .id(15L)
                .password("random-password-hash")
                .googleSubject("google-subject")
                .role(Role.STUDENT)
                .build();
        when(userRepository.findById(15L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.changePassword(
                15L,
                new ChangePasswordRequest("current-password", "new-password-123")
        )).isInstanceOf(ResponseStatusException.class);

        org.mockito.Mockito.verify(passwordEncoder, org.mockito.Mockito.never()).matches(anyString(), anyString());
        org.mockito.Mockito.verify(userRepository, org.mockito.Mockito.never()).save(any(User.class));
    }
}
