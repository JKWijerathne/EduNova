package com.edunova.apigateway;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false"
})
class ApiGatewayApplicationTests {

    private static final String JWT_SECRET = "EdnVAuth7xKp92LmQ4rTz61BvNc38WsYh";

    @Test
    void contextLoads() {
    }

    @Test
    void missingAuthorizationHeaderReturnsUnauthorized() {
        JwtGlobalFilter filter = new JwtGlobalFilter(JWT_SECRET);
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("http://localhost/api/courses")
        );

        Mono<Void> result = filter.filter(exchange, emptyChain());

        result.block();
        assertThat(exchange.getResponse().getStatusCode().value()).isEqualTo(401);
    }

    @Test
    void malformedAuthorizationHeaderReturnsUnauthorized() {
        JwtGlobalFilter filter = new JwtGlobalFilter(JWT_SECRET);
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("http://localhost/api/courses")
                        .header(HttpHeaders.AUTHORIZATION, "Token abc")
        );

        Mono<Void> result = filter.filter(exchange, emptyChain());

        result.block();
        assertThat(exchange.getResponse().getStatusCode().value()).isEqualTo(401);
    }

    @Test
    void invalidJwtReturnsUnauthorized() {
        JwtGlobalFilter filter = new JwtGlobalFilter(JWT_SECRET);
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("http://localhost/api/courses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer invalid.jwt.token")
        );

        Mono<Void> result = filter.filter(exchange, emptyChain());

        result.block();
        assertThat(exchange.getResponse().getStatusCode().value()).isEqualTo(401);
    }

    @Test
    void validJwtContinuesRequest() {
        JwtGlobalFilter filter = new JwtGlobalFilter(JWT_SECRET);
        String token = createValidToken();
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("http://localhost/api/courses")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
        );

        Mono<Void> result = filter.filter(exchange, emptyChain());

        result.block();
        assertThat(exchange.getResponse().getStatusCode()).isNull();
    }

    @Test
    void authRoutesBypassJwtCheck() {
        JwtGlobalFilter filter = new JwtGlobalFilter(JWT_SECRET);
        MockServerWebExchange exchange = MockServerWebExchange.from(
                MockServerHttpRequest.post("http://localhost/api/auth/login")
        );

        Mono<Void> result = filter.filter(exchange, emptyChain());

        result.block();
        assertThat(exchange.getResponse().getStatusCode()).isNull();
    }

    private GatewayFilterChain emptyChain() {
        return (exchange) -> Mono.empty();
    }

    private String createValidToken() {
        SecretKey key = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .subject("user@example.com")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 60_000L))
                .signWith(key)
                .compact();
    }
}
