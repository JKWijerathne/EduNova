package com.edunova.authservice.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.List;

@Component
public class GoogleIdentityVerifier {

    private final String clientId;
    private final GoogleIdTokenVerifier verifier;

    public GoogleIdentityVerifier(@Value("${app.google.client-id:}") String clientId) {
        this.clientId = clientId;
        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance()
        ).setAudience(clientId.isBlank() ? List.of() : List.of(clientId))
                .build();
    }

    public GoogleIdentity verify(String credential) {
        if (clientId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Google sign-in is not configured on the authentication service."
            );
        }

        try {
            GoogleIdToken token = verifier.verify(credential);
            if (token == null) {
                throw unauthorized();
            }

            GoogleIdToken.Payload payload = token.getPayload();
            String email = payload.getEmail();
            String subject = payload.getSubject();
            if (!Boolean.TRUE.equals(payload.getEmailVerified())
                    || email == null || email.isBlank()
                    || subject == null || subject.isBlank()) {
                throw unauthorized();
            }

            Object nameClaim = payload.get("name");
            return new GoogleIdentity(subject, email, nameClaim instanceof String name ? name : null);
        } catch (IOException | GeneralSecurityException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Google identity verification is temporarily unavailable.",
                    exception
            );
        }
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "The Google credential is invalid or its email is not verified."
        );
    }
}
