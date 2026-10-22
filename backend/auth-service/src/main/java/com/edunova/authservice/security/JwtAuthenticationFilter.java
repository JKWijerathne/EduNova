package com.edunova.authservice.security;

import com.edunova.authservice.service.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authorization.substring("Bearer ".length()).trim();
        Claims claims;
        Long userId;
        String role;
        try {
            if (token.isEmpty() || !jwtService.isTokenValid(token)) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }

            claims = jwtService.extractAllClaims(token);
            Object claimUserId = claims.get("userId");
            role = claims.get("role", String.class);
            userId = claimUserId == null ? null : Long.valueOf(claimUserId.toString());
        } catch (RuntimeException exception) {
            SecurityContextHolder.clearContext();
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        if (userId == null || claims.getSubject() == null || role == null || role.isBlank()) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        String authority = role.trim().toUpperCase(Locale.ROOT);
        if (!authority.startsWith("ROLE_")) {
            authority = "ROLE_" + authority;
        }
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        new AuthPrincipal(userId, claims.getSubject()),
                        null,
                        List.of(new SimpleGrantedAuthority(authority))
                );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        filterChain.doFilter(request, response);
    }
}
